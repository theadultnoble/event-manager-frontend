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
      query.descending("createdAt");

      const results = await query.find();
      const eventData = results.map((event) => ({
        objectId: event.id || "",
        title: event.get("title"),
        location: event.get("location"),
        date: event.get("date"),
        attendees: event.get("attendees") || [],
        eventPosterImage: event.get("eventPosterImage"),
        organizer: {
          objectId: event.get("organizer")?.id || "",
          username: event.get("organizer")?.get("username"),
          email: event.get("organizer")?.get("email"),
          role: event.get("organizer")?.get("role"),
          createdAt: event.get("organizer")?.get("createdAt"),
          updatedAt: event.get("organizer")?.get("updatedAt"),
        },
        createdAt: event.get("createdAt"),
        updatedAt: event.get("updatedAt"),
      }));

      setEvents(eventData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load events";
      setError(errorMessage);
      console.error("Load events error:", err);
    }
  };

  const loadUpcomingRegistrations = async () => {
    try {
      const result = await Parse.Cloud.run("listUpcomingEvents");
      if (result.success) {
        setUpcomingRegistrations(result.upcomingEvents || []);
      }
    } catch (err) {
      console.error("Load upcoming registrations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    try {
      const result = await Parse.Cloud.run("cancelEventRegistration", {
        eventId,
      });
      if (result.success) {
        // Reload upcoming registrations
        loadUpcomingRegistrations();
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
                    {registration.event.eventPosterImage && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={registration.event.eventPosterImage.url}
                          alt={registration.event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
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
                          Organized by {registration.event.organizer?.username}
                        </span>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() =>
                          handleCancelRegistration(registration.event.objectId)
                        }
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
