"use client";
import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (
      "serviceWorker" in navigator &&
      window.location.hostname !== "localhost"
    ) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }
  }, []);
}
