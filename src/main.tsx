import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Apply iOS liquid glass class so CSS can scope the effect to iOS only
if (Capacitor.getPlatform() === "ios") {
  document.documentElement.classList.add("ios-glass");
}

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="498337994484-ph3f3ps676q6jp3m3of8nh1jbcs8v6ep.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
