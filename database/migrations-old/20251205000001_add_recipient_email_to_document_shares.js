/**
 * Migration: Add recipient_email to document_shares
 */

exports.up = async function (knex) {
    const hasColumn = await knex.schema.hasColumn('document_shares', 'recipient_email');
    if (!hasColumn) {
        await knex.schema.table('document_shares', (table) => {
            table.string('recipient_email', 255).nullable();
            table.index('recipient_email');
        });
    }
};

exports.down = async function (knex) {
    await knex.schema.table('document_shares', (table) => {
        table.dropIndex('recipient_email');
        table.dropColumn('recipient_email');
    });
};
