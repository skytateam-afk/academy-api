/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('institution_settings', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        
        // Organization Information
        table.string('organization_name', 255).notNullable().defaultTo('Learning Management System');
        table.text('organization_description');
        table.string('tagline', 500);
        
        // Contact Information
        table.string('contact_email', 255);
        table.string('contact_phone', 50);
        table.string('support_email', 255);
        table.text('address');
        table.string('website', 500);
        
        // Social Media Links
        table.string('facebook_url', 500);
        table.string('twitter_url', 500);
        table.string('linkedin_url', 500);
        table.string('instagram_url', 500);
        table.string('youtube_url', 500);
        
        // Logo and Branding
        table.string('logo_url', 1000); // Main logo
        table.string('logo_dark_url', 1000); // Dark mode logo
        table.string('favicon_url', 1000);
        table.string('banner_url', 1000); // Header/Hero banner
        
        // Brand Colors
        table.string('primary_color', 7).defaultTo('#22c55e'); // Green
        table.string('secondary_color', 7).defaultTo('#3b82f6'); // Blue
        table.string('accent_color', 7).defaultTo('#8b5cf6'); // Purple
        
        // Customization
        table.string('font_family', 100).defaultTo('Inter');
        table.integer('max_upload_size').defaultTo(10485760); // 10MB in bytes
        table.boolean('allow_public_registration').defaultTo(true);
        table.boolean('require_email_verification').defaultTo(true);
        table.boolean('enable_course_reviews').defaultTo(true);
        table.boolean('enable_certificates').defaultTo(true);
        
        // Footer Information
        table.text('footer_text');
        table.text('copyright_text');
        table.text('terms_url');
        table.text('privacy_url');
        
        // Metadata
        table.timestamps(true, true);
        
        // Ensure only one row exists
        table.unique(['id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('institution_settings');
};
