/**
 * Create pathway applications table for manual approval system
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('pathway_applications', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Foreign keys
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('pathway_id').notNullable().references('id').inTable('pathways').onDelete('CASCADE');

      // Application details
      table.text('application_message').comment('Optional message from applicant');
      table.timestamp('applied_at').defaultTo(knex.fn.now());

      // Status management
      table.enum('status', ['pending', 'approved', 'rejected', 'cannot_reapply']).defaultTo('pending');

      // Review information
      table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('reviewed_at');
      table.text('review_notes').comment('Review notes from admin');

      // Rejection constraints
      table.boolean('prevent_reapplication').defaultTo(false)
        .comment('If true, user cannot reapply to this pathway');

      // Timestamps
      table.timestamps(true, true);

      // Constraints
      table.unique(['user_id', 'pathway_id'], 'unique_user_pathway_application');
      table.index('user_id');
      table.index('pathway_id');
      table.index('status');
      table.index('applied_at');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('pathway_applications');
};
