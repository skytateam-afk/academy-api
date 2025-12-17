exports.up = function(knex) {
  return knex.schema.table('lessons', table => {
    // Adding the missing column. 
    // You can change .string() to .integer() if needed.
    table.string('content_type').nullable(); 
  });
};

exports.down = function(knex) {
  return knex.schema.table('lessons', table => {
    table.dropColumn('content_type');
  });
};