/**
 * Jest Test Setup
 * Configures environment for testing
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Set test database URL (use same as development for now)
// In production, you'd want a separate test database
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_oa9ROr0JBFYg@ep-gentle-resonance-ahwy7rlf-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
}

// Set JWT secret for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '24h';

// Disable logging during tests (optional)
process.env.LOG_LEVEL = 'error';

// Set test port
process.env.PORT = '8080';

// Mock R2 credentials for tests (file uploads will be mocked)
process.env.R2_ACCOUNT_ID = 'test-account-id';
process.env.R2_ACCESS_KEY_ID = 'test-access-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.R2_BUCKET_NAME = 'test-bucket';
process.env.R2_ENDPOINT = 'https://test.r2.cloudflarestorage.com';

// Mock email configuration
process.env.SMTP_HOST = 'test-smtp.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASSWORD = 'test-password';
process.env.SMTP_FROM_EMAIL = 'test@test.com';

// Increase test timeout
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging
    error: console.error,
};
