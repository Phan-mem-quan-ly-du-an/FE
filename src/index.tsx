import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";
import {AuthProvider} from "react-oidc-context";

const store = configureStore({ reducer: rootReducer, devTools: true });

const redirectUri = window.location.origin;
const authority = process.env.REACT_APP_COGNITO_AUTHORITY as string;
const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID as string;

const cognitoAuthConfig = {
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    post_logout_redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email phone',
    // Explicitly set Cognito logout endpoint; some Cognito tenants omit this from discovery

    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    },
};
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <AuthProvider {...cognitoAuthConfig}>
        <Provider store={store}>
            <React.Fragment>
                <BrowserRouter basename={process.env.PUBLIC_URL}>
                    <App />
                </BrowserRouter>
            </React.Fragment>
        </Provider>
    </AuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();