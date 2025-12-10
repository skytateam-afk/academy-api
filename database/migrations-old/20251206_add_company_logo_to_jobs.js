/**
 * Add company_logo_url column to jobs table
 */

exports.up = async function (knex) {
    await knex.schema.table('jobs', (table) => {
        table.string('company_logo_url', 500);
    });

    console.log('✓ Added company_logo_url column to jobs table');
};

exports.down = async function (knex) {
    await knex.schema.table('jobs', (table) => {
        table.dropColumn('company_logo_url');
    });

    console.log('✓ Removed company_logo_url column from jobs table');
};
