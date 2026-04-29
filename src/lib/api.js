const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getToken() {
    return localStorage.getItem("authToken");
}

export function clearAuth() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authExpiry");
}

export async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };
    return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

export async function loginUser(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authExpiry", expiry.toString());
    return data;
}
