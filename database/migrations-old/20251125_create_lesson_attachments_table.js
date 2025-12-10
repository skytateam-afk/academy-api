/**
 * Migration: Create lesson_attachments table
 * Description: Adds support for attachments at the lesson level
 */

exports.up = async function(knex) {
  // Create lesson_attachments table
  await knex.schema.createTable('lesson_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').notNullable()
      .references('id').inTable('lessons')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    
    table.string('title', 255).notNullable();
    table.text('file_url').notNullable();
    table.string('file_type', 100);
    table.bigInteger('file_size').defaultTo(0);
    table.integer('display_order').defaultTo(0);
    table.boolean('is_downloadable').defaultTo(true);
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('lesson_id');
    table.index(['lesson_id', 'display_order']);
  });

  console.log('✅ Created lesson_attachments table');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('lesson_attachments');
  console.log('✅ Dropped lesson_attachments table');
};
