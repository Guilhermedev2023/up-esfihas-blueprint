import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureFbclid } from "./lib/metaPixel";

// Keep the Meta click id before the "/" -> "/home" redirect drops the query string
captureFbclid();

createRoot(document.getElementById("root")!).render(<App />);
