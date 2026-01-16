"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
    errorFormat: 'minimal',
});
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
const disconnectPrisma = async () => {
    await exports.prisma.$disconnect();
};
exports.disconnectPrisma = disconnectPrisma;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map