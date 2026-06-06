/**
 * fix-schema-metadata.js
 * Clears stale schema metadata for MongoDB connections and re-introspects fresh.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('./src/generated/prisma');
const { MongoClient } = require('mongodb');
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

function isObjectId(value) {
  return value !== null && typeof value === 'object' && 'toHexString' in value;
}

function collectFields(obj, prefix = '') {
  const fields = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof Buffer) &&
      !isObjectId(value)
    ) {
      if (prefix.split('.').length < 2) {
        fields.push(...collectFields(value, fullPath));
      } else {
        fields.push({ path: fullPath, bsonType: 'object' });
      }
    } else {
      const bsonType = Array.isArray(value) ? 'array'
        : value === null ? 'null'
        : value instanceof Date ? 'date'
        : isObjectId(value) ? 'objectId'
        : typeof value === 'number' ? (Number.isInteger(value) ? 'int' : 'double')
        : typeof value === 'boolean' ? 'bool'
        : 'string';
      fields.push({ path: fullPath, bsonType });
    }
  }
  return fields;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const mongoConns = await prisma.databaseConnection.findMany({
      where: { engine: 'MONGODB', status: 'CONNECTED' },
      select: { id: true, alias: true, dbName: true, encryptedUri: true },
    });

    for (const conn of mongoConns) {
      console.log(`\nProcessing [${conn.alias}] dbName="${conn.dbName}"`);

      const uri = decrypt(conn.encryptedUri);
      const dbName = conn.dbName;

      if (!dbName) {
        console.log('  → No dbName, skipping.');
        continue;
      }

      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
      try {
        await client.connect();
        const mdb = client.db(dbName);
        const collectionInfos = await mdb.listCollections().toArray();
        const INTERNAL_COLLECTIONS = new Set([
          'organizations', 'users', 'database_connections',
          'schema_metadata', 'report_templates', 'system.views', 'system.indexes',
        ]);
        const collectionNames = collectionInfos
          .map(c => c.name)
          .filter(n => !INTERNAL_COLLECTIONS.has(n));
        console.log('  User collections:', collectionNames);

        // Delete existing schema metadata for this connection
        const deleted = await prisma.schemaMetadata.deleteMany({
          where: { connectionId: conn.id },
        });
        console.log(`  Deleted ${deleted.count} stale schema rows.`);

        // Re-introspect
        const allColumns = [];
        for (const collName of collectionNames) {
          const coll = mdb.collection(collName);
          const samples = await coll.find({}).limit(100).toArray();
          const fieldMap = new Map();
          for (const doc of samples) {
            const fields = collectFields(doc);
            for (const f of fields) {
              if (!fieldMap.has(f.path) || fieldMap.get(f.path) === 'null') {
                fieldMap.set(f.path, f.bsonType);
              }
            }
          }

          let ordinal = 1;
          for (const [fieldPath, bsonType] of fieldMap) {
            allColumns.push({
              tableSchema: dbName,
              tableName: collName,
              columnName: fieldPath,
              dataType: bsonType,
              isNullable: true,
              isPrimaryKey: fieldPath === '_id',
              columnDefault: null,
              ordinalPosition: ordinal++,
              connectionId: conn.id,
            });
          }
          console.log(`  ${collName}: ${fieldMap.size} fields`);
        }

        if (allColumns.length > 0) {
          await prisma.schemaMetadata.createMany({ data: allColumns });
          console.log(`  ✓ Inserted ${allColumns.length} schema rows.`);
        }
      } finally {
        await client.close();
      }
    }
    console.log('\nDone.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
