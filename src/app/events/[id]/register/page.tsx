"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Parse from "@/lib/parse";
import { Event } from "@/types";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function EventRegisterPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    console.log("Loading event with ID:", eventId);
    console.log("Parse config check:", {
      appId: !!process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID,
      jsKey: !!process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY,
      serverUrl: !!process.env.NEXT_PUBLIC_PARSE_SERVER_URL,
    });

    try {
      // Check if Parse is properly configured
      if (
        !process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID ||
        !process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY ||
        !process.env.NEXT_PUBLIC_PARSE_SERVER_URL
      ) {
        throw new Error(
          "Parse configuration missing. Please check your environment variables."
        );
      }

      const query = new Parse.Query("Event");
      query.include("organizer");

      const result = await query.get(eventId);
      console.log("Event found:", result);
      console.log("Event attributes:", result.attributes);
      console.log("Organizer data:", result.get("organizer"));

      // Check if organizer exists
      const organizer = result.get("organizer");
      if (!organizer) {
        console.error("Event data:", {
          id: result.id,
          title: result.get("title"),
          location: result.get("location"),
          date: result.get("date"),
          allAttributes: result.attributes,
        });
        throw new Error(
          "Event found but organizer data is missing. This might be a data integrity issue."
        );
      }

      const eventData: Event = {
        objectId: result.id || "",
        title: result.get("title"),
        location: result.get("location"),
        date: result.get("date"),
        attendees: result.get("attendees") || [],
        eventPosterImage: result.get("eventPosterImage"),
        organizer: {
          objectId: organizer.id || "",
          username: organizer.get("username") || "",
          email: organizer.get("email") || "",
          role: organizer.get("role") || "Organizer",
          createdAt: organizer.get("createdAt") || new Date(),
          updatedAt: organizer.get("updatedAt"),
        },
        createdAt: result.get("createdAt"),
        updatedAt: result.get("updatedAt"),
      };

      setEvent(eventData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Event not found";
      setError(errorMessage);
      console.error("Load event error:", err);
      console.log("Event ID being queried:", eventId);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user || !event) return;

    try {
      setError("");
      setRegistering(true);

      const result = await Parse.Cloud.run("registerForEvent", {
        attendeeId: user.objectId,
        eventId: event.objectId,
      });

      if (result.success) {
        setSuccess("Successfully registered for the event!");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (!user || user.role !== "Attendee") {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            Only attendees can register for events.
          </p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">Event Not Found</h1>
          <p className="mt-2 text-gray-600">
            The event you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Events
          </Button>
        </div>
      </Layout>
    );
  }

  const isEventInPast = new Date(event.date) <= new Date();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Event Registration
          </h1>
          <p className="mt-2 text-gray-600">Register for this event</p>
        </div>

        <Card>
          {event.eventPosterImage && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              <img
                src={event.eventPosterImage.url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <h2 className="text-2xl font-semibold text-gray-900">
              {event.title}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="h-5 w-5 mr-3" />
                <span>{event.location}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-3" />
                <span>{format(new Date(event.date), "PPP p")}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <UserIcon className="h-5 w-5 mr-3" />
                <span>Organized by {event.organizer.username}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <CalendarIcon className="h-5 w-5 mr-3" />
                <span>
                  Created on {format(new Date(event.createdAt), "PPP")}
                </span>
              </div>
            </div>

            {isEventInPast && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="text-sm text-yellow-700">
                  This event has already passed. Registration is no longer
                  available.
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1"
              >
                Back to Events
              </Button>

              {!isEventInPast && (
                <Button
                  onClick={handleRegister}
                  loading={registering}
                  disabled={success !== ""}
                  className="flex-1"
                >
                  {success ? "Registered!" : "Register for Event"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
