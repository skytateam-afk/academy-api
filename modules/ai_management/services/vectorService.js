/**
 * Vector Service
 * Service for generating embeddings and managing vector operations
 */

const { pipeline } = require('@xenova/transformers');

class VectorService {
  constructor() {
    // Model name matching Python service (all-MiniLM-L6-v2)
    this.modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
    this.embedder = null;
    this.modelLoaded = false;
  }

  /**
   * Initialize the embedding model
   */
  async initialize() {
    if (this.modelLoaded && this.embedder) {
      return;
    }

    try {
      console.log(`🤖 Loading embedding model: ${this.modelName}...`);
      this.embedder = await pipeline('feature-extraction', this.modelName);
      this.modelLoaded = true;
      console.log('✅ Embedding model loaded');
    } catch (error) {
      console.error('❌ Error loading embedding model:', error);
      throw new Error(`Failed to load embedding model: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for text
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<number[]>} - Array of 384 floating point numbers
   */
  async getEmbeddings(text) {
    if (!this.modelLoaded || !this.embedder) {
      await this.initialize();
    }

    try {
      // Generate embeddings - returns a tensor object
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Extract data from tensor - output.data might be a TypedArray or regular array
      let embedding;
      if (output.data && typeof output.data[Symbol.iterator] === 'function') {
        // If it's iterable (TypedArray or Array)
        embedding = Array.from(output.data);
      } else if (Array.isArray(output)) {
        // If output is already an array
        embedding = output;
      } else if (output && typeof output.toArray === 'function') {
        // If it has a toArray method
        embedding = output.toArray();
      } else {
        // Fallback: try to extract as object values
        embedding = Object.values(output);
      }

      // Ensure we have a flat array
      embedding = embedding.flat();

      // Verify we have 384 dimensions (all-MiniLM-L6-v2)
      if (embedding.length !== 384) {
        console.warn(`Warning: Expected 384 dimensions, got ${embedding.length}`);
      }

      return embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch (much faster)
   * Processes in chunks of 100 to avoid memory issues with large batches
   * @param {string[]} texts - Array of texts to generate embeddings for
   * @returns {Promise<number[][]>} - Array of embedding arrays
   */
  async getEmbeddingsBatch(texts) {
    if (!this.modelLoaded || !this.embedder) {
      await this.initialize();
    }

    // Chunk texts into groups of 100 for embedding generation
    const chunkSize = 100;
    const allEmbeddings = [];

    try {
      // Process texts in chunks of 100
      for (let i = 0; i < texts.length; i += chunkSize) {
        const chunk = texts.slice(i, i + chunkSize);
        
        // Generate embeddings for this chunk
        const outputs = await this.embedder(chunk, {
          pooling: 'mean',
          normalize: true,
        });

        // Process outputs - batch mode typically returns a tensor with shape [batch_size, dim]
        const chunkEmbeddings = [];
        
        // Check if output has shape property (tensor)
        if (outputs && outputs.data && Array.isArray(outputs.shape) && outputs.shape.length === 2) {
          // Tensor output: shape is [batch_size, 384]
          const [batchSize, dimSize] = outputs.shape;
          const data = outputs.data;
          
          for (let j = 0; j < batchSize; j++) {
            const start = j * dimSize;
            const end = start + dimSize;
            const embedding = Array.from(data.slice(start, end));
            chunkEmbeddings.push(embedding);
          }
        } else if (Array.isArray(outputs)) {
          // Array of outputs (one per text)
          for (const output of outputs) {
            chunkEmbeddings.push(this._extractEmbedding(output));
          }
        } else {
          // Try to extract as single tensor
          const embedding = this._extractEmbedding(outputs);
          // If we got a single embedding but expected multiple, something went wrong
          if (chunk.length === 1) {
            chunkEmbeddings.push(embedding);
          } else {
            // Fallback: process individually if batch failed
            console.warn(`Chunk ${Math.floor(i / chunkSize) + 1} returned unexpected format, falling back to individual processing`);
            const individualEmbeddings = await Promise.all(chunk.map(text => this.getEmbeddings(text)));
            chunkEmbeddings.push(...individualEmbeddings);
          }
        }

        // Verify we have the right number of embeddings for this chunk
        if (chunkEmbeddings.length !== chunk.length) {
          console.warn(`Chunk ${Math.floor(i / chunkSize) + 1}: Expected ${chunk.length} embeddings, got ${chunkEmbeddings.length}, falling back to individual processing`);
          const individualEmbeddings = await Promise.all(chunk.map(text => this.getEmbeddings(text)));
          chunkEmbeddings.length = 0;
          chunkEmbeddings.push(...individualEmbeddings);
        }

        // Add chunk embeddings to the result
        allEmbeddings.push(...chunkEmbeddings);
      }

      // Verify we have the right number of embeddings total
      if (allEmbeddings.length !== texts.length) {
        console.warn(`Expected ${texts.length} embeddings total, got ${allEmbeddings.length}`);
      }

      return allEmbeddings;
    } catch (error) {
      console.error('Error generating batch embeddings, falling back to individual:', error);
      // Fallback to individual processing if batch fails
      return await Promise.all(texts.map(text => this.getEmbeddings(text)));
    }
  }

  /**
   * Extract embedding from tensor output (helper method)
   * @param {*} output - Tensor output
   * @returns {number[]} - Embedding array
   */
  _extractEmbedding(output) {
    let embedding;
    if (output.data && typeof output.data[Symbol.iterator] === 'function') {
      embedding = Array.from(output.data);
    } else if (Array.isArray(output)) {
      embedding = output;
    } else if (output && typeof output.toArray === 'function') {
      embedding = output.toArray();
    } else {
      embedding = Object.values(output);
    }

    embedding = embedding.flat();

    if (embedding.length !== 384) {
      console.warn(`Warning: Expected 384 dimensions, got ${embedding.length}`);
    }

    return embedding;
  }

  /**
   * Format embedding array for pgvector
   * @param {number[]} embedding - Embedding array
   * @returns {string} - Formatted string for pgvector
   */
  formatEmbeddingForPgVector(embedding) {
    // pgvector expects format: '[0.1,0.2,0.3,...]'
    return `[${embedding.join(',')}]`;
  }
}

// Singleton instance
let vectorServiceInstance = null;

function getVectorService() {
  if (!vectorServiceInstance) {
    vectorServiceInstance = new VectorService();
  }
  return vectorServiceInstance;
}

module.exports = getVectorService();
