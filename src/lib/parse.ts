import Parse from "parse";

// Hardcoded Parse credentials - no environment variables needed
const PARSE_CONFIG = {
  applicationId: "ANMG78uEmA9lBZl0nXVyzkpMlGbd6lfMZHv7EoYs",
  javascriptKey: "vU3qaW4YBS4wwlWXrIcPjwxEsmT1BQYp6O9DANPJ",
  serverURL: "https://parseapi.back4app.com/parse",
};

console.log("=== Parse Initialization ===");
console.log("Initializing Parse with hardcoded credentials...");

try {
  Parse.initialize(PARSE_CONFIG.applicationId, PARSE_CONFIG.javascriptKey);
  Parse.serverURL = PARSE_CONFIG.serverURL;
  console.log(
    "Parse initialized successfully with server:",
    PARSE_CONFIG.serverURL
  );
} catch (error) {
  console.error("Failed to initialize Parse:", error);
}

export default Parse;
