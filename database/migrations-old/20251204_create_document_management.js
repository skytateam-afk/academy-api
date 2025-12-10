/**
 * Migration: Create Document Management System Tables
 * Creates tables for document folders, documents, sharing, versions, and storage tracking
 */

exports.up = async function(knex) {
  // Create document_folders table
  await knex.schema.createTable('document_folders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('parent_folder_id').nullable().references('id').inTable('document_folders').onDelete('CASCADE')
    table.string('name', 255).notNullable()
    table.text('description').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    
    // Unique constraint: folder name must be unique per user and parent folder
    table.unique(['user_id', 'parent_folder_id', 'name'])
    
    // Indexes
    table.index('user_id')
    table.index('parent_folder_id')
  })

  // Create documents table
  await knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('folder_id').nullable().references('id').inTable('document_folders').onDelete('SET NULL')
    table.string('title', 255).notNullable()
    table.text('description').nullable()
    table.text('file_url').notNullable()
    table.string('file_name', 255).notNullable()
    table.string('file_type', 50).notNullable()
    table.bigInteger('file_size').notNullable()
    table.string('mime_type', 100).nullable()
    table.specificType('tags', 'TEXT[]').nullable()
    table.integer('version').defaultTo(1)
    table.boolean('is_public').defaultTo(false)
    table.integer('download_count').defaultTo(0)
    table.integer('view_count').defaultTo(0)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    
    // Indexes
    table.index('user_id')
    table.index('folder_id')
    table.index('file_type')
    table.index('is_public')
    table.index('created_at')
  })

  // Create document_shares table
  await knex.schema.createTable('document_shares', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE')
    table.uuid('shared_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('shared_with_user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
    table.enum('share_type', ['user', 'link', 'password', 'public']).notNullable()
    table.enum('permission_level', ['view', 'edit', 'owner']).defaultTo('view')
    table.string('access_token', 255).nullable().unique()
    table.string('password_hash', 255).nullable()
    table.timestamp('expires_at').nullable()
    table.integer('max_downloads').nullable()
    table.integer('download_count').defaultTo(0)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    
    // Indexes
    table.index('document_id')
    table.index('shared_by')
    table.index('shared_with_user_id')
    table.index('access_token')
    table.index('share_type')
  })

  // Create document_versions table
  await knex.schema.createTable('document_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE')
    table.integer('version_number').notNullable()
    table.text('file_url').notNullable()
    table.bigInteger('file_size').notNullable()
    table.uuid('uploaded_by').notNullable().references('id').inTable('users')
    table.text('change_notes').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    
    // Indexes
    table.index('document_id')
    table.index('uploaded_by')
  })

  // Create user_storage table
  await knex.schema.createTable('user_storage', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE')
    table.bigInteger('used_bytes').defaultTo(0)
    table.bigInteger('quota_bytes').defaultTo(1073741824) // 1GB default
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    
    // Index
    table.index('user_id')
  })

  // Add trigger for updated_at on document_folders
  await knex.raw(`
    CREATE TRIGGER update_document_folders_updated_at 
    BEFORE UPDATE ON document_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `)

  // Add trigger for updated_at on documents
  await knex.raw(`
    CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `)

  // Add trigger for updated_at on user_storage
  await knex.raw(`
    CREATE TRIGGER update_user_storage_updated_at 
    BEFORE UPDATE ON user_storage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `)

  console.log('✅ Document management tables created successfully')
}

exports.down = async function(knex) {
  // Drop triggers first
  await knex.raw('DROP TRIGGER IF EXISTS update_document_folders_updated_at ON document_folders')
  await knex.raw('DROP TRIGGER IF EXISTS update_documents_updated_at ON documents')
  await knex.raw('DROP TRIGGER IF EXISTS update_user_storage_updated_at ON user_storage')

  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('user_storage')
  await knex.schema.dropTableIfExists('document_versions')
  await knex.schema.dropTableIfExists('document_shares')
  await knex.schema.dropTableIfExists('documents')
  await knex.schema.dropTableIfExists('document_folders')

  console.log('✅ Document management tables dropped successfully')
}
