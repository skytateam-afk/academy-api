exports.up = function(knex) {
  return knex.schema.table('library_items', table => {
    table.decimal('price', 10, 2).defaultTo(0); 
  });
};

exports.down = function(knex) {
  return knex.schema.table('library_items', table => {
    table.dropColumn('price');
  });
};