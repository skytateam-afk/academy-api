/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('promotions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('title', 255).notNullable()
    table.text('content').notNullable()
    table.string('image_url', 500).nullable().comment('Promotion banner/image')
    table.enum('display_type', ['popup', 'banner', 'corner']).defaultTo('popup')
    table.integer('priority').defaultTo(0).comment('Higher priority shows first')
    table.boolean('is_active').defaultTo(true)
    table.timestamp('start_date').notNullable()
    table.timestamp('end_date').notNullable()
    table.enum('target_audience', ['all', 'students', 'instructors', 'admins', 'new_users']).defaultTo('all')
    table.integer('max_displays_per_user').defaultTo(3).comment('How many times to show to each user')
    table.integer('display_frequency_hours').defaultTo(24).comment('Minimum hours between displays')
    table.boolean('requires_action').defaultTo(false).comment('Must user interact before dismissing')
    table.string('action_label', 100).notNullable().comment('CTA button text')
    table.string('action_url', 500).notNullable().comment('CTA button URL')
    table.string('discount_code', 100).nullable().comment('Optional discount code to display')
    table.json('targeting_rules').nullable().comment('Advanced targeting (course categories, user segments, etc)')
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    table.timestamps(true, true)
    
    // Indexes
    table.index(['is_active', 'start_date', 'end_date'])
    table.index('target_audience')
    table.index('priority')
    table.index('display_type')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('promotions')
}
