import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";

// Apply iOS liquid glass class so CSS can scope the effect to iOS only
if (Capacitor.getPlatform() === "ios") {
  document.documentElement.classList.add("ios-glass");
}

createRoot(document.getElementById("root")!).render(<App />);
