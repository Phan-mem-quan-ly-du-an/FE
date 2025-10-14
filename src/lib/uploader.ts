export async function uploadImageTo(bucket: "company-logo"|"user-avatar"|"temp", file: File, accessToken: string, apiBase: string) {
    const fd = new FormData();
    fd.append("file", file);
    const url = new URL(`/api/uploads/${bucket}`, apiBase).toString();
    const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
    });
    if (!res.ok) {
        throw new Error(`Upload thất bại: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<{ filename: string; contentType: string; size: number; url: string }>;
}
