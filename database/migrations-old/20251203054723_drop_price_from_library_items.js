/**
 * Remove price column from library_items table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('library_items', (table) => {
    table.dropColumn('price');
  });
};

/**
 * Add price column back to library_items table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('library_items', (table) => {
    table.decimal('price', 10, 2);
  });
};
