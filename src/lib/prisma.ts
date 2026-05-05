import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => {
    console.log("Prisma conectado correctamente");
  })
  .catch((error) => {
    console.error("Error conectando Prisma:", error);
    process.exit(1);
  });