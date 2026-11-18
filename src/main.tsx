import { initializeLanguage } from "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

void initializeLanguage().then(async () => {
  const { default: App } = await import("./App");
  createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
 );
});
