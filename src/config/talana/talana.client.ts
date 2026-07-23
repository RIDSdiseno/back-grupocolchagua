import axios from "axios";

const rawBaseURL = process.env.TALANA_BASE_URL;
const token = process.env.TALANA_API_TOKEN;

if (!rawBaseURL) {
  throw new Error("Falta la variable TALANA_BASE_URL");
}

if (!token) {
  throw new Error("Falta la variable TALANA_API_TOKEN");
}

const baseURL = rawBaseURL.trim().replace(/\/+$/, "");

try {
  const parsedUrl = new URL(baseURL);

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error("Protocolo no permitido");
  }
} catch {
  throw new Error(
    `TALANA_BASE_URL no contiene una URL válida: ${baseURL}`,
  );
}

export const talanaApi = axios.create({
  baseURL,
  timeout: 60_000,
  headers: {
    Authorization: `Token ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});