import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import AuthContextProvider from "./contexts/auth/AuthContextProvider";
import DataContextProvider from "./contexts/data/DataContextProvider";

defineCustomElements(window);
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <DataContextProvider>
        <App />
      </DataContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
