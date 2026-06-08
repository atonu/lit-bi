const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getConnections() {
  const connections = await prisma.databaseConnection.findMany();
  console.log('Connections:', connections);
}

getConnections().catch(console.error).finally(() => prisma.$disconnect());
