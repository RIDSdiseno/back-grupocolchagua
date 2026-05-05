"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const empresa_controller_1 = require("../controllers/empresa.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
router.get("/", auth_middleware_1.verificarToken, empresa_controller_1.listarEmpresas);
router.post("/", auth_middleware_1.verificarToken, upload.single("foto"), empresa_controller_1.crearEmpresa);
router.put("/:id", auth_middleware_1.verificarToken, upload.single("foto"), empresa_controller_1.actualizarEmpresa);
router.delete("/:id", auth_middleware_1.verificarToken, empresa_controller_1.eliminarEmpresa);
exports.default = router;
