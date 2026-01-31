/**
 * Verification Script V2 for Partnership Feature (Refinements)
 * Usage: node verify_partnership_v2.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api/partners';

async function verify() {
    console.log('🚀 Starting verification v2 for Partnership Refinements...');

    try {
        // 1. Test POST /api/partners (Duplicate Check)
        console.log('\nTesting Duplicate Email Check...');
        const payload = {
            inquiry_type: 'general',
            full_name: 'Test Partner 2',
            organization: 'Test Corp 2',
            email_address: 'duplicate@example.com',
            message: 'First submission.'
        };

        // First submission
        try {
            await axios.post(API_URL, payload);
            console.log('✅ First submission successful.');
        } catch (e) {
            console.log('first submission failed (unexpected)', e.message);
        }

        // Duplicate submission
        try {
            await axios.post(API_URL, payload);
            console.error('❌ Duplicate submission should have failed but succeeded.');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Duplicate submission failed as expected (400 Bad Request).');
                console.log('Error message:', error.response.data.message);
            } else {
                console.error('❌ Failed with unexpected status:', error.response ? error.response.status : error.message);
            }
        }

        // 2. Test GET /api/partners (Unauthorized Access)
        console.log('\nTesting Unauthorized Access to GET endpoint...');
        try {
            await axios.get(API_URL);
            console.error('❌ Unauthorized access should have failed but succeeded.');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Unauthorized access blocked (401 Unauthorized).');
                console.log('Error:', error.response.data.error);
            } else {
                console.error('❌ Failed with unexpected status:', error.response ? error.response.status : error.message);
            }
        }

    } catch (error) {
        console.error('❌ Verification failed with error:', error.message);
    }
}

verify();
