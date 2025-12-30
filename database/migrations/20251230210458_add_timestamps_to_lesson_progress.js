/**
 * Add created_at and updated_at to lesson_progress
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('lesson_progress', table => {
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('lesson_progress', table => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
};
