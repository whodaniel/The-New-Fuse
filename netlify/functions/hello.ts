import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Function: Hello World
 *
 * This is a simple serverless function that demonstrates the basic structure
 * of a Netlify Function. It responds with a JSON message.
 *
 * @param event - The event object containing request details
 * @param context - The context object with additional information
 * @returns Response object with statusCode, body, and headers
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    // You can access query parameters, headers, and body from the event object
    const { httpMethod, path, queryStringParameters, headers } = event;

    // Log for debugging (visible in Netlify function logs)
    console.log("Function invoked:", { httpMethod, path });

    // Return a successful response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Enable CORS
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      },
      body: JSON.stringify({
        message: "Hello from Netlify Functions!",
        timestamp: new Date().toISOString(),
        path,
        method: httpMethod,
      }),
    };
  } catch (error) {
    console.error("Error in hello function:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
