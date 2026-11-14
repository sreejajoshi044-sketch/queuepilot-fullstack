
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueueProvider } from "./context/QueueContext";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <QueueProvider>
      <App />
    </QueueProvider>
  </React.StrictMode>
);
