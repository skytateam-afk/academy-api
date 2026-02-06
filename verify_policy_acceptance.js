require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const knex = require('./config/knex');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:4001';
const JWT_SECRET = process.env.JWT_SECRET || 'fabric-explorer-secret-key';

async function runVerification() {
    console.log('Starting Policy Acceptance Verification...');
    let testUser = null;

    try {
        // 1. Create a test user
        const role = await knex('roles').where('name', 'student').first();
        const roleId = role ? role.id : 1;

        const username = `policy_test_${uuidv4().substring(0, 8)}`;
        const email = `${username}@example.com`;

        const [user] = await knex('users').insert({
            email,
            username,
            password_hash: '$2b$10$hashedpasswordplaceholder',
            first_name: 'Policy',
            last_name: 'Tester',
            role_id: roleId,
            is_active: true
        }).returning('*');
        testUser = user;
        console.log(`Test user created: ${user.id} (${username})`);

        // 2. Generate JWT Token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: 'student'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('JWT Token generated');

        // 3. Send POST request
        const policyVersion = 'v2.5-test';
        console.log(`Sending POST request to ${API_URL}/api/legal/accept-policy...`);

        try {
            const response = await axios.post(
                `${API_URL}/api/legal/accept-policy`,
                { policy_version: policyVersion },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': 'VerificationScript/1.0'
                    }
                }
            );

            console.log(`Response Status: ${response.status}`);
            console.log('Response Data:', response.data);

            if (response.status === 201 && response.data.success) {
                console.log('✅ API endpoint returned success');
            } else {
                console.error('❌ API endpoint failed');
                process.exit(1);
            }

        } catch (apiError) {
            console.error('API Request failed:', apiError.message);
            if (apiError.response) {
                console.error('Status:', apiError.response.status);
                console.error('Data:', apiError.response.data);
            }
            throw apiError;
        }

        // 4. Verify Database Record
        const record = await knex('policy_acceptances')
            .where({ user_id: user.id, policy_version: policyVersion })
            .first();

        if (record) {
            console.log('✅ Database record found:', record);
            console.log(`   IP Address: ${record.ip_address}`);
            console.log(`   User Agent: ${record.user_agent}`);

            if (record.user_agent !== 'VerificationScript/1.0') {
                console.warn('⚠️ User Agent mismatch (might be modified by proxy/framework)');
            }
        } else {
            console.error('❌ Database record not found!');
            process.exit(1);
        }

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        // 5. Cleanup
        if (testUser) {
            console.log('Cleaning up user...');
            // Check if foreign key constraint issues might happen (policy_acceptances has ON DELETE CASCADE in migration, usually)
            // If not, we should delete acceptances first.
            // Our migration said: .onDelete('CASCADE'), so deleting user should suffice.
            await knex('users').where('id', testUser.id).del();
            console.log('User deleted.');
        }
        await knex.destroy();
    }
}

runVerification();
