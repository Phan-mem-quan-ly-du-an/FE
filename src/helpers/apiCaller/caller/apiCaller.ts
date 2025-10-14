type Method = "GET" | "POST" | "PUT" | "DELETE";
type RequestOptions = {
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
};

export default class ApiCaller {
    private base: string;
    private urlPath = "";
    private params: Record<string, any> = {};
    private headers: Record<string, string> = {};
    private data: any;

    constructor() {
        this.base = process.env.REACT_APP_API_URL as string;
    }

    setUrl(path: string) { this.urlPath = path; return this; }
    setParams(p?: Record<string, any>) { if (p) this.params = p; return this; }
    setHeaders(h?: Record<string, string>) { if (h) this.headers = { ...this.headers, ...h }; return this; }
    setData(d: any) { this.data = d; return this; }

    private buildUrl(): string {
        const url = new URL(this.urlPath, this.base);
        const p = this.params || {};
        for (const k of Object.keys(p)) {
            if (p[k] !== undefined && p[k] !== null && p[k] !== "") {
                url.searchParams.set(k, String(p[k]));
            }
        }
        return url.toString();
    }

    private async request<T>(method: Method, opts?: RequestOptions): Promise<{ data: T }> {
        const url = new URL(this.urlPath, this.base);
        const params = { ...this.params, ...(opts?.params || {}) };
        for (const k of Object.keys(params)) {
            const v = params[k];
            if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
        }

        const headers: Record<string, string> = { ...(this.headers || {}), ...(opts?.headers || {}) };
        const accessToken = (window as any).__access_token__ || localStorage.getItem("access_token");
        if (accessToken && !headers["Authorization"]) headers["Authorization"] = `Bearer ${accessToken}`;

        const bodyData = (opts?.data !== undefined) ? opts!.data : this.data;
        const init: RequestInit = { method, headers };
        if (method !== "GET" && bodyData !== undefined) {
            if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
            init.body = headers["Content-Type"].includes("application/json") ? JSON.stringify(bodyData) : bodyData;
        }

        const res = await fetch(url.toString(), init);
        if (!res.ok) {
            let text = "";
            try { text = await res.text(); } catch {}
            throw new Error(`${res.status} ${text}`.trim());
        }
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return { data: undefined as unknown as T };
        const data = await res.json();
        return { data };
    }

    get<T>(opts?: RequestOptions) { return this.request<T>("GET", opts); }
    post<T>(opts?: RequestOptions) { return this.request<T>("POST", opts); }
    put<T>(opts?: RequestOptions) { return this.request<T>("PUT", opts); }
    delete<T>(opts?: RequestOptions) { return this.request<T>("DELETE", opts); }
}
