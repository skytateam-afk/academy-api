/**
 * Create notifications table
 */

exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('notifications')
  if (!exists) {
    return knex.schema.createTable('notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('type', 50).notNullable() // e.g., 'info', 'success', 'warning', 'error', 'course', 'enrollment', 'payment'
      table.string('title', 255).notNullable()
      table.text('message').notNullable()
      table.jsonb('data').defaultTo('{}') // Additional data like links, action buttons, etc.
      table.boolean('is_read').defaultTo(false)
      table.timestamp('read_at')
      table.timestamp('created_at').defaultTo(new Date())
      table.timestamp('updated_at').defaultTo(new Date())

      // Indexes
      table.index(['user_id', 'is_read'])
      table.index(['user_id', 'created_at'])
      table.index('type')
    })
  }
}

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notifications')
}
