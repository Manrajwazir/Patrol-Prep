// lib/api.ts
// Thin wrapper around fetch() that points at our API Gateway.
// On April 25 we'll add authentication headers here.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
    console.warn("NEXT_PUBLIC_API_URL not set — API calls will fail");
}

export const api = {
    async listIncidents() {
        const res = await fetch(`${BASE_URL}/incidents`);
        if (!res.ok) throw new Error(`Failed to list incidents: ${res.status}`);
        return res.json();
    },

    async getIncident(id: string) {
        const res = await fetch(`${BASE_URL}/incidents/${id}`);
        if (!res.ok) throw new Error(`Failed to get incident ${id}: ${res.status}`);
        return res.json();
    },

    async requestUploadUrl(contentType: string) {
        const res = await fetch(`${BASE_URL}/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentType }),
        });
        if (!res.ok) throw new Error(`Failed to request upload URL: ${res.status}`);
        return res.json();
    },
};