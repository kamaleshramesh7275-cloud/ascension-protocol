import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./index.css";

// Global API Interceptor for Native Mobile App (Capacitor)
// Automatically redirects relative /api/ requests to the live backend server
if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let target = input;
    if (typeof input === "string") {
      if (input.startsWith("/api/")) {
        target = `https://ascensions.in${input}`;
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith("/api/")) {
        target = new URL(input.pathname + input.search, "https://ascensions.in");
      }
    } else if (input instanceof Request) {
      if (input.url.startsWith("/") || input.url.includes("localhost/api/")) {
        const urlObj = new URL(input.url, "https://ascensions.in");
        target = new Request(`https://ascensions.in${urlObj.pathname}${urlObj.search}`, input);
      }
    }
    return nativeFetch(target, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
