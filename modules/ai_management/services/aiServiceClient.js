/**
 * AI Service Client
 * HTTP client for communicating with the AI service
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class AIServiceClient {
  constructor() {
    if (!process.env.AI_SERVICE_URL) {
      throw new Error('AI_SERVICE_URL environment variable is required. Please set it in your .env file.');
    }
    this.baseURL = process.env.AI_SERVICE_URL;
  }

  /**
   * Ingest CSV file into knowledge base
   */
  async ingestCsv(filePath, collectionName, fresh = false) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('collection_name', collectionName);
      // AI service expects 'mode' parameter: 'append' or 'fresh'
      formData.append('mode', fresh ? 'fresh' : 'append');

      const response = await axios.post(
        `${this.baseURL}/api/ingest/csv`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000 // 5 minutes timeout for large files
        }
      );

      // Clean up temp file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }

      return {
        success: true,
        message: response.data.message,
        records_processed: response.data.records_processed,
        errors: response.data.errors || []
      };
    } catch (error) {
      // Clean up temp file on error
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }

      console.error('Error calling AI service ingestion:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to ingest CSV',
        errors: error.response?.data?.errors || [error.message]
      };
    }
  }

  /**
   * Get collection status from AI service
   */
  async getCollectionStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/api/ingest/status`, {
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching collection status:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new AIServiceClient();
