import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/theme-provider";
import { UserProvider } from "@/context/user-context";
import { NextAuthProvider } from "@/providers/auth-provider";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookerBuddy",
  description: "Streamline your scheduling and booking",
  icons: {
    icon: '/images/bookerbuddy-icon.png',
    apple: '/images/bookerbuddy-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextAuthProvider>
      <html lang="en" suppressHydrationWarning>
        <head></head>
        <body className={jakarta.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <UserProvider>{children}</UserProvider>

            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </NextAuthProvider>
  );
}
