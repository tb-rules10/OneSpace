"use client";
import { useEffect, useState } from "react";
import { ResizableBox } from "react-resizable";
import { useUser } from "@clerk/clerk-react";
import { Header } from "@components/Header";
import Footer from "@components/Footer";
import Terminal from "@components/ide/Terminal";
import FileTree from "@components/ide/FileTree";
import Editor from "@components/ide/Editor";
import Title from "@components/ui/Title";
import { io } from "socket.io-client";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import "react-resizable/css/styles.css";

const socket = io("http://localhost:5000");

const ProjectEditorPage = ({ id }) => {
  const { user } = useUser();
  const [fileTree, setFileTree] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [code, setCode] = useState("");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isSaved = selectedFileContent === code;

  // Fetch file tree from the server based on the project name
  const getFileTree = async () => {
    console.log("Fetching file tree for project:", project.name);
    try {
      const response = await fetch(`http://localhost:5000/files?projectName=${encodeURIComponent(project.name)}`);
      const res = await response.json();
      setFileTree(res.tree);
    } catch (error) {
      console.error("Error fetching file tree:", error);
    }
  };

  useEffect(() => {
    // Fetch project data when component loads
    const id = window.location.pathname.split("/").pop();
    if (!id) return;

    const fetchProject = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pg/${id}`);
        if (!response.ok) throw new Error("Failed to fetch project details");
        const data = await response.json();
        if (data) {
          setProject(data);
          if (data.status === "READY") {
            const newSocket = io("http://localhost:9002");
            newSocket.emit("subscribe", `logs:${data.subDomain}`);
            newSocket.on("message", (message) => setLogs((prevLogs) => [...prevLogs, message]));
            setSocket(newSocket);
          }
        } else {
          setError("No project found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  useEffect(() => {
    // If selected file changes, fetch its content
    if (!selectedFile) return;

    const fetchFileContents = async () => {
      try {
        const projectName = encodeURIComponent(project.name); 
        const filePath = encodeURIComponent(selectedFile); 
    
        const res = await fetch(`http://localhost:5000/files/content?projectName=${projectName}&path=${filePath}`);
        const content = await res.json();
    
        setSelectedFileContent(content.content);
      } catch (error) {
        console.error("Error fetching file content:", error);
      }
    };

    fetchFileContents();
  }, [selectedFile]);

  useEffect(() => {
    // Update the code when file content changes
    if (selectedFile && selectedFileContent) {
      setCode(selectedFileContent || "");
    }
  }, [selectedFile, selectedFileContent]);

  useEffect(() => {
    // Fetch file tree when the project is ready
    if (!project || !project.name) return;

    getFileTree();
    socket.on("file-refresh", getFileTree);

    return () => {
      socket.off("file-refresh");
    };
  }, [project]);

  useEffect(() => {
    // Send code updates to the server after changes
    if (code !== undefined && selectedFile && !isSaved) {
      const timer = setTimeout(() => {
        socket.emit("code-update", code, `${project.name}${selectedFile}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [code, isSaved, selectedFile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Cog6ToothIcon className="w-10 h-10 animate-spin text-zinc-200" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <>
        <Header />
        <div className="pt-32 pb-24 max-w-5xl mx-auto flex flex-col items-center justify-center">
          <Title>Error</Title>
          <p className="text-zinc-400 mt-16">No project found with the given ID.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-32 pb-24 max-w-7xl mx-auto">
        <Title>{project.name}</Title>
        <div className="mt-8 flex flex-col gap-4 rounded-lg border-zinc-500/30 p-6 shadow-lg transition-all duration-200">
          <div
            id="editor-cont"
            className="min-h-[50vh] flex flex-row gap-1 bg-zinc-800 w-full flex-grow rounded-[8px] overflow-hidden border border-zinc-700 shadow-inner"
            style={{ height: '100%' }}  // Ensure this takes full height
          >
            <ResizableBox
              width={300}
              height={Infinity}  // Keeps the ResizableBox height set to full available height
              minConstraints={[150, Infinity]}
              maxConstraints={[400, Infinity]}
              className="bg-zinc-800 h-full overflow-auto p-2 transition-all"
            >
              <FileTree
                onSelect={(path) => setSelectedFile(path)}
                tree={fileTree}
                selectedFile={selectedFile}
              />
            </ResizableBox>
            <div id="editor" className="flex-1">
              {selectedFile && (
                <div className="bg-zinc-800 text-zinc-200 p-2 rounded-t-md font-mono text-sm tracking-wide">
                  {selectedFile.replaceAll("/", " > ")}
                </div>
              )}
              <Editor code={code} setCode={setCode} selectedFile={selectedFile} />
            </div>
          </div>
          <div
            id="terminal-cont"
            className="bg-zinc-800 p-2 rounded-[8px] border border-zinc-700 mt-4 shadow-md"
          >
            <Terminal />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProjectEditorPage;
