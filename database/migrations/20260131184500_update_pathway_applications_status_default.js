/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    // We don't want to change the default to 'approved' blindly as it bypasses review.
    // We only want to update existing records to 'approved'.
    return knex('pathway_applications')
        .update({ status: 'approved' });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    // No-op. We cannot reliably revert data updates to a previous unknown state.
    return Promise.resolve();
};
