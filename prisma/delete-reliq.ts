import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const empresa = await prisma.empresa.findFirst({
    where: { nombre: { contains: "IKEA", mode: "insensitive" } },
  });
  if (!empresa) throw new Error("Empresa IKEA no encontrada");

  const sucursal = await prisma.sucursal.findFirst({
    where: { empresaId: empresa.id, nombre: { contains: "Reliq", mode: "insensitive" } },
  });
  if (!sucursal) throw new Error("Sucursal Reliq IKEA no encontrada");

  const deleted = await prisma.tarifa.deleteMany({
    where: { empresaId: empresa.id, sucursalId: sucursal.id },
  });

  console.log(`Eliminadas ${deleted.count} tarifas`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());