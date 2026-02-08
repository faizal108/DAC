import React from "react";
import ReactDOM from "react-dom/client";
import { PlatformProvider } from "./platform/PlatformProvider";

import { App } from "./App.jsx";
import "./theme/base.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <PlatformProvider>
    <App />
  </PlatformProvider>,
);
