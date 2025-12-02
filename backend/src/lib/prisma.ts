import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton para Lambda Functions
 * 
 * En entornos serverless como Lambda, es importante reutilizar
 * la conexión de Prisma entre invocaciones para optimizar el rendimiento.
 * 
 * Este patrón singleton asegura que solo se cree una instancia de PrismaClient
 * y se reutilice en invocaciones subsecuentes dentro del mismo contenedor Lambda.
 */

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error', 'warn'],
  errorFormat: 'minimal',
});

// En desarrollo, guardamos la instancia globalmente para hot-reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Función helper para desconectar Prisma
 * Útil para testing o cuando se necesita cerrar la conexión explícitamente
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

export default prisma;
