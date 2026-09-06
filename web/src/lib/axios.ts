import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) throw new Error("VITE_API_URL is not set. Copy .env.example to .env and set it.");
const api = axios.create({
    baseURL: `${apiUrl}/api`,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
})

export default api;