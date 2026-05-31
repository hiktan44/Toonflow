import { serializeError } from "serialize-error";

// handle unhandled Promise rejections
process.on("unhandledRejection", (reason, promise) => {
 console.error("[Unhandled Promise rejection]");
 if (reason instanceof Error) {
 console.error("Error name:", reason.name);
 console.error("Error message:", reason.message);
 console.error("Stack trace:", reason.stack);
 console.error("Serialized details:", JSON.stringify(serializeError(reason), null, 2));
 } else {
 console.error("reason:", reason);
 console.error("Type:", typeof reason);
 try {
 console.error("JSON:", JSON.stringify(reason, null, 2));
 } catch {
 console.error("(cannot serialize)");
 }
 }
 console.error("Promise:", promise);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
 console.error("[Uncaught Exception]");
 console.error("Error name:", error.name);
 console.error("Error message:", error.message);
 console.error("Stack trace:", error.stack);
 console.error("Serialized details:", JSON.stringify(serializeError(error), null, 2));
});
