const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const meta = await prisma.schemaMetadata.findMany({
    select: { tableName: true, tableSchema: true }
  });
  const uniqueTables = [...new Set(meta.map(m => m.tableName))];
  console.log("Introspected tables:", uniqueTables);
  
  const conns = await prisma.databaseConnection.findMany({
    select: { alias: true, dbName: true, engine: true }
  });
  console.log("Connections:", conns);
}

check().catch(console.error).finally(() => prisma.$disconnect());
