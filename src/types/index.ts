export interface User {
  objectId: string;
  username: string;
  email: string;
  role: "Attendee" | "Organizer";
  name?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Event {
  objectId: string;
  title: string;
  location: string;
  date: Date;
  attendees: string[];
  eventPosterImage?: {
    name: string;
    url: string;
  };
  organizer: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Registration {
  objectId: string;
  event: Event;
  attendee: User;
  registered: boolean;
  status: "registered" | "canceled";
  createdAt: Date;
  updatedAt: Date;
}

export interface UpcomingEventRegistration {
  registrationId: string;
  registrationDate: Date;
  event: Event;
  status: string;
  registered: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  count?: number;
  data?: T;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  role: "Attendee" | "Organizer";
}

export interface CreateEventData {
  title: string;
  location: string;
  date: string;
  image?: FileList;
}
