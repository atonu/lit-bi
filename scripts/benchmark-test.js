const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";
const BACKEND_SECRET = process.env.BACKEND_SECRET || "bi-lite-backend-secret-key-super-secure-87654321";

// Create a valid authentication token for testing
function generateTestToken(orgId) {
  return jwt.sign(
    {
      userId: "6657bfb1a511874281691234",
      organizationId: orgId,
      role: "OWNER",
    },
    BACKEND_SECRET,
    { expiresIn: "1h" }
  );
}

async function runBenchmark() {
  console.log("=== BI-Lite Scale Benchmark ===");
  console.log(`Connecting to backend: ${BACKEND_URL}`);

  // 1. Check health
  try {
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const health = await healthRes.json();
    console.log(`✓ Backend health check: ${health.status}`);
  } catch (err) {
    console.error("✗ Failed to connect to backend server. Make sure it is running on port 3002.");
    process.exit(1);
  }

  // 2. We need a connection ID to query. Let's list connections in database.
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/aura_bi");
  await client.connect();
  const db = client.db();
  const connections = await db.collection("database_connections").find({ status: "CONNECTED" }).toArray();

  if (connections.length === 0) {
    console.log("⚠️ No active database connections found in database to run queries against.");
    console.log("Please setup and save at least one database connection first through the UI.");
    await client.close();
    process.exit(0);
  }

  const conn = connections[0];
  console.log(`Using database connection: "${conn.alias}" (${conn.engine})`);

  const token = generateTestToken(conn.organization_id.toString());
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Let's formulate a query based on engine
  let query = "";
  if (conn.engine === "POSTGRESQL") {
    query = "SELECT * FROM information_schema.tables LIMIT 100";
  } else if (conn.engine === "MONGODB") {
    // Introspect schema to find a collection to query
    const meta = await db.collection("schema_metadata").findOne({ connection_id: conn._id });
    const collName = meta ? meta.table_name : "test";
    query = JSON.stringify({
      collection: collName,
      pipeline: [{ $limit: 100 }],
    });
  }

  await client.close();

  console.log(`Query payload: ${query}`);

  const CONCURRENT_REQUESTS = 5;
  console.log(`\nSimulating ${CONCURRENT_REQUESTS} concurrent users running queries...`);

  const start = Date.now();
  const promises = [];

  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(
      (async (userIndex) => {
        try {
          const userStart = Date.now();
          // POST /api/query/execute
          const executeRes = await fetch(`${BACKEND_URL}/api/query/execute`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              connectionId: conn._id.toString(),
              engine: conn.engine,
              query,
            }),
          });

          const executeData = await executeRes.json();
          if (!executeRes.ok || !executeData.success) {
            throw new Error(`Execution initiation failed: ${executeData.error}`);
          }

          const jobId = executeData.jobId;
          // console.log(`[User ${userIndex}] Job started. Job ID: ${jobId}`);

          // Poll status
          let completed = false;
          let columns = [];
          let totalRows = 0;
          while (!completed) {
            const statusRes = await fetch(`${BACKEND_URL}/api/query/status/${jobId}`, { headers });
            const statusData = await statusRes.json();
            if (!statusRes.ok || !statusData.success) {
              throw new Error(`Polling failed: ${statusData.error}`);
            }

            if (statusData.status === "completed") {
              completed = true;
              columns = statusData.columns;
              totalRows = statusData.rowCount;
            } else if (statusData.status === "failed") {
              throw new Error(`Query failed: ${statusData.error}`);
            } else {
              await new Promise((r) => setTimeout(r, 200)); // poll fast
            }
          }

          // Fetch page 1
          const resultsRes = await fetch(`${BACKEND_URL}/api/query/results/${jobId}?page=1`, { headers });
          const resultsData = await resultsRes.json();
          if (!resultsRes.ok || !resultsData.success) {
            throw new Error(`Results retrieval failed: ${resultsData.error}`);
          }

          const latency = Date.now() - userStart;
          console.log(
            `✓ [User ${userIndex}] Query succeeded! Latency: ${latency}ms, Rows: ${totalRows}, Columns: [${columns.slice(0, 3).join(", ")}${columns.length > 3 ? "..." : ""}]`
          );
          return { success: true, latency };
        } catch (err) {
          console.error(`✗ [User ${userIndex}] Failed: ${err.message}`);
          return { success: false };
        }
      })(i)
    );
  }

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - start;

  const successful = results.filter((r) => r.success);
  console.log(`\n=== Benchmark Results ===`);
  console.log(`Total duration: ${totalDuration}ms`);
  console.log(`Success rate: ${successful.length}/${CONCURRENT_REQUESTS} (${(successful.length / CONCURRENT_REQUESTS) * 100}%)`);
  if (successful.length > 0) {
    const avgLatency = successful.reduce((acc, r) => acc + r.latency, 0) / successful.length;
    console.log(`Average user latency: ${avgLatency.toFixed(1)}ms`);
  }
}

runBenchmark().catch(console.error);
