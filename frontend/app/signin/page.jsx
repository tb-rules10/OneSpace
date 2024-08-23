"use client";
import { useState } from "react";
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { Input } from "@nextui-org/react";
import { EyeFilledIcon } from "@components/ui/EyeFilledIcon";
import { EyeSlashFilledIcon } from "@components/ui/EyeSlashFilledIcon";
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [view, setView] = useState("login");
  const [isVisible, setIsVisible] = useState(false);
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const router = useRouter();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value.trim() });
  };

  const validateForm = (email, password) => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 8 || !/\d/.test(password)) {
      setPasswordError("Password must be at least 8 characters long and include at least one number");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm(values.email, values.password);
    
    console.log("Credentials:", { email: values.email, password: values.password });

    if (isValid) {
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL; 
      const url = view === "create" ? `${apiUrl}/signup` : `${apiUrl}/signin`;
      console.log(url);
      console.log(view);
      try {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(values),
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          console.log("Response:", await res.json());s
        } else {
          console.error("Error:", await res.text());
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
      

    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row">
      {/* Left Side */}
      <div className="flex-1 flex flex-col items-center justify-center bg-lightBG px-4">
        <div className="w-full max-w-xs text-white flex flex-col justify-between h-[70vh]">
          {/* Selector Buttons */}
          <div className="flex mb-4">
            <button
              onClick={() => setView("login")}
              className={`flex-1 py-2 text-sm font-medium transition-all duration-300 ${
                view === "login"
                  ? "bg-white text-black shadow-md"
                  : "bg-transparent text-white hover:bg-zinc-900/20 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setView("create")}
              className={`flex-1 py-2 text-sm font-medium transition-all duration-300 ${
                view === "create"
                  ? "bg-white text-black shadow-md"
                  : "bg-transparent text-white hover:bg-zinc-900/20 hover:text-white"
              }`}
            >
              Create New Account
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <Input
              type="email"
              name="email"
              label="Email"
              radius="none"
              variant="flat"
              labelPlacement="inside"
              className="w-full"
              value={values.email}
              onChange={handleChange}
              isInvalid={!!emailError}
              errorMessage={emailError}
            />

            {/* Password Input */}
            <Input
              type={isVisible ? "text" : "password"}
              name="password"
              label="Password"
              radius="none"
              variant="flat"
              labelPlacement="inside"
              className="w-full"
              value={values.password}
              onChange={handleChange}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                  aria-label="toggle password visibility"
                >
                  {isVisible ? (
                    <EyeSlashFilledIcon className="text-2xl text-default-400" />
                  ) : (
                    <EyeFilledIcon className="text-2xl text-default-400" />
                  )}
                </button>
              }
              isInvalid={!!passwordError}
              errorMessage={passwordError}
            />
          </div>

          <div>
            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full mt-6 py-2 border border-white text-white font-semibold bg-transparent transition-all duration-300 hover:bg-white hover:text-black hover:drop-shadow-cta"
            >
              {view === "login" ? "Login" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent space-y-4 p-4">
        <p className="text-lg font-semibold text-white mb-4">Continue with</p>

        <div className="flex space-x-10">
          <a
            href="/auth/github"
            className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-150 hover:scale-110 transform hover:drop-shadow-cta"
          >
            <FaGithub className="text-4xl text-gray-800" />
          </a>

          <a
            href="/auth/google"
            className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 transition duration-150 hover:scale-110 transform hover:drop-shadow-cta"
          >
            <FaGoogle className="text-4xl text-gray-800" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
