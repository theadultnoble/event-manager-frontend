"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Event, UpcomingEventRegistration } from "@/types";
import Parse from "@/lib/parse";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingRegistrations, setUpcomingRegistrations] = useState<
    UpcomingEventRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      loadEvents();
      if (user.role === "Attendee") {
        loadUpcomingRegistrations();
      }
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      console.log("Loading events...");
      const query = new Parse.Query("Event");
      query.include("organizer");
      query.descending("createdAt");

      const results = await query.find();
      console.log("Events loaded successfully:", results.length);

      const eventData = results.map((event) => {
        const organizer = event.get("organizer");

        // Handle cases where organizer data might not be accessible due to ACL
        const organizerData = organizer
          ? {
              objectId: organizer.id || "",
              username: organizer.get("username") || "Event Organizer",
              email: organizer.get("email") || "",
              role: organizer.get("role") || "Organizer",
              createdAt: organizer.get("createdAt") || new Date(),
              updatedAt: organizer.get("updatedAt"),
            }
          : {
              objectId: "unknown",
              username: "Event Organizer",
              email: "",
              role: "Organizer" as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

        return {
          objectId: event.id || "",
          title: event.get("title"),
          location: event.get("location"),
          date: event.get("date"),
          attendees: event.get("attendees") || [],
          organizer: organizerData,
          createdAt: event.get("createdAt"),
          updatedAt: event.get("updatedAt"),
        };
      });

      setEvents(eventData);
    } catch (err) {
      console.error("Load events error:", err);

      // Check if it's a network/server error
      let errorMessage = "Failed to load events";
      if (err instanceof Error) {
        if (
          err.message.includes("Bad Gateway") ||
          err.message.includes("invalid JSON")
        ) {
          errorMessage =
            "Server temporarily unavailable. Please refresh the page or try again in a moment.";
        } else if (err.message.includes("Network")) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    }
  };

  const loadUpcomingRegistrations = async () => {
    try {
      console.log("Loading upcoming registrations...");
      const result = await Parse.Cloud.run("listUpcomingEvents");
      console.log("Cloud function result:", result);

      if (result.success) {
        setUpcomingRegistrations(result.upcomingEvents || []);
        console.log(
          "Upcoming registrations loaded:",
          result.upcomingEvents?.length || 0
        );
      } else {
        console.warn("Cloud function returned error:", result.message);
      }
    } catch (err) {
      console.error("Load upcoming registrations error:", err);

      // Handle network errors gracefully for upcoming registrations
      if (err instanceof Error) {
        if (
          err.message.includes("Bad Gateway") ||
          err.message.includes("invalid JSON")
        ) {
          console.warn(
            "Server temporarily unavailable for upcoming registrations. Will retry later."
          );
        } else {
          console.error(
            "Unexpected error loading upcoming registrations:",
            err.message
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (
    registrationId: string,
    isRegistrationId: boolean
  ) => {
    try {
      console.log(
        "Attempting to cancel registration for registration:",
        registrationId
      );

      setError(""); // Clear any previous errors

      // Try direct object fetching
      try {
        const Registration = Parse.Object.extend("Registration");
        const query = new Parse.Query(Registration);
        const registration = await query.get(registrationId);

        registration.set("status", "canceled");
        registration.set("registered", false);
        await registration.save();

        console.log("Registration cancelled successfully");
        loadUpcomingRegistrations();
        return;
      } catch (directError) {
        console.error("Direct cancellation failed:", directError);
        // Fall back to cloud function
      }

      // Fall back to cloud function
      console.log("Calling cancelEventRegistration with:", {
        registrationId,
        isRegistrationId,
      });
      const result = await Parse.Cloud.run("cancelEventRegistration", {
        registrationId,
        isRegistrationId,
      });

      console.log("Cancel registration result:", result);

      if (result.success) {
        console.log("Registration cancelled successfully, reloading data...");
        // Reload upcoming registrations
        loadUpcomingRegistrations();
      } else {
        console.error("Cancel registration failed:", result.message);
        setError(result.message || "Failed to cancel registration");
      }
    } catch (err) {
      console.error("Cancel registration error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cancel registration"
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Event Manager
          </h1>
          <p className="mt-2 text-gray-600">Please log in to continue</p>
          <Link href="/auth/login">
            <Button className="mt-4">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.username}!
          </h1>
          <p className="mt-2 text-gray-600">
            {user.role === "Organizer"
              ? "Manage your events"
              : "Discover and register for events"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
            <button
              onClick={() => {
                setError("");
                loadEvents();
                if (user?.role === "Attendee") {
                  loadUpcomingRegistrations();
                }
              }}
              className="mt-2 text-xs underline text-red-600 hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Attendee's Upcoming Events */}
        {user.role === "Attendee" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              My Upcoming Events
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : upcomingRegistrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No upcoming events
                  </h3>
                  <p className="mt-2 text-gray-600">
                    You haven&apos;t registered for any events yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingRegistrations.map((registration) => (
                  <Card
                    key={registration.registrationId}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.event.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {registration.event.location}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {format(new Date(registration.event.date), "PPP p")}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          Organized by {registration.event.organizer.username}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log(
                            "Cancel button clicked for registration:",
                            registration
                          );
                          console.log(
                            "Registration ID:",
                            registration.registrationId
                          );
                          handleCancelRegistration(
                            registration.registrationId,
                            true
                          );
                        }}
                        className="w-full mt-4"
                      >
                        Cancel Registration
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Events */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {user.role === "Organizer" ? "All Events" : "Available Events"}
          </h2>
          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No events found
                </h3>
                <p className="mt-2 text-gray-600">
                  {user.role === "Organizer"
                    ? "Create your first event to get started."
                    : "Check back later for new events."}
                </p>
                {user.role === "Organizer" && (
                  <Link href="/events/create">
                    <Button className="mt-4">Create Event</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card
                  key={event.objectId}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {event.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {format(new Date(event.date), "PPP p")}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Organized by {event.organizer.username}
                      </span>
                    </div>
                    {user.role === "Attendee" &&
                      new Date(event.date) > new Date() && (
                        <Link href={`/events/${event.objectId}/register`}>
                          <Button className="w-full mt-4">
                            Register for Event
                          </Button>
                        </Link>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
