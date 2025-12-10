/**
 * Add low_stock_threshold field to shop_products table
 */

exports.up = function(knex) {
  return knex.schema.alterTable('shop_products', table => {
    table.integer('low_stock_threshold').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('shop_products', table => {
    table.dropColumn('low_stock_threshold');
  });
};
