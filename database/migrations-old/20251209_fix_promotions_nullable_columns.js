/**
 * Fix promotions table nullable columns
 * - Make end_date nullable (promotions can be ongoing)
 * - Make action_label nullable (not all promotions require actions)
 * - Make action_url nullable (not all promotions require actions)
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('promotions', (table) => {
    // Change columns to be nullable
    table.timestamp('end_date').nullable().alter()
    table.string('action_label', 100).nullable().alter()
    table.string('action_url', 500).nullable().alter()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('promotions', (table) => {
    // Revert back to not nullable (with defaults to prevent errors)
    table.timestamp('end_date').notNullable().defaultTo(knex.fn.now()).alter()
    table.string('action_label', 100).notNullable().defaultTo('Learn More').alter()
    table.string('action_url', 500).notNullable().defaultTo('#').alter()
  })
}
