"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Parse from "@/lib/parse";
import { CreateEventData } from "@/types";

export default function CreateEventPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventData>();

  // Test Parse connection
  const testConnection = async () => {
    try {
      setConnectionStatus("Testing connection...");
      console.log("Testing Parse connection...");

      // Check environment variables
      if (
        !process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID ||
        !process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY ||
        !process.env.NEXT_PUBLIC_PARSE_SERVER_URL
      ) {
        throw new Error("Environment variables not configured");
      }

      // Test basic Parse query
      const query = new Parse.Query("_User");
      query.limit(1);
      await query.find();

      setConnectionStatus("✅ Connection successful!");
      setTimeout(() => setConnectionStatus(""), 3000);
    } catch (err) {
      console.error("Connection test failed:", err);
      setConnectionStatus(
        `❌ Connection failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const onSubmit = async (data: CreateEventData) => {
    try {
      setError("");
      setLoading(true);

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check Parse configuration
      if (
        !process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID ||
        !process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY ||
        !process.env.NEXT_PUBLIC_PARSE_SERVER_URL
      ) {
        throw new Error(
          "Parse configuration missing. Please check your environment variables."
        );
      }

      // Test Parse connection first
      try {
        const testQuery = new Parse.Query("_User");
        testQuery.limit(1);
        await testQuery.find();
        console.log("Parse connection test successful");
      } catch (connectionError) {
        console.error("Parse connection test failed:", connectionError);
        throw new Error(
          "Unable to connect to Parse Server. Please check your configuration."
        );
      }

      // Create event using cloud function
      const result = await Parse.Cloud.run("createEvent", {
        title: data.title,
        location: data.location,
        date: new Date(data.date).toISOString(),
        organizerId: user.objectId,
      });

      if (result.success) {
        router.push("/");
      } else {
        throw new Error(result.message || "Failed to create event");
      }
    } catch (err) {
      console.error("Event creation error:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to create event";
      if (err instanceof Error) {
        if (err.message.includes("Parse configuration")) {
          errorMessage =
            "Parse Server configuration is missing. Please check your environment variables.";
        } else if (err.message.includes("connection")) {
          errorMessage =
            "Cannot connect to Parse Server. Please check your server URL and credentials.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "Organizer") {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            Only organizers can create events.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-2 text-gray-600">
            Fill out the details for your event
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Event Details
            </h2>
            {connectionStatus && (
              <div className="mt-2 text-sm">{connectionStatus}</div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                  <button
                    type="button"
                    onClick={testConnection}
                    className="mt-2 text-xs underline text-red-600 hover:text-red-800"
                  >
                    Test Parse Connection
                  </button>
                </div>
              )}

              <Input
                label="Event Title"
                {...register("title", {
                  required: "Event title is required",
                  minLength: {
                    value: 3,
                    message: "Title must be at least 3 characters",
                  },
                })}
                error={errors.title?.message}
                placeholder="Enter event title"
              />

              <Input
                label="Location"
                {...register("location", {
                  required: "Location is required",
                  minLength: {
                    value: 3,
                    message: "Location must be at least 3 characters",
                  },
                })}
                error={errors.location?.message}
                placeholder="Enter event location"
              />

              <Input
                label="Date & Time"
                type="datetime-local"
                {...register("date", {
                  required: "Date is required",
                  validate: (value) => {
                    const eventDate = new Date(value);
                    const now = new Date();
                    return (
                      eventDate > now || "Event date must be in the future"
                    );
                  },
                })}
                error={errors.date?.message}
              />

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Create Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
