import React, { useEffect, useState } from "react";
import { hasAuthParams, useAuth } from "react-oidc-context";
import { useLocation } from "react-router-dom";
import { useEstablishSession } from "../hooks/useEstablishSession";

const AuthProtected = ({ children }: { children: React.ReactNode }) => {
    useEstablishSession();
    const auth = useAuth();
    const loc = useLocation();
    const [tried, setTried] = useState(false);

    // Nếu chưa đăng nhập thì redirect
    useEffect(() => {
        if (!hasAuthParams() && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading && !tried) {
            const current = loc.pathname + loc.search + loc.hash;
            sessionStorage.setItem("returnTo", current);
            void auth.signinRedirect({ state: current });
            setTried(true);
        }
    }, [auth, loc, tried]);

    useEffect(() => {
        const idToken = auth.user?.id_token;
        if (idToken) {
            localStorage.setItem("id_token", idToken);
            sessionStorage.setItem("authUser", JSON.stringify({ idToken, profile: auth.user?.profile }));
        } else {
            sessionStorage.removeItem("authUser");
            localStorage.removeItem("id_token");
        }
    }, [auth.user?.id_token, auth.user?.profile]);

    if (auth.isLoading || auth.activeNavigator) return null;
    if (!auth.isAuthenticated) return null;

    return <>{children}</>;
};

export default AuthProtected;
