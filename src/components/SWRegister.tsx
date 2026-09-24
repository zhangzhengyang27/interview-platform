"use client";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export function SWRegister() {
  useServiceWorker();
  return null;
}
