import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('audit_log')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.references('users.id').onDelete('set null')
    ) // Assuming a 'users' table with an 'id' column
    .addColumn('action', 'varchar(255)', (col) => col.notNull())
    .addColumn('table_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('record_id', 'text') // Or 'integer' or 'uuid' depending on referenced PK types
    .addColumn('old_values', 'jsonb')
    .addColumn('new_values', 'jsonb')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('audit_log').ifExists().execute();
}
