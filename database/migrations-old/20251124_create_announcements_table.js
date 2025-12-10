/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('announcements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('title', 255).notNullable()
    table.text('content').notNullable()
    table.enum('type', ['info', 'warning', 'success', 'error']).defaultTo('info')
    table.integer('priority').defaultTo(0).comment('Higher priority shows first')
    table.boolean('is_active').defaultTo(true)
    table.timestamp('start_date').nullable()
    table.timestamp('end_date').nullable()
    table.enum('target_audience', ['all', 'students', 'instructors', 'admins']).defaultTo('all')
    table.boolean('is_dismissible').defaultTo(true).comment('Can users dismiss this announcement')
    table.string('action_label', 100).nullable().comment('Optional CTA button text')
    table.string('action_url', 500).nullable().comment('Optional CTA button URL')
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    table.timestamps(true, true)
    
    // Indexes
    table.index(['is_active', 'start_date', 'end_date'])
    table.index('target_audience')
    table.index('priority')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('announcements')
}
