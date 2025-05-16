"use client";
import { getSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const router = useRouter(); // Use useRouter to get router object

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        const callbackUrl =
          typeof window !== "undefined"
            ? localStorage.getItem("callbackUrl")
            : null; // Retrieve callback URL from localStorage

        if (callbackUrl) {
          router.push(callbackUrl); // Redirect to callback URL if it exists
        } else {
          router.push("/dashboard"); // Otherwise, redirect to dashboard
        }
      }
    };

    checkSession();
  }, [router]);

  const returnHome = () => {
    router.push("/");
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left side - Form area */}
      <div className="relative w-full lg:w-[45%] xl:w-[40%] h-full flex flex-col p-8">
        <div className="absolute top-8 left-8 z-10">
          <button 
            onClick={returnHome} 
            className="focus:outline-none transition-transform hover:scale-105 flex items-center"
            aria-label="Return to home page"
          >
            <Image
              src="/images/bookerbuddy-banner.png"
              alt="BookerBuddy Logo"
              width={120}
              height={40}
              className="object-contain"
              priority
            />
          </button>
        </div>
        <div className="flex h-full w-full items-center justify-center pt-20">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
      
      {/* Right side - App preview */}
      <div className="hidden lg:block relative w-[55%] xl:w-[60%] h-full bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-center opacity-5"></div>
        <div className="relative flex flex-col h-full px-12 pt-24 z-10">
          <div className="max-w-2xl">
            <h2 className="text-gray-900 text-4xl font-bold leading-tight mb-4">
              Hi, I&apos;m your AI powered sales assistant, BookerBuddy!
            </h2>
          </div>
          <div className="relative mt-6">
            <div className="absolute -right-64 top-0 w-[900px] h-[600px] drop-shadow-2xl rounded-lg overflow-hidden transform rotate-2">
              <Image
                src="/images/app-ui.png"
                alt="BookerBuddy Application Interface"
                className="object-cover"
                fill
                sizes="(max-width: 1280px) 100vw, 1200px"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
