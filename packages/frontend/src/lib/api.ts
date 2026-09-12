const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ai-interview-prep-9cu6.onrender.com";

export async function safeFetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Try relative proxy first (/api/...), then direct backend URL
  const urlsToTry = [
    endpoint,
    `${BACKEND_URL}${endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`}`,
  ];

  let lastError: Error = new Error("Failed to connect to backend server.");

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // Returned HTML (e.g. Render spin-up / waking up page)
        throw new Error("Backend server is warming up on Render. Please wait 5 seconds and click Generate again!");
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status} error`);
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes("warming up")) {
        throw err; // User actionable message
      }
    }
  }

  throw lastError;
}
