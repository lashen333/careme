import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

declare global {
  // eslint-disable-next-line no-var
  var postgresClient: postgres.Sql | undefined;
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = global.postgresClient || postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== 'production') {
  global.postgresClient = client;
}

export const db = drizzle(client, { schema });

