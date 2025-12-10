/**
 * Ensure library_categories table has slug column
 * This migration adds the slug column if it doesn't exist
 */

exports.up = async function(knex) {
  const hasSlug = await knex.schema.hasColumn('library_categories', 'slug');
  
  if (!hasSlug) {
    // First add the column as nullable
    await knex.schema.table('library_categories', (table) => {
      table.string('slug', 100).nullable();
    });
    
    // Generate slugs for existing categories
    const categories = await knex('library_categories').select('id', 'name');
    
    for (const category of categories) {
      const slug = category.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      await knex('library_categories')
        .where({ id: category.id })
        .update({ slug });
    }
    
    // Now make it not nullable and unique
    await knex.schema.alterTable('library_categories', (table) => {
      table.string('slug', 100).notNullable().unique().alter();
      table.index('slug');
    });
    
    console.log('✓ Added slug column to library_categories table');
  } else {
    console.log('✓ Slug column already exists in library_categories table');
  }
};

exports.down = async function(knex) {
  const hasSlug = await knex.schema.hasColumn('library_categories', 'slug');
  
  if (hasSlug) {
    await knex.schema.table('library_categories', (table) => {
      table.dropColumn('slug');
    });
    console.log('✓ Removed slug column from library_categories table');
  }
};
