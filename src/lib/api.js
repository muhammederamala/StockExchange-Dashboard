const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getToken() {
    return localStorage.getItem("token");
}

export function clearToken() {
    localStorage.removeItem("token");
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Drop-in replacement for fetch() — adds auth header and handles 401 globally
export async function apiFetch(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            ...(options.headers || {}),
        },
    });

    if (res.status === 401) {
        clearToken();
        window.location.reload();
        return res;
    }

    return res;
}
