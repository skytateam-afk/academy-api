/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create announcement_views table
  await knex.schema.createTable('announcement_views', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('announcement_id').notNullable().references('id').inTable('announcements').onDelete('CASCADE')
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.boolean('is_dismissed').defaultTo(false)
    table.timestamp('viewed_at').defaultTo(new Date())
    table.timestamp('dismissed_at').nullable()
    
    // Composite unique index to prevent duplicate views
    table.unique(['announcement_id', 'user_id'])
    table.index('user_id')
    table.index(['announcement_id', 'is_dismissed'])
  })

  // Create promotion_displays table
  await knex.schema.createTable('promotion_displays', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('promotion_id').notNullable().references('id').inTable('promotions').onDelete('CASCADE')
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('displayed_at').defaultTo(new Date())
    table.boolean('was_clicked').defaultTo(false)
    table.timestamp('clicked_at').nullable()
    table.boolean('was_dismissed').defaultTo(false)
    table.timestamp('dismissed_at').nullable()
    
    // Indexes
    table.index('user_id')
    table.index(['promotion_id', 'user_id'])
    table.index(['promotion_id', 'displayed_at'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('promotion_displays')
  await knex.schema.dropTable('announcement_views')
}
