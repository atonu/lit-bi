import { MongoClient } from 'mongodb';

async function test() {
  const uri = process.env.DATABASE_URL || "mongodb+srv://user:pass@dataview.fdlu509.mongodb.net/bilite";
  console.log("Connecting to", uri.replace(/:[^:@]+@/, ":***@"));
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("bilite");
    const coll = db.collection("employees");
    const docs = await coll.aggregate([{ $limit: 10 }]).toArray();
    console.log("Result:", docs);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

test();
