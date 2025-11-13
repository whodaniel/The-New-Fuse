import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Function: API Router
 *
 * This function serves as an API router that can handle different endpoints
 * based on the request path. Useful for creating RESTful API endpoints.
 *
 * Example usage:
 * - GET /.netlify/functions/api/users
 * - POST /.netlify/functions/api/users
 * - GET /.netlify/functions/api/status
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const { httpMethod, path, body, queryStringParameters } = event;

  // Parse the API path (remove the function prefix)
  const apiPath = path.replace("/.netlify/functions/api", "");

  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle OPTIONS request for CORS preflight
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // Route handling
    switch (apiPath) {
      case "/status":
        return handleStatus(httpMethod, headers);

      case "/users":
        return handleUsers(httpMethod, body, queryStringParameters, headers);

      case "/health":
        return handleHealth(headers);

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: "Not Found",
            message: `Endpoint ${apiPath} not found`,
          }),
        };
    }
  } catch (error) {
    console.error("API Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

// Handler for /status endpoint
function handleStatus(method: string, headers: Record<string, string>) {
  if (method !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: "operational",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }),
  };
}

// Handler for /users endpoint
function handleUsers(
  method: string,
  body: string | null,
  queryParams: Record<string, string> | null,
  headers: Record<string, string>
) {
  switch (method) {
    case "GET":
      // Example: Return list of users
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          users: [
            { id: 1, name: "Example User", email: "user@example.com" },
          ],
          query: queryParams,
        }),
      };

    case "POST":
      // Example: Create a new user
      try {
        const data = body ? JSON.parse(body) : {};
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: "User created successfully",
            user: { id: Date.now(), ...data },
          }),
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid JSON in request body" }),
        };
      }

    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
  }
}

// Handler for /health endpoint
function handleHealth(headers: Record<string, string>) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  };
}
