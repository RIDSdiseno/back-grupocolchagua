"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cargo.routes.ts
const express_1 = require("express");
const cargo_controller_1 = require("../controllers/cargo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.verificarToken, cargo_controller_1.listarCargos);
router.post("/", auth_middleware_1.verificarToken, cargo_controller_1.crearCargo);
router.put("/:id", auth_middleware_1.verificarToken, cargo_controller_1.actualizarCargo);
router.delete("/:id", auth_middleware_1.verificarToken, cargo_controller_1.eliminarCargo);
exports.default = router;
