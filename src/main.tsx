import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import AuthContextProvider from "./contexts/auth/AuthContextProvider";
import DataContextProvider from "./contexts/data/DataContextProvider";

defineCustomElements(window);
const container = document.getElementById("root");
const root = createRoot(container!);

// Temporarily disable StrictMode to prevent double execution in development
// You can re-enable it later when the chat functionality is stable
root.render(
  <AuthContextProvider>
    <DataContextProvider>
      <App />
    </DataContextProvider>
  </AuthContextProvider>
);
