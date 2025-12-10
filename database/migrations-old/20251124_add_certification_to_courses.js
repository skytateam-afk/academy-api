/**
 * Add certification field to courses table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('courses', function(table) {
    table.boolean('is_certification').defaultTo(false).comment('Indicates if this course offers a certification upon completion');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('courses', function(table) {
    table.dropColumn('is_certification');
  });
};
