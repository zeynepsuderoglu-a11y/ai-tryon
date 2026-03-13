"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#ffffff",
          color: "#1a1a1a",
          border: "1px solid #e5e5e5",
          borderRadius: "12px",
          fontSize: "14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        },
      }}
    />
  );
}
