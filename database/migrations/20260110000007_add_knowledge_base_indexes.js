/**
 * Migration: Add indexes to knowledge_base_entries table
 * Improves performance for category filtering and timestamp ordering
 */

exports.up = async function(knex) {
  // Check if table exists
  const hasTable = await knex.schema.hasTable('knowledge_base_entries');
  
  if (hasTable) {
    // Check if index exists using raw query
    const checkIndex = async (indexName) => {
      const result = await knex.raw(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'knowledge_base_entries' AND indexname = ?
        ) as exists
      `, [indexName]);
      return result.rows[0].exists;
    };
    
    // Add index on category (used for filtering in repository queries)
    if (!(await checkIndex('idx_knowledge_base_category'))) {
      await knex.schema.table('knowledge_base_entries', (table) => {
        table.index('category', 'idx_knowledge_base_category');
      });
      console.log('✅ Added index on category');
    }
    
    // Add index on timestamp (used for ORDER BY in repository queries)
    if (!(await checkIndex('idx_knowledge_base_timestamp'))) {
      await knex.schema.table('knowledge_base_entries', (table) => {
        table.index('timestamp', 'idx_knowledge_base_timestamp');
      });
      console.log('✅ Added index on timestamp');
    }
    
    // Optional: Composite index for collection_name + category (if both filters are common)
    // Uncomment if you frequently filter by both collection_name AND category together
    /*
    if (!(await checkIndex('idx_knowledge_base_collection_category'))) {
      await knex.raw(`
        CREATE INDEX idx_knowledge_base_collection_category 
        ON knowledge_base_entries (collection_name, category)
      `);
      console.log('✅ Added composite index on (collection_name, category)');
    }
    */
  }
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('knowledge_base_entries');
  
  if (hasTable) {
    // Drop indexes in reverse order
    const dropIndexIfExists = async (indexName) => {
      const result = await knex.raw(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'knowledge_base_entries' AND indexname = ?
        ) as exists
      `, [indexName]);
      
      if (result.rows[0].exists) {
        await knex.raw(`DROP INDEX IF EXISTS ${indexName}`);
      }
    };
    
    await dropIndexIfExists('idx_knowledge_base_timestamp');
    await dropIndexIfExists('idx_knowledge_base_category');
    await dropIndexIfExists('idx_knowledge_base_collection_category');
  }
};
