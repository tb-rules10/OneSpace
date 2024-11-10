"use client";
import { useState } from "react";
import Title from "@components/ui/Title";
import { useUser } from "@clerk/clerk-react";
import { Cog6ToothIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { generateSlug } from "random-word-slugs"; // Import the random-word-slugs

const DevelopPage = () => {
  const { user } = useUser();
  const userId = user?.id;
  const router = useRouter();

  // const environments = [
  //   { value: "nodejs", label: "Node.js" },
  //   { value: "python", label: "Python" },
  //   { value: "java", label: "Java" },
  //   { value: "ruby", label: "Ruby" },
  //   { value: "go", label: "Go" },
  //   { value: "php", label: "PHP" },
  // ];

  const environments = [
    { value: "bash", label: "Git Bash" },
    { value: "powershell", label: "PowerShell" },
  ];

  const [playgroundName, setPlaygroundName] = useState("");
  const [environment, setEnvironment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    setError("");
  
    if (!playgroundName.trim()) {
      setError("Playground Name is required.");
      return false;
    }
  
    if (playgroundName.length < 3) {
      setError("Playground Name must be at least 3 characters long.");
      return false;
    }
  
    const validNamePattern = /^[a-zA-Z0-9-]+$/;
    if (!validNamePattern.test(playgroundName)) {
      setError("Playground Name can only contain letters, numbers, and hyphens.");
      return false;
    }
  
    if (!environment) {
      setError("Please select a Development Environment.");
      return false;
    }
  
    return true;
  };
  

  const generateRandomName = () => {
    const randomName = generateSlug(3); 
    setPlaygroundName(randomName); 
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (validateForm()) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const userData = {
          userId, 
          env: environment,
          name: playgroundName,
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pg`, {
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
        router.push("/playgrounds");
      } catch (error) {
        console.error("Error creating playground:", error);
        setError(error.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-40">
      <form className="max-w-3xl mx-auto" onSubmit={onSubmit}>
        <Title>Create a new Playground</Title>

        {/* Playground Name Input with Randomize Button */}
        <pre className="px-4 py-3 mt-8 font-mono text-left bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
          <div className="flex items-start justify-between px-1 text-sm">
            <textarea
              id="playgroundName"
              name="playgroundName"
              value={playgroundName}
              onChange={(e) => setPlaygroundName(e.target.value)}
              rows={Math.max(1, playgroundName.split("\n").length)}
              placeholder="PLAYGROUND NAME"
              className="w-full p-0 text-base bg-transparent border-0 appearance-none resize-none hover:resize text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
            />
            <button
              type="button"
              onClick={generateRandomName} // Call the function on button click
              className="ml-2 text-sm text-zinc-500 hover:text-zinc-200"
            >
              Randomize
            </button>
          </div>
        </pre>

        {/* Environment Dropdown */}
        <pre className="px-4 py-3 mt-8 font-mono text-left bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
          <div className="relative flex items-center justify-between px-1 text-sm cursor-pointer">
            <select
              id="environment"
              name="environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className={`w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 focus:ring-0 sm:text-sm ${
                environment === "" ? "text-zinc-500" : ""
              }`}
            >
              <option value="" disabled className="bg-[#111113]">
                SELECT AN ENVIRONMENT
              </option>
              {environments.map((env) => (
                <option
                  key={env.value}
                  value={env.value}
                  className="bg-[#111113] cursor-pointer"
                >
                  {env.label}
                </option>
              ))}
            </select>

            <ChevronDownIcon className="absolute hover:text-zinc-200 right-2 w-5 h-5 text-zinc-500 pointer-events-none" />
          </div>
        </pre>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className={`mt-6 w-full h-12 inline-flex justify-center items-center transition-all rounded px-4 py-1.5 md:py-2 text-base font-semibold leading-7 bg-zinc-200 ring-1 ring-transparent duration-150 text-zinc-900 hover:text-zinc-100 hover:ring-zinc-600/80 hover:bg-zinc-900/20 active:bg-zinc-800 active:ring-zinc-500 focus:outline-none ${
              loading ? "animate-pulse" : ""
            }`}
            onMouseDown={(e) => e.currentTarget.classList.add("scale-95")}
            onMouseUp={(e) => e.currentTarget.classList.remove("scale-95")}
            onMouseLeave={(e) => e.currentTarget.classList.remove("scale-95")}
          >
            <span>
              {loading ? (
                <Cog6ToothIcon className="w-5 h-5 animate-spin" />
              ) : (
                "Create"
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DevelopPage;
