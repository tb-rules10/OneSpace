"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import Title from "@components/ui/Title";
import { useUser } from "@clerk/clerk-react";
import Link from "next/link";
import { Header } from "@components/Header";
import Footer from "@components/Footer";
import { Cog6ToothIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";

const ProjectDetailPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [socket, setSocket] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    if (!id) return;

    const fetchProject = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`);
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
  }, [router]);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  const startDeployment = async () => {
    setDeploying(true);
    setLogs([]);
    try {
      const response = await fetch(`http://localhost:9000/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!response.ok) throw new Error("Failed to start deployment");
      setProject((prevProject) => ({ ...prevProject, status: "IN_PROGRESS" }));

      const newSocket = io("http://localhost:9002");
      newSocket.emit("subscribe", `logs:${project.subDomain}`);
      newSocket.on("message", (message) => setLogs((prevLogs) => [...prevLogs, message]));
      setSocket(newSocket);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeploying(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  const handleEdit = () => {
    alert("Edit project action");
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:9000/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete project.");
      router.push("/projects");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (logs.some((log) => log.toString().includes("Disconnecting"))) {
      setProject((prevProject) => ({ ...prevProject, status: "READY" }));
    }
  }, [logs]);

  const formatLogMessage = (log) => {
    if (log.toString().includes("Disconnecting")) console.log("--------end");
    if (log.toString().includes(project.subDomain)) return log;
    const trimmedLog = log.slice(8, -2);
    return trimmedLog.split("\\n").join("<br />");
  };

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
      <div className="pt-32 pb-24 max-w-5xl mx-auto">
        <Title>{project.name}</Title>
        <div className="mt-8 flex flex-col md:flex-row gap-8 lg:mx-0 mx-8">
          <div className="flex-1 border rounded-lg border-zinc-500/30 bg-zinc-900/40 relative p-6 flex flex-col">
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg text-zinc-300 font-medium mb-4">Project Details</h2>
                <div className="absolute top-6 right-6">
                  <button onClick={toggleMenu} className="text-zinc-500 hover:text-zinc-300 focus:outline-none">
                    <EllipsisVerticalIcon className="h-6 w-6" />
                  </button>
                  {menuOpen && (
                    <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10">
                      <ul className="py-2">
                        <li onClick={handleEdit} className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer">
                          Edit (In Development)
                        </li>
                        <li onClick={handleDelete} className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer">
                          Delete
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-zinc-400"><strong>Git URL:</strong> {project.gitURL}</p>
                <p className="text-sm text-zinc-400 mt-2"><strong>Subdomain:</strong> {project.subDomain}</p>
                <p className="text-sm text-zinc-400 mt-2"><strong>Status:</strong> {project.status}</p>
              </div>
            </div>
            <Link href={`http://${project.subDomain}.${process.env.NEXT_PUBLIC_REVERSE_PROXY_URL}`} target="_blank" className="block">
              <div className="relative flex items-center justify-between mt-4 p-4 duration-150 border-1 bg-zinc-900/40 border-zinc-500/30 hover:shadow-lg hover:bg-zinc-800/40">
                <span className="text-sm text-zinc-500 hover:text-zinc-300">{project.subDomain}</span>
                <div className="overflow-hidden rounded-full bg-zinc-50">
                  {project.status === "NOT_STARTED" && <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                  {project.status === "IN_PROGRESS" && <Cog6ToothIcon className="w-6 h-6 text-yellow-500 animate-spin" />}
                  {project.status === "READY" && <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            </Link>
          </div>
          <div className="flex-1 border rounded-lg border-zinc-500/30 bg-zinc-900/40 p-6 flex flex-col">
            <div className="flex-grow">
              <h2 className="text-lg text-zinc-300 font-medium mb-4">Logs</h2>
              <div className="h-[50vh] overflow-y-auto p-4 bg-zinc-800 rounded border border-zinc-500">
                {logs.length === 2 ? (
                  <p className="text-sm text-zinc-400">No logs available.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="bg-zinc-700 p-2 mb-2 rounded">
                      <pre className="text-sm text-zinc-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatLogMessage(log) }} />
                    </div>
                  ))
                )}
              </div>
            </div>
            <button
              onClick={startDeployment}
              className={`mt-6 w-full h-12 inline-flex justify-center items-center transition-all rounded px-4 py-1.5 md:py-2 text-base font-semibold leading-7 bg-zinc-200 ring-1 ring-transparent duration-150 text-zinc-900 hover:text-zinc-100 hover:ring-zinc-600/80 hover:bg-zinc-900/20 active:bg-zinc-800 active:ring-zinc-500 focus:outline-none ${deploying || project.status === "IN_PROGRESS" ? "animate-pulse" : ""}`}
              disabled={deploying || project.status === "IN_PROGRESS"}
            >
              {deploying || project.status === "IN_PROGRESS" ? "Deploying" : project.status === "READY" ? "Deploy Again" : "Start Deployment"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProjectDetailPage;
