import { PrismaClient } from '@prisma/client'

// Instância única do Prisma Client, reutilizada em todo o app.
// Evita criar uma conexão nova a cada requisição.
export const prisma = new PrismaClient()
