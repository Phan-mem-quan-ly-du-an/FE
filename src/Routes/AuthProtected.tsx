import React, {useEffect, useState} from 'react';
import {hasAuthParams, useAuth} from 'react-oidc-context';
import {useLocation} from 'react-router-dom';
import {useEstablishSession} from '../hooks/useEstablishSession';

const AuthProtected = ({children}: { children: React.ReactNode }) => {
    useEstablishSession();
    const auth = useAuth();
    const loc = useLocation();
    const [tried, setTried] = useState(false);
    const [signinError, setSigninError] = useState<string | null>(null);

    useEffect(() => {
        if (!hasAuthParams() && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading && !tried) {
            const current = loc.pathname + loc.search + loc.hash;
            sessionStorage.setItem('returnTo', current);
            auth.signinRedirect({state: current}).catch((err: unknown) => {
                const message = err instanceof Error ? err.message : "Sign-in redirect failed.";
                setSigninError(message);
                console.error("signinRedirect failed:", err);
            });
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
    
    if (auth.error || signinError) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <h3 className="text-danger">Authentication Error</h3>
                <p className="text-muted">{signinError || auth.error?.message}</p>
                <button 
                    className="btn btn-primary mt-3"
                    onClick={() => {
                        window.history.replaceState({}, document.title, window.location.pathname);
                        auth.removeUser();
                        sessionStorage.removeItem('returnTo');
                        sessionStorage.removeItem('authUser');
                        localStorage.removeItem('access_token');
                        // Also clear the oidc storage
                        for (const key in localStorage) {
                            if (key.startsWith('oidc')) localStorage.removeItem(key);
                        }
                        for (const key in sessionStorage) {
                            if (key.startsWith('oidc')) sessionStorage.removeItem(key);
                        }
                        window.location.reload();
                    }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!auth.isAuthenticated) return null;

    return <>{children}</>;
};

export default AuthProtected;
