#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script handles the complete database setup process:
 * 1. Connects to the database
 * 2. Runs the schema.sql file
 * 3. Verifies the setup
 * 
 * Usage:
 *   node database/init-db.js
 *   npm run db:setup
 */

// Load environment variables first
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`  ✅ ${message}`, colors.green);
}

function logError(message) {
  log(`  ❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`  ℹ️  ${message}`, colors.cyan);
}

/**
 * Run SQL schema file
 */
async function runSchemaFile() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  try {
    logInfo('Reading schema.sql file...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    logInfo('Executing schema SQL...');
    await pool.query(schemaSql);
    
    logSuccess('Schema executed successfully');
  } catch (error) {
    logError(`Schema execution failed: ${error.message}`);
    throw error;
  }
}

/**
 * Verify database setup
 */
async function verifySetup() {
  try {
    logInfo('Verifying database setup...');

    // Check core tables exist
    const coreTables = [
      'users', 'roles', 'permissions', 'role_permissions', 'user_permissions',
      'sessions', 'otp', 'password_reset_tokens',
      'categories', 'courses', 'tags', 'course_tags',
      'lessons', 'lesson_attachments',
      'quizzes', 'quiz_questions', 'quiz_question_options',
      'assignments', 'enrollments', 'lesson_progress',
      'quiz_attempts', 'assignment_submissions',
      'course_reviews', 'notifications', 'audit_logs'
    ];
    
    for (const table of coreTables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        logSuccess(`Table '${table}' exists (${countResult.rows[0].count} rows)`);
      } else {
        logError(`Table '${table}' does not exist`);
        throw new Error(`Missing table: ${table}`);
      }
    }

    // Check roles were created
    const rolesResult = await pool.query('SELECT name FROM roles ORDER BY name');
    if (rolesResult.rows.length > 0) {
      logSuccess(`Roles created: ${rolesResult.rows.map(r => r.name).join(', ')}`);
    } else {
      logError('No roles found');
      throw new Error('Roles not created');
    }

    // Check permissions were created
    const permissionsResult = await pool.query('SELECT COUNT(*) as count FROM permissions');
    logSuccess(`Permissions created: ${permissionsResult.rows[0].count}`);

    // Check role-permission mappings
    const mappingsResult = await pool.query('SELECT COUNT(*) as count FROM role_permissions');
    logSuccess(`Role-Permission mappings: ${mappingsResult.rows[0].count}`);

    // Check extensions
    const extensionsResult = await pool.query(
      `SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto')`
    );
    if (extensionsResult.rows.length === 2) {
      logSuccess('PostgreSQL extensions enabled: uuid-ossp, pgcrypto');
    } else {
      logWarning('Some PostgreSQL extensions may not be enabled');
    }

  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Display connection information
 */
function displayConnectionInfo() {
  const dbConfig = pool.options;
  
  log('\n' + '='.repeat(60), colors.cyan);
  log('DATABASE CONNECTION INFO', colors.bright);
  log('='.repeat(60), colors.cyan);
  logInfo(`Host: ${dbConfig.host || 'localhost'}`);
  logInfo(`Port: ${dbConfig.port || 5432}`);
  logInfo(`Database: ${dbConfig.database || 'N/A'}`);
  logInfo(`User: ${dbConfig.user || 'N/A'}`);
  log('='.repeat(60) + '\n', colors.cyan);
}

/**
 * Display next steps
 */
function displayNextSteps() {
  log('\n' + '='.repeat(60), colors.yellow);
  log('NEXT STEPS', colors.bright);
  log('='.repeat(60), colors.yellow);
  logInfo('1. Create your first admin user via registration:');
  logInfo('   POST /api/auth/register');
  logInfo('   {');
  logInfo('     "email": "admin@example.com",');
  logInfo('     "username": "admin",');
  logInfo('     "password": "SecurePassword123!",');
  logInfo('     "firstName": "Admin",');
  logInfo('     "lastName": "User"');
  logInfo('   }');
  logInfo('');
  logInfo('2. Assign super_admin role to the user (via database or API)');
  logInfo('');
  logInfo('3. Start the API server:');
  logInfo('   npm start');
  logInfo('');
  logInfo('4. Access API documentation:');
  logInfo('   http://localhost:4000/docs');
  log('='.repeat(60) + '\n', colors.yellow);
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  const startTime = Date.now();

  log('\n' + '='.repeat(60), colors.bright);
  log('TOPUNIVERSE SchoolBox DATABASE INITIALIZATION', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  try {
    // Step 1: Display connection info
    displayConnectionInfo();

    // Step 2: Test database connection
    logStep('1/3', 'Testing database connection...');
    await pool.query('SELECT NOW()');
    logSuccess('Database connection successful');

    // Step 3: Run schema file
    logStep('2/3', 'Running schema.sql...');
    await runSchemaFile();

    // Step 4: Verify setup
    logStep('3/3', 'Verifying setup...');
    await verifySetup();

    // Display next steps
    displayNextSteps();

    // Success message
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('\n' + '='.repeat(60), colors.green);
    log(`✅ DATABASE INITIALIZATION COMPLETE (${duration}s)`, colors.bright + colors.green);
    log('='.repeat(60) + '\n', colors.green);

  } catch (error) {
    log('\n' + '='.repeat(60), colors.red);
    log('❌ DATABASE INITIALIZATION FAILED', colors.bright + colors.red);
    log('='.repeat(60), colors.red);
    logError(error.message);
    
    if (error.stack) {
      log('\nStack trace:', colors.red);
      console.error(error.stack);
    }

    log('\nTroubleshooting:', colors.yellow);
    logInfo('  1. Check PostgreSQL is running');
    logInfo('  2. Verify database credentials in .env file');
    logInfo('  3. Ensure database user has CREATE permission');
    logInfo('  4. Check the error message above for details');
    
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
