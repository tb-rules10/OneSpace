"use client";
import { useState } from "react";
import Title from "@components/ui/Title";
import { useUser } from "@clerk/clerk-react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation"; 

const DeployPage = () => {
  const { user } = useUser(); 
  const userId = user?.id;
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    setError("");
    if (!projectName.trim()) {
      setError("Project Name is required.");
      return false;
    }
    if (projectName.length < 3) {
      setError("Project Name must be at least 3 characters long.");
      return false;
    }
    if (!githubUrl.trim()) {
      setError("GitHub URL is required.");
      return false;
    }
    const urlPattern = /^(https?:\/\/)?(www\.)?github\.com\/[A-z0-9_-]+\/[A-z0-9_-]+(\/)?$/;
    if (!urlPattern.test(githubUrl)) {
      setError("Please enter a valid GitHub URL.");
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    await new Promise(resolve => setTimeout(resolve, 1000));  
    if (validateForm()) {
      setLoading(true);
      const userData = {
        name: projectName,
        gitURL: githubUrl,
        userId: userId,
      };
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Project created successfully:", result);
        router.push("/projects");
      } catch (error) {
        console.error("Error creating project:", error);
        setError(error.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="pt-32 pb-40 ">
      <form className="max-w-3xl mx-auto" onSubmit={onSubmit}>
        <Title>Create a new Project</Title>
        <pre className="px-4 py-3 mt-8 font-mono text-left bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
          <div className="flex items-start px-1 text-sm">
            <textarea
              id="githubUrl"
              name="githubUrl"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              rows={Math.max(1, githubUrl.split("\n").length)}
              placeholder="GITHUB_URL=https://github.com/your-repo-url"
              className="w-full p-0 text-base bg-transparent border-0 appearance-none resize-none hover:resize text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
            />
          </div>
        </pre>
        <pre className="px-4 py-3 mt-8 font-mono text-left bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
          <div className="flex items-start px-1 text-sm">
            <textarea
              id="projectName"
              name="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              rows={Math.max(1, projectName.split("\n").length)}
              placeholder="PROJECT_NAME=OneSpace"
              className="w-full p-0 text-base bg-transparent border-0 appearance-none resize-none hover:resize text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
            />
          </div>
        </pre>
        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className={`mt-6 w-full h-12 inline-flex justify-center items-center transition-all rounded px-4 py-1.5 md:py-2 text-base font-semibold leading-7 bg-zinc-200 ring-1 ring-transparent duration-150 text-zinc-900 hover:text-zinc-100 hover:ring-zinc-600/80 hover:bg-zinc-900/20 active:bg-zinc-800 active:ring-zinc-500 focus:outline-none ${loading ? "animate-pulse" : ""}`}
            onMouseDown={(e) => e.currentTarget.classList.add("scale-95")}
            onMouseUp={(e) => e.currentTarget.classList.remove("scale-95")}
            onMouseLeave={(e) => e.currentTarget.classList.remove("scale-95")}
          >
            <span>
              {loading ? <Cog6ToothIcon className="w-5 h-5 animate-spin" /> : "Create"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeployPage;
