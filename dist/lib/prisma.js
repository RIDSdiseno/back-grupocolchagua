"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
exports.prisma
    .$connect()
    .then(() => {
    console.log("Prisma conectado correctamente");
})
    .catch((error) => {
    console.error("Error conectando Prisma:", error);
    process.exit(1);
});
