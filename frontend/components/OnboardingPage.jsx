"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

const OnboardingPage = () => {
  const { userId, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const checkAndSendUserData = async () => {
      if (isSignedIn && userId && user) {
        const storedUserData = localStorage.getItem("one-space-user");

        if (!storedUserData) {
          const userData = {
            id: userId,
            email:
              user?.primaryEmailAddress?.emailAddress ||
              user?.emailAddresses[0]?.emailAddress ||
              "",
            username: user?.username || user?.firstName || user?.lastName || "",
          };

          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/user`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("---> User Logged In");
            // console.log(data);
            localStorage.setItem("one-space-user", JSON.stringify(data));

          } catch (error) {
            console.error("Error sending user data to backend:", error);
          }
        }
      } else if (!isSignedIn) {
        console.log("---> User Logged Out");
        localStorage.removeItem("one-space-user");
      }
    };

    checkAndSendUserData();
  }, [isSignedIn, userId, user]);

  const handleLinkClick = (path) => {
    if (userId) {
      router.push(path); // Navigate if the user is signed in
    } else {
      openSignIn(); // Open sign-in modal if not signed in
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-8 md:gap-16 md:pb-16 xl:pb-24">
      <div className="flex flex-col items-center justify-center max-w-3xl px-8 mx-auto mt-8 sm:min-h-screen sm:mt-0 sm:px-0">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <Link
            href="https://github.com/tb-rules10/onespace"
            target="_blank"
            className="text-zinc-400 relative overflow-hidden rounded-full py-1.5 px-4 text-sm leading-6 ring-1 ring-zinc-100/10 hover:ring-zinc-100/30 duration-150"
          >
            We're Open Source on{" "}
            <span className="font-semibold text-zinc-200">
              GitHub <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        </div>
        <div>
          <h1 className="py-4 text-5xl font-bold tracking-tight text-center text-transparent bg-gradient-to-t bg-clip-text from-zinc-100/50 to-white sm:text-7xl">
            Smooth Development Instant Deployment
          </h1>
          <p className="mt-6 leading-5 text-zinc-600 sm:text-center">
            Seamless hosting for serverless websites - from development to
            deployment, all in one space.
          </p>
          <div className="flex flex-col justify-center gap-4 mx-auto mt-8 sm:flex-row sm:max-w-lg ">
            <button
              onClick={() => handleLinkClick("/develop")}
              className="sm:w-1/2 sm:text-center inline-block space-x-2 rounded px-4 py-1.5 md:py-2 text-base font-semibold leading-7 text-white  ring-1 ring-zinc-600 hover:bg-white hover:text-zinc-900 duration-150 hover:ring-white hover:drop-shadow-cta"
            >
              Develop
            </button>
            <button
              onClick={() => handleLinkClick("/deploy")}
              className="sm:w-1/2 sm:text-center inline-block transition-all space-x-2  rounded px-4 py-1.5 md:py-2 text-base font-semibold leading-7 text-zinc-800   bg-zinc-50 ring-1 ring-transparent hover:text-zinc-100 hover:ring-zinc-600/80  hover:bg-zinc-900/20 duration-150 hover:drop-shadow-cta"
            >
              <span>Deploy</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
      <h2 className="py-4 text-3xl font-bold text-center text-zinc-300 ">
        Join a vibrant community of forward-thinkers
      </h2>
    </div>
  );
};

export default OnboardingPage;
