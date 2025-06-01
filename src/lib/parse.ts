import Parse from "parse";

// Initialize Parse
Parse.initialize(
  process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID!,
  process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY!
);

Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL!;

export default Parse;
