import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8000/api",
});

export const investIPO = (data, token) =>
    API.post("/ipo", data, { headers: { Authorization: `Bearer ${token}` } });

export const investNPS = (data, token) =>
    API.post("/nps", data, { headers: { Authorization: `Bearer ${token}` } });

export const investGold = (data, token) =>
    API.post("/gold", data, { headers: { Authorization: `Bearer ${token}` } });

export const investAPY = (data, token) =>
    API.post("/apy", data, { headers: { Authorization: `Bearer ${token}` } });
