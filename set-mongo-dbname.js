/**
 * set-mongo-dbname.js — Directly sets dbName="bilite" for the MongoDB connection.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('./src/generated/prisma');

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.databaseConnection.updateMany({
      where: { engine: 'MONGODB' },
      data: { dbName: 'bilite' },
    });
    console.log(`Updated ${result.count} connection(s) with dbName="bilite".`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
