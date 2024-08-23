import Link from "next/link";
import { Header } from "@components/Header"
import Footer from "@components/Footer"
import OnboardingPage from "@components/OnboardingPage"
import HomePage from "@components/HomePage"
import {
  SignedIn,
  SignedOut,
  UserButton,
  useClerk,
} from "@clerk/nextjs";


const Home = () => {

return (
    <>
        <Header />
        {/* <SignedOut> */}
          <OnboardingPage />
        {/* </SignedOut> */}
{/* 
        <SignedIn>
          <HomePage />
        </SignedIn> */}

        <Footer />
    </>
  );
}

export default Home
