import ApiCaller from "./caller/apiCaller";

export type SessionInfo = {
    id: string; // MUST match app userId used in member lists
    email?: string | null;
    displayName?: string | null;
    isAdmin?: boolean;
};

export const getSession = async (): Promise<SessionInfo> => {
    const base = process.env.REACT_APP_API_URL;
    const url = new URL("/api/session", base).toString();
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`Failed to fetch session: ${response.status}`);
    return (await response.json()) as SessionInfo;
};


