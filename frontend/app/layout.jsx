import "@styles/global.css";
import { Inter } from "next/font/google";
import {Providers} from "./providers";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "OneSpace",
  description: "",
};

const RootLayout = ({ children }) => {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
      <body className="main">
        <main className=" min-h-[80vh] ">
        <Providers>
          {children}
        </Providers>
          </main>
      </body>
    </html>
    </ClerkProvider>
  );
};

export default RootLayout;
