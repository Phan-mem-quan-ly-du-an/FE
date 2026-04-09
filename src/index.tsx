import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";
import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

const store = configureStore({ reducer: rootReducer, devTools: true });

const redirectUri = (process.env.REACT_APP_COGNITO_REDIRECT_URI as string) || window.location.origin;
const logoutRedirectUri =
    (process.env.REACT_APP_COGNITO_LOGOUT_REDIRECT_URI as string) || window.location.origin;
const authority = process.env.REACT_APP_COGNITO_AUTHORITY as string;
const clientId  = process.env.REACT_APP_COGNITO_CLIENT_ID as string;

// Cấu hình AWS Cognito chuẩn
const cognitoAuthConfig = {
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    post_logout_redirect_uri: logoutRedirectUri,
    response_type: "code",
    scope: "openid",
    userStore: new WebStorageStateStore({ store: window.localStorage }),

    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    },
};

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <AuthProvider {...cognitoAuthConfig}>
        <Provider store={store}>
            {/* Đã gỡ bỏ basename để tránh lỗi trắng màn hình */}
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    </AuthProvider>
);

reportWebVitals();