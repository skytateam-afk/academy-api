/**
 * Migration: Add cover_photo_url to users table
 * 
 * This migration adds a cover_photo_url column to store profile cover images
 * similar to social media platforms like Twitter, LinkedIn, and WhatsApp.
 */

exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.text('cover_photo_url').nullable().after('avatar_url')
      .comment('URL for user profile cover photo');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('cover_photo_url');
  });
};
