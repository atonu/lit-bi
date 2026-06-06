const { MongoClient } = require('mongodb');

async function test() {
  const uri = "mongodb+srv://atonuzahin_db_user:2wsxXSW@dataview.fdlu509.mongodb.net/bilite";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('bilite');
    const coll = db.collection('employees');
    const docs = await coll.aggregate([{ $limit: 10 }]).toArray();
    console.log('Result length:', docs.length);
    console.log('Docs:', docs);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

test();
