import axios from "axios";

const baseURL = process.env.TALANA_BASE_URL;
const token = process.env.TALANA_API_TOKEN;

if (!baseURL) {
  throw new Error("Falta la variable TALANA_BASE_URL");
}

if (!token) {
  throw new Error("Falta la variable TALANA_API_TOKEN");
}

export const TALANA_EMPRESA_COLCHAGUA_ID = Number(
  process.env.TALANA_EMPRESA_COLCHAGUA_ID ?? 1408,
);

export const TALANA_EMPRESA_SANTA_CRUZ_ID = Number(
  process.env.TALANA_EMPRESA_SANTA_CRUZ_ID ?? 1570,
);

export const talanaApi = axios.create({
  baseURL,
  timeout: 30_000,
  headers: {
    Authorization: `Token ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});