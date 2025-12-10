/**
 * Migration to add theme_mode field to user_settings table
 * theme_mode stores the user's preference for light/dark/system theme
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('user_settings', function(table) {
    table.string('theme_mode').defaultTo('light'); // 'light', 'dark', or 'system'
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('user_settings', function(table) {
    table.dropColumn('theme_mode');
  });
};
