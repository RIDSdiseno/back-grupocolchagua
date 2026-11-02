// Importa una sola vez los logos que la página web tenía fijos en
// web-front/src/assets/marcas: los sube a Cloudinary y crea las filas de
// marcas_web en el mismo orden del carrusel. Las marcas que ya existen
// (mismo nombre) se omiten, así que se puede volver a ejecutar sin duplicar.
//
// Uso: npx tsx prisma/importar-marcas-web.ts

import path from "path";
import { PrismaClient } from "@prisma/client";
import cloudinary from "../src/config/cloudinary";

const prisma = new PrismaClient();

const CARPETA_LOGOS = path.resolve(
  __dirname,
  "../../web-front/src/assets/marcas"
);

const MARCAS = [
  { nombre: "Walmart", archivo: "logo_walmart.png" },
  { nombre: "Jumbo", archivo: "logo_jumbo-150x150.png" },
  { nombre: "Sodimac", archivo: "logo_sodimac-150x150.png" },
  { nombre: "Paris", archivo: "logo_paris-150x150.png" },
  { nombre: "Easy", archivo: "logo_easy-150x150.png" },
  { nombre: "IKEA", archivo: "logo_ikea-150x150.png" },
  { nombre: "BCI", archivo: "logo_bci-150x150.png" },
  { nombre: "Starken", archivo: "logo_starken-3-150x150.png" },
  { nombre: "Alvi", archivo: "logo_alvi-150x150.png" },
  { nombre: "Xiaomi", archivo: "logo_xiaomi-150x150.png" },
  { nombre: "DPS Chile", archivo: "logo_dps_chile-150x150.png" },
  { nombre: "Espacio Riesco", archivo: "logo_espacio_riesco-150x150.png" },
  { nombre: "Iron Mountain", archivo: "logo_iron_mountain-150x150.png" },
  { nombre: "Santa Isabel", archivo: "logo_santa_isabel-150x150.png" },
  { nombre: "Viña Undurraga", archivo: "logo_vina_undurraga-150x150.png" },
];

async function main() {
  const ultima = await prisma.marcaWeb.findFirst({
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  let orden = (ultima?.orden ?? -1) + 1;

  for (const { nombre, archivo } of MARCAS) {
    const existente = await prisma.marcaWeb.findFirst({ where: { nombre } });

    if (existente) {
      console.log(`Omitida (ya existe): ${nombre}`);
      continue;
    }

    const upload = await cloudinary.uploader.upload(
      path.join(CARPETA_LOGOS, archivo),
      { folder: "grupo-colchagua/marcas-web", resource_type: "image" }
    );

    await prisma.marcaWeb.create({
      data: {
        nombre,
        logoUrl: upload.secure_url,
        logoPublicId: upload.public_id,
        orden: orden++,
      },
    });

    console.log(`Importada: ${nombre}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
