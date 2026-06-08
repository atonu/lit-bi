const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aura_bi';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db();

  console.log('=== Safely Clearing Temporary Query Data ===');

  // 1. Delete query job results (actual rows data, occupies the most space)
  const resultsResult = await db.collection('query_job_results').deleteMany({});
  console.log(`✓ Cleared query_job_results: deleted ${resultsResult.deletedCount} documents.`);

  // 2. Delete query job logs
  const jobsResult = await db.collection('query_jobs').deleteMany({});
  console.log(`✓ Cleared query_jobs: deleted ${jobsResult.deletedCount} documents.`);

  console.log('\nDone! Transient query caches cleared successfully with zero impact on users, connections, or chat history.');
  await client.close();
}

run().catch(console.error);
