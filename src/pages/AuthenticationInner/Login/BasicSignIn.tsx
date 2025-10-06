import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

const BasicSignIn = () => {
    const auth = useAuth();

    useEffect(() => {
        if (auth.isLoading || auth.activeNavigator) return;

        if (!auth.isAuthenticated) {
            const state = sessionStorage.getItem("returnTo") || "/dashboard";
            auth.signinRedirect({ state });
            return;
        }

        const to = sessionStorage.getItem("returnTo") || "/dashboard";
        sessionStorage.removeItem("returnTo");
        window.location.replace(to);
    }, [auth]);

    return null;
};

export default BasicSignIn;
