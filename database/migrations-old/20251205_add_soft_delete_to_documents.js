/**
 * Migration: Add Soft Delete to Documents
 * Adds deleted_at column for soft delete functionality (recycle bin)
 */

exports.up = async function(knex) {
  // Add deleted_at column to documents table
  await knex.schema.table('documents', (table) => {
    table.timestamp('deleted_at').nullable()
    table.index('deleted_at')
  })

  // Add deleted_at column to document_folders table
  await knex.schema.table('document_folders', (table) => {
    table.timestamp('deleted_at').nullable()
    table.index('deleted_at')
  })

  console.log('✅ Soft delete columns added to documents and document_folders tables')
}

exports.down = async function(knex) {
  // Remove deleted_at column from documents table
  await knex.schema.table('documents', (table) => {
    table.dropColumn('deleted_at')
  })

  // Remove deleted_at column from document_folders table
  await knex.schema.table('document_folders', (table) => {
    table.dropColumn('deleted_at')
  })

  console.log('✅ Soft delete columns removed from documents and document_folders tables')
}
