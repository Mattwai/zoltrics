"use client";
import { onGetUser } from "@/actions/settings";
import { useSession } from "next-auth/react";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Define a type for the user context if you're using TypeScript
interface User {
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create UserContext with default value
export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

// UserProvider component to provide user data to its children
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await onGetUser();
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    if (session?.user) {
      fetchUser();
    }
  }, [session]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
