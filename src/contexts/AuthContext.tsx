"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Parse from "@/lib/parse";
import { User, AuthContextType, SignupData } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        setUser({
          objectId: currentUser.id || "",
          username: currentUser.get("username") || "",
          email: currentUser.get("email") || "",
          role: currentUser.get("role") || "Attendee",
          name: currentUser.get("name"),
          createdAt: currentUser.get("createdAt"),
          updatedAt: currentUser.get("updatedAt"),
        });
      }
    } catch (error) {
      console.error("Error checking current user:", error);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const parseUser = await Parse.User.logIn(username, password);

      const userData: User = {
        objectId: parseUser.id || "",
        username: parseUser.get("username") || "",
        email: parseUser.get("email") || "",
        role: parseUser.get("role") || "Attendee",
        name: parseUser.get("name"),
        createdAt: parseUser.get("createdAt"),
        updatedAt: parseUser.get("updatedAt"),
      };

      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      setIsLoading(true);

      // Use the cloud function to create user
      const result = await Parse.Cloud.run("createUser", {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });

      if (result.success) {
        // After successful signup, log the user in
        await login(userData.username, userData.password);
      } else {
        throw new Error(result.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await Parse.User.logOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
