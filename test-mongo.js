const { MongoClient } = require('mongodb'); 
const uri = 'mongodb://localhost:27017/'; 
const client = new MongoClient(uri); 

async function run() { 
  await client.connect(); 
  const adminDb = client.db().admin(); 
  const dbs = await adminDb.listDatabases(); 
  console.log(dbs.databases.map(d => d.name)); 
  await client.close(); 
} 

run().catch(console.dir);
