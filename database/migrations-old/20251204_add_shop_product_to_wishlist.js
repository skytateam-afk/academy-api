/**
 * Migration: Add shop_product to wishlist item_type enum
 * 
 * This migration extends the user_wishlist table to support shop products
 */

exports.up = async function(knex) {
  // PostgreSQL requires dropping and recreating the constraint to add enum values
  await knex.raw(`
    ALTER TABLE user_wishlist 
    DROP CONSTRAINT IF EXISTS user_wishlist_item_type_check;
  `);
  
  await knex.raw(`
    ALTER TABLE user_wishlist 
    ADD CONSTRAINT user_wishlist_item_type_check 
    CHECK (item_type IN ('course', 'library_item', 'shop_product'));
  `);
};

exports.down = async function(knex) {
  // Revert to original constraint (only course and library_item)
  await knex.raw(`
    ALTER TABLE user_wishlist 
    DROP CONSTRAINT IF EXISTS user_wishlist_item_type_check;
  `);
  
  await knex.raw(`
    ALTER TABLE user_wishlist 
    ADD CONSTRAINT user_wishlist_item_type_check 
    CHECK (item_type IN ('course', 'library_item'));
  `);
};
