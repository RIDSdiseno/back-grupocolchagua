"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.talanaApi = exports.TALANA_EMPRESA_SANTA_CRUZ_ID = exports.TALANA_EMPRESA_COLCHAGUA_ID = void 0;
const axios_1 = __importDefault(require("axios"));
const baseURL = process.env.TALANA_BASE_URL;
const token = process.env.TALANA_API_TOKEN;
if (!baseURL) {
    throw new Error("Falta la variable TALANA_BASE_URL");
}
if (!token) {
    throw new Error("Falta la variable TALANA_API_TOKEN");
}
exports.TALANA_EMPRESA_COLCHAGUA_ID = Number(process.env.TALANA_EMPRESA_COLCHAGUA_ID ?? 1408);
exports.TALANA_EMPRESA_SANTA_CRUZ_ID = Number(process.env.TALANA_EMPRESA_SANTA_CRUZ_ID ?? 1570);
exports.talanaApi = axios_1.default.create({
    baseURL,
    timeout: 30000,
    headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});
