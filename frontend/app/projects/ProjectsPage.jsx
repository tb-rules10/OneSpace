"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/clerk-react';
import Title from "@components/ui/Title";
import { Cog6ToothIcon } from "@heroicons/react/24/outline"; // Import the icon

const ProjectsPage = () => {
  const { user } = useUser(); 
  const userId = user?.id;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchProjects = async () => {
    // await new Promise(resolve => setTimeout(resolve, 3000));  
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        console.log(data);
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen w-full">
      <Cog6ToothIcon className="w-10 h-10 animate-spin text-zinc-200" />
    </div>
  );
  
  return (
    <>
      <div className="pt-32 pb-24 max-w-6xl mx-auto">
        <Title>Projects</Title>
        <div className="mt-16">
          <ul
            className="grid max-w-full grid-cols-1 gap-8 mx-auto sm:gap-8 lg:max-w-none md:grid-cols-3 sm:grid-cols-2 md-px-0 px-8"
          >
            {projects.length === 0 ? (
              <p className="text-zinc-400">No projects found.</p>
            ) : (
              projects.map((project) => (
                <li
                  key={project.id}
                  className="cursor-pointer flex flex-col justify-between duration-150 border rounded border-zinc-500/30 hover:border-zinc-300/30 hover:bg-zinc-900/30 group"
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-lg font-medium text-zinc-200 p-6 whitespace-pre-line"
                  >
                    {project.name}
                  </Link>
                  <div className="relative flex items-center justify-between p-4 duration-150 border-t bg-zinc-900/40 border-zinc-500/30 group-hover:border-zinc-300/30">
                    <span className="text-sm text-zinc-500">{project.subDomain}</span>
                    <div className="overflow-hidden rounded-full bg-zinc-50">
                      {/* <svg
                        className="w-6 h-6 text-zinc-200 group-hover:text-zinc-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        ></path>
                      </svg> */}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ProjectsPage;
