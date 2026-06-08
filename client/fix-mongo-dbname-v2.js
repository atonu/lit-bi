/**
 * fix-mongo-dbname-v2.js
 * Uses the correct dot-separated format: iv.authTag.ciphertext
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { PrismaClient } = require('./src/generated/prisma');
const crypto = require('crypto');

const KEY_HEX = process.env.DATABASE_ENCRYPTION_KEY;
if (!KEY_HEX) { console.error('Missing DATABASE_ENCRYPTION_KEY'); process.exit(1); }
const KEY = Buffer.from(KEY_HEX, 'hex');

function decrypt(encoded) {
  const parts = encoded.split('.');
  if (parts.length !== 3) throw new Error(`Expected 3 dot-separated parts, got ${parts.length}`);
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
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
      console.log(`\n[${conn.alias}] id=${conn.id}, current dbName="${conn.dbName}"`);

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
        console.log('  Raw encryptedUri (first 60 chars):', conn.encryptedUri.slice(0, 60));
        continue;
      }

      let dbName = null;
      try {
        const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
        const pathDb = url.pathname.replace(/^\//, '').split('?')[0];
        if (pathDb) dbName = pathDb;
        console.log('  URI path:', url.pathname, '→ dbName:', dbName || '(empty)');
      } catch (e) {
        console.error('  → URL parse failed:', e.message);
      }

      if (!dbName) {
        console.log('  → No dbName in URI path. Cannot auto-fix from URI.');
        continue;
      }

      if (conn.dbName === dbName) {
        console.log('  → dbName already correct, no update needed.');
        continue;
      }

      await prisma.databaseConnection.update({
        where: { id: conn.id },
        data: { dbName },
      });
      console.log(`  ✓ Updated dbName from "${conn.dbName}" to "${dbName}".`);
    }
    console.log('\nDone.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
