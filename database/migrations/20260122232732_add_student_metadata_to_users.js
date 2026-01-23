/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('users', (table) => {
        table.string('student_id', 50).nullable().index();
        table.string('department', 100).nullable();
        table.string('level', 50).nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('student_id');
        table.dropColumn('department');
        table.dropColumn('level');
    });
};

