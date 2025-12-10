exports.up = async function (knex) {
    // Add mfa_enabled column to users table
    await knex.schema.table('users', function (table) {
        table.boolean('mfa_enabled').defaultTo(false);
    });
};

exports.down = async function (knex) {
    // Remove mfa_enabled column from users table
    await knex.schema.table('users', function (table) {
        table.dropColumn('mfa_enabled');
    });
};
