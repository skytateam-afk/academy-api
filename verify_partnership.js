/**
 * Verification Script for Partnership Feature
 * Usage: node verify_partnership.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api/partners';

async function verify() {
    console.log('🚀 Starting verification for Partnership Feature...');

    try {
        // 1. Test POST /api/partners
        console.log('\nTesting POST /api/partners...');
        const payload = {
            inquiry_type: 'general',
            full_name: 'Test Partner',
            organization: 'Test Corp',
            email_address: 'test@example.com',
            message: 'This is a test inquiry from verification script.'
        };

        const postResponse = await axios.post(API_URL, payload);

        if (postResponse.status === 201 && postResponse.data.success) {
            console.log('✅ POST request successful!');
            console.log('Created ID:', postResponse.data.data.id);
        } else {
            console.error('❌ POST request failed:', postResponse.status, postResponse.data);
        }

        // 2. Test GET /api/partners
        console.log('\nTesting GET /api/partners...');
        const getResponse = await axios.get(API_URL);

        if (getResponse.status === 200 && getResponse.data.success) {
            console.log('✅ GET request successful!');
            const partners = getResponse.data.data.partners;
            console.log(`Found ${partners.length} partners.`);

            const found = partners.find(p => p.email_address === payload.email_address);
            if (found) {
                console.log('✅ Created partner found in list!');
            } else {
                console.error('❌ Created partner NOT found in list.');
            }
        } else {
            console.error('❌ GET request failed:', getResponse.status, getResponse.data);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Could not connect to server. Is it running?');
        } else {
            console.error('❌ Verification failed with error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }
    }
}

verify();
