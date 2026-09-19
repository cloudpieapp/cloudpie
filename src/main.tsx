import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/600.css";
import App from "./App.tsx";
import "./index.css";
import { initializeAnalytics } from "./lib/analytics";

// Apply persisted theme before render to avoid flash
try {
  const theme = localStorage.getItem("theme");
  if (theme === "light") document.documentElement.classList.add("light");
  else document.documentElement.classList.remove("light");
} catch {}

initializeAnalytics();

const root = document.getElementById("root");
if (!root) throw new Error("App root is missing");

createRoot(root).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
