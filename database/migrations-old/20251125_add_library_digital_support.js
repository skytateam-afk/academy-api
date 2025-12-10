/**
 * Add digital file support (PDF/MP3) to library items
 * Makes thumbnails mandatory for digital items
 */

exports.up = async function(knex) {
  // Add new columns for enhanced digital support
  await knex.schema.alterTable('library_items', (table) => {
    table.string('thumbnail_url', 500); // Mandatory thumbnail for all items
    table.string('file_mime_type', 100); // MIME type of the file
    table.integer('duration'); // For audio/video files in seconds
  });

  console.log('✓ Added digital file support columns to library_items');
};

exports.down = async function(knex) {
  await knex.schema.alterTable('library_items', (table) => {
    table.dropColumn('thumbnail_url');
    table.dropColumn('file_mime_type');
    table.dropColumn('duration');
  });

  console.log('✓ Removed digital file support columns from library_items');
};
