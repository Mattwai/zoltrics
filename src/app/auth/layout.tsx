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
    <div className="h-screen flex w-full justify-center">
      <div className="w-[600px] ld:w-full flex flex-col items-start p-6">
        <button onClick={returnHome} className="focus:outline-none">
          <Image
            src="/images/logo.png"
            alt="LOGO"
            width={80}
            height={80}
            className="cursor-pointer"
          />
        </button>
        {children}
      </div>
      <div className="hidden lg:flex flex-1 w-full max-h-full max-w-4000px overflow-hidden relative bg-cream  flex-col pt-10 pl-24 gap-3">
        <h2 className="text-gravel md:text-4xl font-bold">
          Hi, I’m your AI powered sales assistant, Zoltrics!
        </h2>
        <p className="text-iridium md:text-sm mb-10">
          Zoltrics is capable of capturing lead information without a form...{" "}
          <br />
          something never done before 😉
        </p>
        <Image
          src="/images/app-ui.png"
          alt="app image"
          loading="lazy"
          sizes="30"
          className="absolute shrink-0 !w-[1600px] top-48"
          width={0}
          height={0}
        />
      </div>
    </div>
  );
};

export default Layout;
