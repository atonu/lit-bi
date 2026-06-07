const { MongoClient } = require('mongodb'); 
async function run() { 
  const client = new MongoClient('mongodb+srv://atonuzahin_db_user:2wsxXSW@dataview.fdlu509.mongodb.net/bilite'); 
  await client.connect(); 
  const db = client.db(); 
  const orgs = await db.collection('organizations').find({slug: 'default'}).toArray(); 
  if(orgs.length > 1) { 
    const toDelete = orgs.slice(1).map(o => o._id); 
    await db.collection('organizations').deleteMany({_id: {$in: toDelete}}); 
    console.log('Deleted ' + toDelete.length + ' duplicates'); 
  } else { 
    console.log('No duplicates found'); 
  } 
  
  // Also clean up any potential duplicate user emails
  const users = await db.collection('users').find({email: 'test@litebi.com'}).toArray();
  if (users.length > 1) {
    const toDeleteUsers = users.slice(1).map(u => u._id);
    await db.collection('users').deleteMany({_id: {$in: toDeleteUsers}});
    console.log('Deleted ' + toDeleteUsers.length + ' duplicate users');
  }

  await client.close(); 
} 
run().catch(console.error);
