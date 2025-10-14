import { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";

export function useEstablishSession() {
    const auth = useAuth();
    const once = useRef(false);
    const base = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (once.current) return;
        if (auth.isAuthenticated && auth.user?.access_token) {
            once.current = true;
            fetch(new URL("/api/session", base).toString(), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${auth.user.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            }).catch(() => {
                once.current = false;
            });
        }
    }, [auth.isAuthenticated, auth.user?.access_token, base]);
}