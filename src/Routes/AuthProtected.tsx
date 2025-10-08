import React, {useEffect, useState} from "react";
import {hasAuthParams, useAuth} from "react-oidc-context";
import {useLocation} from "react-router-dom";

const AuthProtected = ({children}: { children: React.ReactNode }) => {
    const auth = useAuth();
    const loc = useLocation();
    const [tried, setTried] = useState(false);

    useEffect(() => {
        if (!hasAuthParams() && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading && !tried) {
            const current = loc.pathname + loc.search + loc.hash;
            sessionStorage.setItem("returnTo", current || "/dashboard");
            void auth.signinRedirect({state: current || "/dashboard"});
            setTried(true);
        }
    }, [auth, loc, tried]);

    useEffect(() => {
        const token = auth.user?.access_token;
        if (token) {
            localStorage.setItem('access_token', token)
            sessionStorage.setItem("authUser", JSON.stringify({token, profile: auth.user?.profile}));
        } else {
            sessionStorage.removeItem("authUser");
        }
    }, [auth.user]);

    if (auth.isLoading || auth.activeNavigator) return null;
    if (!auth.isAuthenticated) return null;

    return <>{children}</>;
};

export default AuthProtected;
