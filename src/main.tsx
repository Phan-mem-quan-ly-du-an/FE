import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import App from "./App";
import "./assets/css/index.css";

const redirectUri = window.location.origin;
const authority = import.meta.env.VITE_COGNITO_AUTHORITY as string;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string;

const cognitoAuthConfig = {
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    post_logout_redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email phone',
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider {...cognitoAuthConfig}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
