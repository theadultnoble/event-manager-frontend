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
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventData>();

  // Compress image if it's too large
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1200px width)
        const maxWidth = 1200;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

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
      setUploadProgress("Validating...");

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check Parse configuration with detailed logging
      console.log("Parse configuration check:", {
        appId: process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID,
        jsKey: process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY ? "SET" : "MISSING",
        serverUrl: process.env.NEXT_PUBLIC_PARSE_SERVER_URL,
      });

      if (
        !process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID ||
        !process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY ||
        !process.env.NEXT_PUBLIC_PARSE_SERVER_URL
      ) {
        throw new Error(
          "Parse configuration missing. Please check your environment variables."
        );
      }

      if (!data.image || data.image.length === 0) {
        throw new Error("Event poster image is required");
      }

      setUploadProgress("Preparing image...");

      // Get and potentially compress the image
      let imageFile = data.image[0];
      console.log("Original image size:", imageFile.size, "bytes");

      // Compress image if it's larger than 1MB (more aggressive)
      if (imageFile.size > 1 * 1024 * 1024) {
        setUploadProgress("Compressing image...");
        imageFile = await compressImage(imageFile);
        console.log(
          "Image compressed from",
          data.image[0].size,
          "to",
          imageFile.size,
          "bytes"
        );
      }

      // Test Parse connection first
      setUploadProgress("Testing connection...");
      try {
        // Try a simple Parse operation first to test connectivity
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

      // Upload image file to Parse with shorter timeout
      setUploadProgress("Uploading image...");
      const parseFile = new Parse.File(imageFile.name, imageFile);

      console.log("Starting file upload...");
      console.log("File details:", {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
      });

      // Reduce timeout to 15 seconds and add more specific error handling
      const uploadPromise = parseFile.save();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Image upload timeout after 15 seconds. This usually indicates a Parse Server configuration issue."
              )
            ),
          15000
        )
      );

      await Promise.race([uploadPromise, timeoutPromise]);
      console.log("Image uploaded successfully:", parseFile);
      console.log("Image URL:", parseFile.url());

      setUploadProgress("Creating event...");

      // Create event using cloud function
      const result = await Parse.Cloud.run("createEvent", {
        title: data.title,
        location: data.location,
        date: new Date(data.date).toISOString(),
        organizerId: user.objectId,
        eventPosterImage: {
          name: parseFile.name(),
          url: parseFile.url(),
        },
      });

      if (result.success) {
        setUploadProgress("Event created successfully!");
        router.push("/");
      } else {
        throw new Error(result.message || "Failed to create event");
      }
    } catch (err) {
      console.error("Event creation error:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to create event";
      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
          errorMessage =
            "Upload timeout - this usually means Parse Server is not configured properly or is unreachable. Please check your environment variables.";
        } else if (err.message.includes("Parse configuration")) {
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
      setUploadProgress("");
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

              {uploadProgress && (
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="text-sm text-blue-700 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    {uploadProgress}
                  </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Poster Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  {...register("image", {
                    required: "Event poster image is required",
                    validate: (files) => {
                      if (!files || files.length === 0) {
                        return "Please select an image file";
                      }
                      const file = files[0];
                      const validTypes = [
                        "image/jpeg",
                        "image/jpg",
                        "image/png",
                        "image/gif",
                        "image/webp",
                      ];
                      if (!validTypes.includes(file.type)) {
                        return "Please select a valid image file (JPEG, PNG, GIF, or WebP)";
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        // 10MB limit (will be compressed)
                        return "Image size must be less than 10MB";
                      }
                      return true;
                    },
                  })}
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.image.message}
                  </p>
                )}

                <p className="mt-1 text-sm text-gray-500">
                  Images larger than 2MB will be automatically compressed for
                  faster upload.
                </p>

                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Event poster preview"
                      className="max-w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>

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
