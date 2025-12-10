/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('job_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('skills'); // comma-separated or JSON array
    table.integer('years_of_experience').defaultTo(0);
    table.jsonb('preferred_types'); // array of job types
    table.text('preferred_locations'); // comma-separated
    table.text('resume_url');
    table.text('bio');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Ensure one profile per user
    table.unique(['user_id']);
  });

  // Create index for faster lookups
  await knex.schema.raw('CREATE INDEX idx_job_profiles_user_id ON job_profiles(user_id)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('job_profiles');
};
