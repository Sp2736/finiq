import { Pool } from 'pg';

// 1. Strictly read from the runtime environment. NO hardcoded fallbacks.
const connectionString = process.env.DATABASE_URL;

// 2. Fail fast and loudly if the crucial security credential is missing
if (!connectionString) {
  throw new Error(
    "CRITICAL SECURITY ERROR: DATABASE_URL environment variable is missing. " +
    "Database connections have been blocked. Please configure this variable in your deployment environment."
  );
}

// 3. Initialize the secure pool
const pool = new Pool({
  connectionString,
  // For cloud PostgreSQL providers (Neon, Supabase, AWS), SSL is required.
  // If you are connecting to a strictly internal VPC database without SSL, you can remove this block.
  ssl: {
    rejectUnauthorized: false 
  }
});

export default pool;