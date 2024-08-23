"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";

export const Header = () => {
  const pathname = usePathname();
  const { openSignIn } = useClerk();

  const handleSignInClick = () => {
    console.log("clicked");
  };

  return (
    <header className="top-0 z-30 w-full px-4 sm:fixed backdrop-blur bh-zinc-900/50">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-between gap-2 pt-6 sm:h-20 sm:flex-row sm:pt-0">
          <Link
            href="/"
            className="text-2xl font-semibold duration-150 text-zinc-100 hover:text-white"
          >
            OneSpace
          </Link>
          <nav className="flex items-center grow">
            <ul className="flex flex-wrap items-center justify-end gap-4 grow">
              <SignedOut>
                <li
                  onClick={openSignIn}
                  className="cursor-pointer flex items-center px-3 py-2 duration-150 text-sm sm:text-base hover:text-zinc-50 text-zinc-400"
                >
                  Get Started
                </li>
              </SignedOut>

              <SignedIn>
                <li>
                  <Link
                    href="/playgrounds"
                    className="cursor-pointer flex items-center px-3 py-2 duration-150 text-sm sm:text-base hover:text-zinc-50 text-zinc-400"
                  >
                    Playgrounds
                  </Link>
                </li>

                <li>
                  <Link
                    href="/projects"
                    className="cursor-pointer flex items-center px-3 py-2 duration-150 text-sm sm:text-base hover:text-zinc-50 text-zinc-400"
                  >
                    Projects
                  </Link>
                </li>

                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8",
                    },
                  }}
                />
              </SignedIn>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};
