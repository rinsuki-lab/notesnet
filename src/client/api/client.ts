export function customFetch<T>(path: string, options: RequestInit) {
    const req = new Request(path, {
        ...options,
    })
    const token = localStorage.getItem("notesnet_token")
    if (token) {
        req.headers.set("Authorization", `Bearer ${token}`)
    }
    return fetch(req).then(async r => {
        return {
            data: r.headers.get("Content-Type")?.includes("/json") ? await r.json() : await r.text(),
            status: r.status,
            headers: r.headers
        } as T
    })
}