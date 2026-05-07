import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.usuario.upsert({
    where: {
      email: "admin@grupocolchagua.cl",
    },
    update: {
      password: passwordHash,
      rol: "ADMIN",
    },
    create: {
      nombre: "Administrador",
      email: "admin@grupocolchagua.cl",
      password: passwordHash,
      rol: "ADMIN",
    },
  });

  console.log("Usuario admin creado/actualizado correctamente");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });