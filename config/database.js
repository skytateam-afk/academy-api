/**
 * Database Configuration Module
 * Handles PostgreSQL connection using NeonDB
 */

const { Pool } = require('pg');
const logger = require('./winston');

// Create connection pool with NeonDB optimizations
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10, // Reduced for NeonDB limits
    idleTimeoutMillis: 20000, // 20 seconds - shorter for serverless
    connectionTimeoutMillis: 10000,
    min: 0, // No minimum connections for serverless
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    allowExitOnIdle: false, // Keep pool alive
    // Add statement timeout to prevent long-running queries
    statement_timeout: 30000, // 30 seconds max per query
});

// Test connection on startup
pool.on('connect', () => {
    logger.info('Database connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected database error', { error: err.message });
});

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (process.env.LOG_SQL_QUERIES === 'true') {
            logger.debug('Executed query', { 
                query: text, 
                duration: `${duration}ms`,
                rows: result.rowCount 
            });
        }
        
        return result;
    } catch (error) {
        logger.error('Database query error', { 
            query: text, 
            error: error.message 
        });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Database client
 */
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);
    
    // Set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
        logger.error('A client has been checked out for more than 5 seconds!');
    }, 5000);
    
    // Monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
        client.lastQuery = args;
        return query(...args);
    };
    
    client.release = () => {
        clearTimeout(timeout);
        // Set the methods back to their old un-monkey-patched version
        client.query = query;
        client.release = release;
        return release();
    };
    
    return client;
};

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
    const client = await getClient();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        logger.success('Database connection test successful', { 
            timestamp: result.rows[0].now 
        });
        return true;
    } catch (error) {
        logger.error('Database connection test failed', { 
            error: error.message 
        });
        return false;
    }
};

/**
 * Close all database connections
 */
const closePool = async () => {
    try {
        await pool.end();
        logger.info('Database pool closed');
    } catch (error) {
        logger.error('Error closing database pool', { error: error.message });
    }
};

module.exports = {
    query,
    getClient,
    transaction,
    testConnection,
    closePool,
    pool
};
