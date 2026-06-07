# MongoDB Integration Guide — BI-Lite

This guide walks you through everything needed to migrate BI-Lite's control-plane database to MongoDB and add MongoDB as a user-connectable data source.

---

## Part 1 — Install & Run MongoDB Locally

> Skip this part if you already have a MongoDB Atlas cluster.

### Step 1 — Download & Install MongoDB Community Edition

1. Go to https://www.mongodb.com/try/download/community
2. Select **Windows**, **msi** package, and click **Download**.
3. Run the installer, choosing **Complete** setup.  
   ✅ Check **"Install MongoDB as a Service"** so it starts automatically.
4. Optionally install **MongoDB Compass** (GUI) when prompted — highly recommended.

Verify the install:
```powershell
mongod --version
mongosh --version
```

### Step 2 — Start MongoDB (if not running as a service)

```powershell
# Start the server (default port 27017, data in C:\data\db)
mongod --dbpath "C:\data\db"
```

Or check the service status:
```powershell
Get-Service -Name "MongoDB"
Start-Service -Name "MongoDB"   # if stopped
```

---

## Part 2 — Bootstrap the BI-Lite Database

### Step 3 — Run the Setup Script

From the project root, run:
```powershell
mongosh "mongodb://localhost:27017/aura_bi" mongodb_setup.js
```

For **MongoDB Atlas**:
```powershell
mongosh "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aura_bi" mongodb_setup.js
```

This creates all 5 collections with validators and indexes, and seeds the default organization.

Expected output:
```
=== BI-Lite MongoDB Bootstrap ===
✓ Collection 'organizations' created
✓ Collection 'users' created
✓ Collection 'database_connections' created
✓ Collection 'schema_metadata' created
✓ Collection 'report_templates' created
✓ Seeded default organization
=== Bootstrap complete ===
```

### Step 4 — Set the Environment Variable

Edit `.env` in the project root and set:

```env
# Local MongoDB
MONGODB_URI="mongodb://localhost:27017/aura_bi"

# MongoDB Atlas
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aura_bi?retryWrites=true&w=majority"
```

> **Security note:** Never commit `.env` to version control. It is already in `.gitignore`.

---

## Part 3 — Regenerate the Prisma Client

The Prisma schema now targets MongoDB. You must regenerate the client:

### Step 5 — Generate the Prisma Client

```powershell
cmd /c "npx prisma generate"
```

### Step 6 — Push the Schema to MongoDB

This tells Prisma to validate/sync its understanding of the collections (it does not run migrations for MongoDB, but it generates the types):

```powershell
cmd /c "npx prisma db push"
```

> **Note:** Prisma with MongoDB does not run SQL migrations. All collection setup was done in Step 3 via `mongodb_setup.js`.

---

## Part 4 — Run the Application

### Step 7 — Start the Dev Server

```powershell
cmd /c "npm run dev"
```

Open http://localhost:3000. The app should load and connect to MongoDB instead of PostgreSQL.

---

## Part 5 — Connect a MongoDB Database via the UI

Once the app is running:

### Step 8 — Add a MongoDB Connection

1. Click **"Add Connection"** in the sidebar.
2. Select **MongoDB** as the engine.
3. Enter the **Connection URI** — e.g.:
   - Local: `mongodb://localhost:27017/my_database`
   - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/my_database`
4. Give it an **Alias** (e.g. "Production Atlas").
5. Click **"Test Connection"** — you should see ✅ and the MongoDB server version.
6. Click **"Introspect Schema"** — this samples your collections and infers field types.
7. Click **"Save Connection"**.

### Step 9 — Query MongoDB with Natural Language

1. Select your MongoDB connection from the sidebar.
2. Type a question in the chat input, e.g.:
   - *"Show me total orders grouped by status"*
   - *"What are the top 10 products by revenue?"*
   - *"Count users registered per month in 2024"*
3. The AI generates a MongoDB aggregation pipeline and runs it.
4. Results are displayed as an interactive chart.

---

## Part 6 — MongoDB Setup Script Reference

The file [`mongodb_setup.js`](./mongodb_setup.js) is the MongoDB equivalent of `supabase_setup.sql`.

### Collections Created

| Collection | Purpose | PostgreSQL Equivalent |
|---|---|---|
| `organizations` | Multi-tenant root entity | `organizations` table |
| `users` | User accounts | `users` table |
| `database_connections` | Encrypted DB credentials | `database_connections` table |
| `schema_metadata` | Cached column/field introspection | `schema_metadata` table |
| `report_templates` | Saved AI report configurations | `report_templates` table |

### Indexes Created

| Collection | Index | Type |
|---|---|---|
| `organizations` | `slug` | Unique |
| `users` | `email` | Unique |
| `users` | `organization_id` | Regular |
| `database_connections` | `organization_id` | Regular |
| `database_connections` | `status` | Regular |
| `schema_metadata` | `(connection_id, table_schema, table_name, column_name)` | Unique compound |
| `schema_metadata` | `connection_id` | Regular |
| `report_templates` | `organization_id` | Regular |
| `report_templates` | `created_by_id` | Regular |

---

## Part 7 — Understanding MongoDB vs SQL in This App

### Control-Plane Database (App's Own Data)

| | Before (PostgreSQL) | After (MongoDB) |
|---|---|---|
| ORM | Prisma + `@prisma/adapter-pg` | Prisma (built-in MongoDB connector) |
| IDs | UUID strings | BSON ObjectId |
| Connection var | `DATABASE_URL` | `MONGODB_URI` |
| Schema setup | `supabase_setup.sql` | `mongodb_setup.js` |
| Migrations | `prisma migrate` | `prisma db push` (no migration files) |

### User-Facing Database Connections

| | PostgreSQL | MySQL | MongoDB |
|---|---|---|---|
| Credentials | host/port/user/pass | host/port/user/pass | Connection URI |
| Query language | SQL SELECT | SQL SELECT | Aggregation pipeline JSON |
| Introspection | `information_schema` | `information_schema` | `listCollections` + document sampling |
| AI output format | SQL string | SQL string | `{ "collection": "...", "pipeline": [...] }` |
| Read-only guard | `BEGIN READ ONLY` | transaction | No `$out`/`$merge`/`$where` stages |

---

## Troubleshooting

### `MONGODB_URI is not set`
- Make sure `.env` has the `MONGODB_URI` key (not `DATABASE_URL`).
- Restart the dev server after editing `.env`.

### `MongoServerSelectionError: connect ECONNREFUSED`
- MongoDB is not running. Start it with `Start-Service MongoDB` or `mongod --dbpath "C:\data\db"`.

### `PrismaClientInitializationError`
- Run `npx prisma generate` to regenerate the client after the schema change.

### `Cannot use $out stage` error
- This is the MQL safety guard working correctly — the AI generated a write pipeline. Rephrase your question as a read-only analytics query.

### Existing PostgreSQL connections still work?
- Yes. The PostgreSQL and MySQL user-facing connectors are unchanged. The only change is the app's **own** storage (control plane) moved to MongoDB.
