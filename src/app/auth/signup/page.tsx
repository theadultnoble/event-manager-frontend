"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { SignupData } from "@/types";

export default function SignupPage() {
  const [error, setError] = useState("");
  const { signup, isLoading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupData & { confirmPassword: string }>();

  const password = watch("password");

  const onSubmit = async (data: SignupData & { confirmPassword: string }) => {
    try {
      setError("");
      const { confirmPassword: _confirmPassword, ...signupData } = data;
      await signup(signupData);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Sign Up</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <Input
                label="Username"
                {...register("username", {
                  required: "Username is required",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message:
                      "Username can only contain letters, numbers, and underscores",
                  },
                })}
                error={errors.username?.message}
                placeholder="Choose a username"
              />

              <Input
                label="Email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                })}
                error={errors.email?.message}
                placeholder="Enter your email"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="attendee"
                      type="radio"
                      value="Attendee"
                      {...register("role", {
                        required: "Please select a role",
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="attendee"
                      className="ml-3 block text-sm text-gray-700"
                    >
                      <span className="font-medium">Attendee</span>
                      <span className="block text-gray-500">
                        Register for and attend events
                      </span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="organizer"
                      type="radio"
                      value="Organizer"
                      {...register("role", {
                        required: "Please select a role",
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="organizer"
                      className="ml-3 block text-sm text-gray-700"
                    >
                      <span className="font-medium">Organizer</span>
                      <span className="block text-gray-500">
                        Create and manage events
                      </span>
                    </label>
                  </div>
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <Input
                label="Password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                error={errors.password?.message}
                placeholder="Create a password"
              />

              <Input
                label="Confirm Password"
                type="password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
                error={errors.confirmPassword?.message}
                placeholder="Confirm your password"
              />

              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
