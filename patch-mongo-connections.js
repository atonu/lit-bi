/**
 * patch-mongo-connections.js
 *
 * One-time patch: for any MongoDB DatabaseConnection where dbName is null,
 * decrypt the URI, parse the database name from the path segment, and save it.
 *
 * Run from the project root: node patch-mongo-connections.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { PrismaClient } = require('./src/generated/prisma');
const crypto = require('crypto');

const KEY_HEX = process.env.DATABASE_ENCRYPTION_KEY;
if (!KEY_HEX) {
  console.error('Missing DATABASE_ENCRYPTION_KEY in .env');
  process.exit(1);
}

const KEY = Buffer.from(KEY_HEX, 'hex');

function decrypt(ciphertext) {
  const buf = Buffer.from(ciphertext, 'hex');
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const mongoConns = await prisma.databaseConnection.findMany({
      where: { engine: 'MONGODB' },
      select: { id: true, alias: true, dbName: true, encryptedUri: true },
    });

    console.log(`Found ${mongoConns.length} MongoDB connection(s).`);

    for (const conn of mongoConns) {
      console.log(`\n[${conn.alias}] id=${conn.id}`);
      console.log(`  Current dbName: ${conn.dbName ?? '(null)'}`);

      if (conn.dbName) {
        console.log('  → dbName already set, skipping.');
        continue;
      }

      if (!conn.encryptedUri) {
        console.log('  → No encrypted URI, skipping.');
        continue;
      }

      let uri;
      try {
        uri = decrypt(conn.encryptedUri);
      } catch (e) {
        console.error('  → Failed to decrypt URI:', e.message);
        continue;
      }

      let dbName = null;
      try {
        const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
        const pathDb = url.pathname.replace(/^\//, '').split('?')[0];
        if (pathDb) dbName = pathDb;
      } catch (e) {
        console.error('  → Failed to parse URI:', e.message);
      }

      if (!dbName) {
        console.log('  → Could not extract dbName from URI. URI path:', uri.split('@')[1] || '(hidden)');
        continue;
      }

      console.log(`  → Extracted dbName: "${dbName}"`);
      await prisma.databaseConnection.update({
        where: { id: conn.id },
        data: { dbName },
      });
      console.log('  ✓ Updated.');
    }

    console.log('\nDone.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
