// =============================================================================
// AURA BI — MongoDB Control-Plane Bootstrap
// =============================================================================
// Run this script with mongosh to create all collections, indexes, and
// schema validators for the AURA BI control-plane database.
//
// Usage:
//   mongosh "mongodb://localhost:27017/aura_bi" mongodb_setup.js
//   mongosh "mongodb+srv://<user>:<pass>@cluster.mongodb.net/aura_bi" mongodb_setup.js
//
// This is the MongoDB equivalent of supabase_setup.sql.
// It is idempotent — safe to run multiple times.
// =============================================================================

// ---------------------------------------------------------------------------
// Switch to (or create) the aura_bi database
// ---------------------------------------------------------------------------
// When you connect with the URI above, you are already on aura_bi.
// The line below is a safety net in case you run this from a different db.
use("aura_bi");

print("=== AURA BI MongoDB Bootstrap ===\n");

// ---------------------------------------------------------------------------
// 1. organizations
// ---------------------------------------------------------------------------
// Equivalent to the PostgreSQL `organizations` table.
// ---------------------------------------------------------------------------

db.createCollection("organizations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "created_at", "updated_at"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", description: "Organization display name" },
        slug: {
          bsonType: "string",
          description: "URL-safe unique identifier",
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

// Unique index on slug (replaces PostgreSQL UNIQUE constraint)
db.organizations.createIndex({ slug: 1 }, { unique: true, name: "idx_organizations_slug_unique" });

print("✓ Collection 'organizations' created");

// ---------------------------------------------------------------------------
// 2. users
// ---------------------------------------------------------------------------

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name", "hashed_password", "role", "organization_id", "created_at", "updated_at"],
      properties: {
        _id: { bsonType: "objectId" },
        email: { bsonType: "string" },
        name: { bsonType: "string" },
        hashed_password: { bsonType: "string" },
        avatar_url: { bsonType: ["string", "null"] },
        role: {
          bsonType: "string",
          enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
          description: "User role within the organization",
        },
        organization_id: { bsonType: "objectId" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

db.users.createIndex({ email: 1 }, { unique: true, name: "idx_users_email_unique" });
db.users.createIndex({ organization_id: 1 }, { name: "idx_users_org_id" });

print("✓ Collection 'users' created");

// ---------------------------------------------------------------------------
// 3. database_connections
// ---------------------------------------------------------------------------

db.createCollection("database_connections", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["alias", "engine", "status", "ssl_enabled", "organization_id", "created_at", "updated_at"],
      properties: {
        _id: { bsonType: "objectId" },
        alias: { bsonType: "string", description: "Human-readable label" },
        engine: {
          bsonType: "string",
          enum: ["POSTGRESQL", "MYSQL", "MONGODB"],
          description: "Database engine type",
        },
        // SQL engine fields (optional for MongoDB connections)
        host: { bsonType: ["string", "null"] },
        port: { bsonType: ["int", "null"] },
        db_name: { bsonType: ["string", "null"] },
        db_user: { bsonType: ["string", "null"] },
        encrypted_password: {
          bsonType: ["string", "null"],
          description: "AES-256-GCM encrypted password (SQL engines)",
        },
        ssl_enabled: { bsonType: "bool" },
        // MongoDB engine field
        encrypted_uri: {
          bsonType: ["string", "null"],
          description: "AES-256-GCM encrypted full connection URI (MongoDB)",
        },
        status: {
          bsonType: "string",
          enum: ["PENDING", "CONNECTED", "FAILED", "REVOKED"],
        },
        last_tested_at: { bsonType: ["date", "null"] },
        organization_id: { bsonType: "objectId" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

db.database_connections.createIndex({ organization_id: 1 }, { name: "idx_dbconn_org_id" });
db.database_connections.createIndex({ status: 1 }, { name: "idx_dbconn_status" });

print("✓ Collection 'database_connections' created");

// ---------------------------------------------------------------------------
// 4. schema_metadata
// ---------------------------------------------------------------------------
// One document per column (SQL) or field (MongoDB). Cached introspection
// injected into AI prompts to avoid querying information_schema every time.
// ---------------------------------------------------------------------------

db.createCollection("schema_metadata", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "connection_id",
        "table_schema",
        "table_name",
        "column_name",
        "data_type",
        "is_nullable",
        "is_primary_key",
        "ordinal_position",
        "introspected_at",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        connection_id: { bsonType: "objectId" },
        // For SQL: schema name (e.g. "public").
        // For MongoDB: database name.
        table_schema: { bsonType: "string" },
        // For SQL: table name. For MongoDB: collection name.
        table_name: { bsonType: "string" },
        // For SQL: column name. For MongoDB: field path (dot-notation).
        column_name: { bsonType: "string" },
        // For SQL: PostgreSQL/MySQL data type. For MongoDB: BSON type.
        data_type: { bsonType: "string" },
        is_nullable: { bsonType: "bool" },
        is_primary_key: { bsonType: "bool" },
        column_default: { bsonType: ["string", "null"] },
        ordinal_position: { bsonType: "int" },
        introspected_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

// Unique compound index: one document per (connection, schema, table, column)
db.schema_metadata.createIndex(
  {
    connection_id: 1,
    table_schema: 1,
    table_name: 1,
    column_name: 1,
  },
  {
    unique: true,
    name: "idx_schema_metadata_unique",
  }
);

db.schema_metadata.createIndex({ connection_id: 1 }, { name: "idx_schema_metadata_conn_id" });

print("✓ Collection 'schema_metadata' created");

// ---------------------------------------------------------------------------
// 5. report_templates
// ---------------------------------------------------------------------------

db.createCollection("report_templates", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "title",
        "natural_language_query",
        "chart_type",
        "is_system_template",
        "organization_id",
        "created_by_id",
        "created_at",
        "updated_at",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        title: { bsonType: "string" },
        description: { bsonType: ["string", "null"] },
        natural_language_query: { bsonType: "string" },
        chart_type: {
          bsonType: "string",
          enum: ["LINE", "BAR", "DONUT", "TABLE", "AREA", "SCATTER"],
        },
        default_filters: {
          description: "Arbitrary JSON object for default filter state",
        },
        is_system_template: { bsonType: "bool" },
        organization_id: { bsonType: "objectId" },
        created_by_id: { bsonType: "objectId" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

db.report_templates.createIndex({ organization_id: 1 }, { name: "idx_reports_org_id" });
db.report_templates.createIndex({ created_by_id: 1 }, { name: "idx_reports_created_by" });

print("✓ Collection 'report_templates' created");

// ---------------------------------------------------------------------------
// 6. Seed — Default Organization (placeholder for pre-auth phase)
// ---------------------------------------------------------------------------
// This mirrors the PLACEHOLDER_ORG_ID used in saveConnection().
// The 24-char hex string "000000000000000000000001" is a valid ObjectId.
// ---------------------------------------------------------------------------

const placeholderOrgId = ObjectId("000000000000000000000001");

const existingOrg = db.organizations.findOne({ _id: placeholderOrgId });
if (!existingOrg) {
  db.organizations.insertOne({
    _id: placeholderOrgId,
    name: "Default Organization",
    slug: "default",
    created_at: new Date(),
    updated_at: new Date(),
  });
  print("✓ Seeded default organization");
} else {
  print("• Default organization already exists — skipped");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

print("\n=== Bootstrap complete ===");
print("Collections created:");
db.getCollectionNames().forEach((name) => print("  • " + name));
