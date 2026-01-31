/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('pathway_applications', function (table) {
        table.string('status').defaultTo('approved').alter();
    })
        .then(() => {
            // Update existing records to 'approved' where status is 'pending' or null?
            // User said: "changes all status default to approved"
            // And "remove that stuff I did there the over written" (which was forcing status=true/approved)
            // So likely they want existing applications to be approved.
            return knex('pathway_applications')
                .update({ status: 'approved' });
            // .where('status', '!=', 'approved'); // Optional optimization
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('pathway_applications', function (table) {
        table.string('status').defaultTo('pending').alter(); // Assuming previous default was pending
    });
};
