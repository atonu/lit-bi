const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://atonuzahin_db_user:2wsxXSW@dataview.fdlu509.mongodb.net/bilite";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("bilite");
    const users = await db.collection("users").find({}).toArray();
    console.log(users.map(u => ({ email: u.email, name: u.name, id: u._id })));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
