"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export function GoogleSignInButton() {
  const handleClick = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <Image src="/images/google.png" alt="Google Logo" width={20} height={20} className="mr-2" />
      Continue with Google
    </button>
  );
}

// Add a description note for Google authentication
export function GoogleAuthDescription({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  return (
    <p className="text-sm text-center text-gray-600 mt-2">
      {mode === 'signin' 
        ? "Sign in with your Google account. If you don't have an account yet, one will be created for you."
        : "Create a new account using your Google credentials. If you already have an account, you'll be signed in."}
    </p>
  );
}

// Re-export the EmailPasswordSignInForm and EmailPasswordSignUpForm for easier imports
export { EmailPasswordSignInForm, EmailPasswordSignUpForm } from "./EmailPasswordAuth";
