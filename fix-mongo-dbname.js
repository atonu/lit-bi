/**
 * fix-mongo-dbname.js — Force-update the dbName for MongoDB connections by
 * parsing it from the decrypted URI, overwriting any stale value.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { PrismaClient } = require('./src/generated/prisma');
const crypto = require('crypto');

const KEY_HEX = process.env.DATABASE_ENCRYPTION_KEY;
if (!KEY_HEX) { console.error('Missing DATABASE_ENCRYPTION_KEY'); process.exit(1); }
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
      console.log(`\n[${conn.alias}] id=${conn.id}, dbName="${conn.dbName}"`);

      if (!conn.encryptedUri) {
        console.log('  → No encrypted URI, skipping.');
        continue;
      }

      let uri;
      try {
        uri = decrypt(conn.encryptedUri);
        console.log('  Decrypted URI (masked):', uri.replace(/:[^:@]+@/, ':***@'));
      } catch (e) {
        console.error('  → Decrypt failed:', e.message);
        continue;
      }

      let dbName = null;
      try {
        const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
        const pathDb = url.pathname.replace(/^\//, '').split('?')[0];
        if (pathDb) dbName = pathDb;
        console.log('  Parsed pathname:', url.pathname, '→ dbName:', dbName);
      } catch (e) {
        console.error('  → URL parse failed:', e.message);
      }

      if (!dbName) {
        console.log('  → No dbName in URI path. Cannot auto-fix.');
        continue;
      }

      await prisma.databaseConnection.update({
        where: { id: conn.id },
        data: { dbName },
      });
      console.log(`  ✓ Updated dbName to "${dbName}".`);
    }
    console.log('\nDone.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
