// verify_role_fix.js
const Role = require('./models/Role');
const db = require('./config/database');

// Mock db.getClient to return a mock client
const mockClient = {
    query: async (sql, params) => {
        console.log('Mock query executed:', sql.trim().substring(0, 50) + '...');
        return { rows: [], rowCount: 0 };
    },
    release: () => console.log('Mock client released')
};

// Override db.getClient to return our mock
db.getClient = async () => {
    console.log('db.getClient called');
    return mockClient;
};

// Attempt to call syncPermissions
(async () => {
    try {
        console.log('Calling Role.syncPermissions...');
        await Role.syncPermissions('dummy-role-id', ['dummy-perm-id']);
        console.log('SUCCESS: Role.syncPermissions executed without ReferenceError');
    } catch (error) {
        console.error('FAILED: Error occurred:', error);
        if (error.name === 'ReferenceError') {
            console.error('!! Verification Failed: ReferenceError detected !!');
            process.exit(1);
        }
    } finally {
        // We don't need to close the pool because we mocked getClient, 
        // but just in case other things initialized
        if (db.pool) await db.pool.end();
    }
})();
