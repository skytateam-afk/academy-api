ldexports.up = function(knex) {
    return knex.schema.table('institution_settings', table => {
        table.string('currency_code', 3).defaultTo('NGN');
        table.string('currency_symbol', 10).defaultTo('₦');
        table.string('currency_position', 10).defaultTo('before'); // before or after
    });
};

exports.down = function(knex) {
    return knex.schema.table('institution_settings', table => {
        table.dropColumn('currency_code');
        table.dropColumn('currency_symbol');
        table.dropColumn('currency_position');
    });
};
