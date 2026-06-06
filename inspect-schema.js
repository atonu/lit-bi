const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('./src/generated/prisma');

async function main() {
  const prisma = new PrismaClient();
  try {
    const conns = await prisma.databaseConnection.findMany({
      where: { engine: 'MONGODB' },
      select: { id: true, alias: true, dbName: true },
    });
    console.log('Connections:', JSON.stringify(conns, null, 2));

    const meta = await prisma.schemaMetadata.findMany({
      select: { tableName: true, tableSchema: true, columnName: true, dataType: true },
      take: 20,
    });
    const tables = [...new Set(meta.map(m => `${m.tableSchema}.${m.tableName}`))];
    console.log('\nUnique tables in schemaMetadata:', tables);
    if (meta.length > 0) {
      console.log('\nSample columns from first table:');
      const firstTable = meta[0].tableName;
      const cols = meta.filter(m => m.tableName === firstTable).slice(0, 5);
      cols.forEach(c => console.log(`  ${c.columnName}: ${c.dataType}`));
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(console.error);
