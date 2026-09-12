import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

console.log("[MuseumAI] API_URL =", API_URL);

const api = axios.create({
  baseURL: API_URL,
});

export default api;