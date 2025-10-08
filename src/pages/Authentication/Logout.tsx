import {useEffect, useRef} from "react";
import withRouter from "../../Components/Common/withRouter";
import {useAuth} from "react-oidc-context";

const Logout = () => {
    const auth = useAuth();
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        auth.removeUser?.();

        const hosted  = (process.env.REACT_APP_COGNITO_AUTHORITY || "").replace(/\/+$/, "");
        const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID!;
        const redirect = `${window.location.origin}/login`;

        const url = `${hosted}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(redirect)}`;
        window.location.replace(url);
    }, []);

    return null;
};

export default withRouter(Logout);
