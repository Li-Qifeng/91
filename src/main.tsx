import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./admin/ToastContext";
import { AuthProvider } from "./admin/AuthContext";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/navigation.css";
import "./styles/search.css";
import "./styles/video-card.css";
import "./styles/video-detail.css";
import "./styles/admin.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
