/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('user_settings', function (table) {
        // Email notification preferences
        table.boolean('email_course_updates').defaultTo(true);
        table.boolean('email_new_announcements').defaultTo(true);
        table.boolean('email_assignment_reminders').defaultTo(true);
        table.boolean('email_quiz_results').defaultTo(true);
        table.boolean('email_new_messages').defaultTo(true);
        table.boolean('email_marketing').defaultTo(false);
        
        // In-app notification preferences
        table.boolean('inapp_course_updates').defaultTo(true);
        table.boolean('inapp_new_announcements').defaultTo(true);
        table.boolean('inapp_assignment_reminders').defaultTo(true);
        table.boolean('inapp_quiz_results').defaultTo(true);
        table.boolean('inapp_new_messages').defaultTo(true);
        
        // Account preferences
        table.boolean('profile_public').defaultTo(false);
        table.boolean('show_progress_publicly').defaultTo(false);
        table.string('timezone').defaultTo('UTC');
        table.string('language').defaultTo('en');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('user_settings', function (table) {
        table.dropColumn('email_course_updates');
        table.dropColumn('email_new_announcements');
        table.dropColumn('email_assignment_reminders');
        table.dropColumn('email_quiz_results');
        table.dropColumn('email_new_messages');
        table.dropColumn('email_marketing');
        table.dropColumn('inapp_course_updates');
        table.dropColumn('inapp_new_announcements');
        table.dropColumn('inapp_assignment_reminders');
        table.dropColumn('inapp_quiz_results');
        table.dropColumn('inapp_new_messages');
        table.dropColumn('profile_public');
        table.dropColumn('show_progress_publicly');
        table.dropColumn('timezone');
        table.dropColumn('language');
    });
};
