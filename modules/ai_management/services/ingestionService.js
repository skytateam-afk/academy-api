/**
 * Ingestion Service
 * Service for ingesting CSV files into knowledge base with vector embeddings
 */

const { parse } = require('csv-parse/sync');
const fs = require('fs');
const knex = require('../../../config/knex');
const vectorService = require('./vectorService');
const progressTracker = require('./progressTracker');

class IngestionService {
  constructor() {
    this.vectorService = vectorService;
  }

  /**
   * Ingest CSV file into knowledge base
   * @param {string} filePath - Path to CSV file
   * @param {string} collectionName - Target collection name
   * @param {boolean} fresh - If true, clear existing data before ingesting
   * @param {string} jobId - Optional job ID for progress tracking
   * @returns {Promise<Object>} - Ingestion results
   */
  async ingestCsvFile(filePath, collectionName, fresh = false, jobId = null) {
    try {
      // Read and parse CSV file
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        return {
          success: false,
          message: 'CSV file is empty',
          records_processed: 0,
          errors: ['No data found in CSV file'],
        };
      }

      // Initialize progress tracking
      if (jobId) {
        progressTracker.initProgress(jobId, records.length);
        progressTracker.updateProgress(jobId, 0, 'Initializing vector service...');
      }

      // Initialize vector service
      await this.vectorService.initialize();

      // Clear collection if requested
      if (fresh) {
        if (jobId) {
          progressTracker.updateProgress(jobId, 0, 'Clearing existing collection...');
        }
        await this.clearCollection(collectionName);
      }

      // Process in batches with optimized parallel processing
      const batchSize = 200; // Larger batches for better throughput
      let recordsProcessed = 0;
      const errors = [];

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        try {
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(records.length / batchSize);
          
          if (jobId) {
            progressTracker.updateProgress(
              jobId, 
              recordsProcessed, 
              `Processing batch ${batchNum}/${totalBatches}...`
            );
          }

          await this.processBatch(batch, collectionName);
          recordsProcessed += batch.length;
          
          if (jobId) {
            progressTracker.updateProgress(
              jobId, 
              recordsProcessed, 
              `Processed ${recordsProcessed}/${records.length} records`
            );
          }
          
          console.log(`✅ Processed batch ${batchNum}/${totalBatches} (${recordsProcessed}/${records.length} records)`);
        } catch (error) {
          const batchNum = Math.floor(i / batchSize) + 1;
          errors.push(`Batch ${batchNum} error: ${error.message}`);
          console.error(`❌ Error processing batch ${batchNum}:`, error);
          
          if (jobId) {
            progressTracker.updateProgress(
              jobId, 
              recordsProcessed, 
              `Error in batch ${batchNum}, continuing...`
            );
          }
        }
      }

      // Complete progress tracking
      if (jobId) {
        if (errors.length === 0) {
          progressTracker.completeProgress(jobId, `Successfully ingested ${recordsProcessed} records`);
        } else {
          progressTracker.completeProgress(jobId, `Ingested ${recordsProcessed} records with ${errors.length} errors`);
        }
      }

      // Clean up file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0
          ? `Successfully ingested ${recordsProcessed} records into ${collectionName}`
          : `Ingested ${recordsProcessed} records with ${errors.length} batch errors`,
        records_processed: recordsProcessed,
        errors: errors.length > 0 ? errors : [],
      };
    } catch (error) {
      console.error('Ingestion error:', error);
      return {
        success: false,
        message: `Ingestion failed: ${error.message}`,
        records_processed: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Process a batch of records (optimized with batch embedding generation and bulk insert)
   * @param {Array} batch - Array of CSV records
   * @param {string} collectionName - Collection name
   */
  async processBatch(batch, collectionName) {
    // Step 1: Prepare text content for all records
    const textData = batch.map((record) => {
      const title = record.title || record.Title || '';
      const text = record.text || record.Text || record.text_content || '';
      const textContent = `${title} ${text}`.trim();

      return {
        record,
        title,
        text,
        textContent,
        isValid: !!textContent,
      };
    });

    // Step 2: Filter valid records and prepare texts for batch embedding
    const validData = textData.filter(item => item.isValid);
    if (validData.length === 0) {
      return;
    }

    const texts = validData.map(item => item.textContent);

    // Step 3: Generate embeddings in batch (much faster than individual)
    const embeddings = await this.vectorService.getEmbeddingsBatch(texts);

    // Step 4: Combine results
    const results = validData.map((item, index) => ({
      record: item.record,
      title: item.title,
      text: item.text,
      embedding: embeddings[index],
    }));

    // Step 3: Prepare entries for bulk insert
    const entries = results
      .filter(result => result !== null)
      .map(({ record, title, text, embedding }) => ({
        source_id: record.id || record.ID || record.source_id || null,
        collection_name: collectionName,
        title: title || null,
        text: text || null,
        category: record.category || record.Category || null,
        status: record.status || record.Status || null,
        comment: record.Comment || record.comment || null,
        tags: record.tags || record.Tags || null,
        source: record.source || record.Source || null,
        last_updated: record.last_updated || record.Last_Updated || null,
        entry_metadata: record.metadata ? (typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata) : {},
        embedding: this.vectorService.formatEmbeddingForPgVector(embedding),
      }));

    // Step 4: Bulk insert using raw SQL for pgvector (fastest method)
    if (entries.length > 0) {
      await knex.transaction(async (trx) => {
        // Build bulk insert query - Knex uses ? for parameter binding
        const placeholders = entries.map(() => 
          '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::vector, NOW())'
        ).join(', ');
        
        const values = entries.flatMap(entry => [
          entry.source_id,
          entry.collection_name,
          entry.title,
          entry.text,
          entry.category,
          entry.status,
          entry.comment,
          entry.tags,
          entry.source,
          entry.last_updated,
          JSON.stringify(entry.entry_metadata),
          entry.embedding,
        ]);

        await trx.raw(
          `INSERT INTO knowledge_base_entries (
            source_id, collection_name, title, text, category, status, 
            comment, tags, source, last_updated, entry_metadata, embedding, timestamp
          ) VALUES ${placeholders}`,
          values
        );
      });
    }
  }

  /**
   * Clear collection
   * @param {string} collectionName - Collection name to clear
   */
  async clearCollection(collectionName) {
    await knex('knowledge_base_entries')
      .where('collection_name', collectionName)
      .del();
  }

  /**
   * Get collection status
   * @returns {Promise<Object>} - Collection status
   */
  async getCollectionStatus() {
    const collections = await knex('knowledge_base_entries')
      .select('collection_name')
      .count('* as count')
      .groupBy('collection_name');

    const status = {};
    collections.forEach((row) => {
      status[row.collection_name] = parseInt(row.count);
    });

    return {
      collections: status,
      total_collections: collections.length,
    };
  }
}

module.exports = new IngestionService();
