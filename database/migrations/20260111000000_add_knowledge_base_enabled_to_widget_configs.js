/**
 * Migration: Add knowledgeBase.enabled field to existing widget configs
 * Adds enabled: true to all existing widget configs' knowledgeBase section
 */

exports.up = async function(knex) {
  // Get all widget configs
  const configs = await knex('ai_widget_configs').select('id', 'config');
  
  for (const row of configs) {
    let config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    let updated = false;
    
    // Ensure knowledgeBase exists
    if (!config.knowledgeBase) {
      config.knowledgeBase = {
        enabled: true,
        useAllCollections: true,
        collectionNames: []
      };
      updated = true;
    } else {
      // Add enabled field if it doesn't exist
      if (config.knowledgeBase.enabled === undefined) {
        config.knowledgeBase.enabled = true;
        updated = true;
      }
    }
    
    // Update the record if we made changes
    if (updated) {
      await knex('ai_widget_configs')
        .where('id', row.id)
        .update({
          config: JSON.stringify(config),
          updated_at: knex.fn.now()
        });
    }
  }
};

exports.down = async function(knex) {
  // Remove enabled field from knowledgeBase (optional rollback)
  const configs = await knex('ai_widget_configs').select('id', 'config');
  
  for (const row of configs) {
    const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    
    if (config.knowledgeBase && config.knowledgeBase.enabled !== undefined) {
      delete config.knowledgeBase.enabled;
      
      await knex('ai_widget_configs')
        .where('id', row.id)
        .update({
          config: JSON.stringify(config),
          updated_at: knex.fn.now()
        });
    }
  }
};
