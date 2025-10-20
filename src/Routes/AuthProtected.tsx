import React, {useEffect, useState} from 'react';
import {hasAuthParams, useAuth} from 'react-oidc-context';
import {useLocation} from 'react-router-dom';
import {useEstablishSession} from '../hooks/useEstablishSession';

const AuthProtected = ({children}: { children: React.ReactNode }) => {
    useEstablishSession();
    const auth = useAuth();
    const loc = useLocation();
    const [tried, setTried] = useState(false);

    useEffect(() => {
        if (!hasAuthParams() && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading && !tried) {
            const current = loc.pathname + loc.search + loc.hash;
            sessionStorage.setItem('returnTo', current);
            void auth.signinRedirect({state: current});
            setTried(true);
        }
    }, [auth, loc, tried]);

    useEffect(() => {
        const accessToken = auth.user?.access_token;
        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            sessionStorage.setItem('authUser', JSON.stringify({accessToken, profile: auth.user?.profile}));
        } else {
            sessionStorage.removeItem('authUser');
            localStorage.removeItem( 'access_token');
        }
    }, [auth.user?.access_token, auth.user?.profile]);

    if (auth.isLoading || auth.activeNavigator) return null;
    if (!auth.isAuthenticated) return null;

    return <>{children}</>;
};

export default AuthProtected;
