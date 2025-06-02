import Parse from "parse";

// Initialize Parse immediately when the module loads
const appId = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const jsKey = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
const serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

console.log("=== Parse Initialization Debug ===");
console.log("Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  isClient: typeof window !== "undefined",
  allEnvVars: Object.keys(process.env).filter((key) =>
    key.startsWith("NEXT_PUBLIC_PARSE")
  ),
});

console.log("Parse Environment Variables Check:", {
  appId: appId ? `${appId.substring(0, 8)}...` : "missing",
  jsKey: jsKey ? `${jsKey.substring(0, 8)}...` : "missing",
  serverURL: serverURL || "missing",
});

console.log("Raw environment variables:", {
  appId: appId,
  jsKey: jsKey,
  serverURL: serverURL,
});

if (!appId || !jsKey || !serverURL) {
  console.warn(
    "Parse environment variables are missing. Some features may not work."
  );
  console.warn("Please set:");
  console.warn("- NEXT_PUBLIC_PARSE_APPLICATION_ID");
  console.warn("- NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY");
  console.warn("- NEXT_PUBLIC_PARSE_SERVER_URL");
} else if (
  appId === "your_parse_app_id" ||
  jsKey === "your_parse_javascript_key" ||
  serverURL === "https://your.parse-server.url"
) {
  console.warn(
    "Parse environment variables contain placeholder values. Please update them with real credentials."
  );
} else {
  try {
    console.log("Attempting to initialize Parse...");
    Parse.initialize(appId, jsKey);
    Parse.serverURL = serverURL;
    console.log("Parse initialized successfully with:", {
      appId: appId.substring(0, 8) + "...",
      serverURL: serverURL,
    });
  } catch (error) {
    console.error("Failed to initialize Parse:", error);
  }
}

export default Parse;
