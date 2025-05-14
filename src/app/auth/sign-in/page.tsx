'use client';

import { useState } from 'react';
import { 
  GoogleSignInButton, 
  GoogleAuthDescription,
  EmailPasswordSignInForm, 
  EmailPasswordSignUpForm 
} from "@/components/auth-buttons";

const SignInPage = () => {
  const [authAction, setAuthAction] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {authAction === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {authAction === 'signin' 
              ? 'Sign in to access your account' 
              : 'Sign up to get started with BookerBuddy'}
          </p>
        </div>

        {/* Sign In/Sign Up Toggle */}
        <div className="flex bg-gray-50 p-1 rounded-lg">
          <button
            onClick={() => setAuthAction('signin')}
            className={`w-full py-2 text-sm font-medium rounded-md ${
              authAction === 'signin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthAction('signup')}
            className={`w-full py-2 text-sm font-medium rounded-md ${
              authAction === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google Auth */}
        <div className="mt-6">
          <GoogleSignInButton />
          <GoogleAuthDescription mode={authAction} />
        </div>

        {/* Divider */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">or continue with email</span>
          </div>
        </div>

        {/* Email Forms */}
        <div className="mt-6">
          {authAction === 'signin' ? (
            <EmailPasswordSignInForm />
          ) : (
            <EmailPasswordSignUpForm />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            {authAction === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button 
                  onClick={() => setAuthAction('signup')}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => setAuthAction('signin')}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
