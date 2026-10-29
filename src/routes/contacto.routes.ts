import { Router } from "express";
import { recibirContacto, recibirCotizacion } from "../controllers/contacto.controller";

const router = Router();

router.post("/", recibirContacto);
router.post("/cotizar", recibirCotizacion);

export default router;
