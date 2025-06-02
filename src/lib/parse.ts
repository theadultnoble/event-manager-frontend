import Parse from "parse";

// Ensure we only initialize Parse once
let isInitialized = false;

const initializeParse = () => {
  if (isInitialized) return;

  const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
  const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
  const serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

  if (!appId || !jsKey || !serverURL) {
    console.error(
      "Parse environment variables are missing. Authentication and data operations will fail."
    );
    return;
  }

  try {
    Parse.initialize(appId, jsKey);
    Parse.serverURL = serverURL;
    isInitialized = true;
    console.log("Parse initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Parse:", error);
  }
};

// Initialize Parse if we're in a browser environment
if (typeof window !== "undefined") {
  initializeParse();
}

export default Parse;
