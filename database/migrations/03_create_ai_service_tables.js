/**
 * Migration: Create AI Service Tables
 */

exports.up = async function(knex) {
  // Create chat_sessions table
  await knex.schema.createTable('chat_sessions', (table) => {
    table.increments('id').primary();
    table.string('session_id', 255).unique().notNullable();
    table.string('user_id', 255).index();
    table.string('original_user_id', 255).index();
    table.jsonb('session_metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('last_activity').defaultTo(knex.fn.now()).notNullable();
    
    table.index('session_id');
    table.index('created_at');
  });

  // Create chat_messages table
  await knex.schema.createTable('chat_messages', (table) => {
    table.increments('id').primary();
    table.string('session_id', 255).notNullable().references('session_id').inTable('chat_sessions').onDelete('CASCADE');
    table.string('message_type', 50).notNullable(); // "human" or "ai"
    table.text('content').notNullable();
    table.jsonb('message_metadata').defaultTo('{}');
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    
    table.index('session_id');
    table.index('timestamp');
  });

  // Create conversation_history table
  await knex.schema.createTable('conversation_history', (table) => {
    table.increments('id').primary();
    table.string('session_id', 255).unique().notNullable().references('session_id').inTable('chat_sessions').onDelete('CASCADE');
    table.string('user_id', 255).index();
    table.jsonb('conversation_data').notNullable().defaultTo('[]');
    table.integer('message_count').defaultTo(0).notNullable();
    table.timestamp('last_message_timestamp');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });

  // Create knowledge_base_entries table
  await knex.schema.createTable('knowledge_base_entries', (table) => {
    table.increments('id').primary();
    table.string('source_id', 255);
    table.string('collection_name', 100).notNullable().index();
    table.string('title', 255);
    table.text('text').notNullable();
    table.string('category', 100);
    table.string('status', 50);
    table.text('comment');
    table.string('tags', 255);
    table.string('source', 255);
    table.string('last_updated', 100);
    table.jsonb('entry_metadata').defaultTo('{}');
    table.specificType('embedding', 'vector(384)');
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
  });

  // Create chat_feedback table
  await knex.schema.createTable('chat_feedback', (table) => {
    table.increments('id').primary();
    table.string('session_id', 255).notNullable().index();
    table.string('user_id', 255).index();
    table.string('message_id', 255).notNullable().index();
    table.string('feedback_type', 50).notNullable(); // 'thumbs_up' or 'thumbs_down'
    table.string('email', 255).notNullable().index();
    table.text('comment');
    table.integer('rating');
    table.string('widget_id', 255).index();
    table.string('user_agent', 255);
    table.string('ip_address', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add HNSW index for vector search
  await knex.raw('CREATE INDEX idx_knowledge_base_embeddings ON knowledge_base_entries USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('chat_feedback');
  await knex.schema.dropTableIfExists('knowledge_base_entries');
  await knex.schema.dropTableIfExists('conversation_history');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_sessions');
};
