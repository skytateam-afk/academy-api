const knex = require('./config/knex');
const jobService = require('./modules/job_management/services/jobService');
const { v4: uuidv4 } = require('uuid');

async function runVerification() {
    console.log('Starting Job Status Verification...');
    let testJob = null;
    let testUser = null;
    let testApp = null;

    try {
        // 1. Create Data
        const role = await knex('roles').where('name', 'student').first();
        const [user] = await knex('users').insert({
            email: `status_test_${uuidv4().substring(0, 8)}@example.com`,
            username: `status_test_${uuidv4().substring(0, 8)}`,
            password_hash: 'hashed',
            first_name: 'Status',
            last_name: 'Tester',
            role_id: role ? role.id : null
        }).returning('*');
        testUser = user;

        testJob = await jobService.createJob({
            title: 'Status Test Job',
            description: 'Test',
            company_name: 'Test Corp',
            location: 'Remote',
            is_active: true
        });

        // 2. Create Application
        const [app] = await knex('job_applications').insert({
            job_id: testJob.id,
            user_id: testUser.id,
            first_name: 'Status',
            last_name: 'Tester',
            email: testUser.email,
            resume_url: 'http://example.com/resume.pdf',
            status: 'pending'
        }).returning('*');
        testApp = app;
        console.log('Application created:', testApp.id);

        // 3. Test Valid Status Updates
        const validStatuses = ['reviewed', 'shortlisted', 'interview', 'hired', 'withdrawn', 'rejected'];

        for (const status of validStatuses) {
            try {
                await jobService.updateApplicationStatus(testApp.id, status);
                console.log(`✅ Successfully updated to: ${status}`);
            } catch (error) {
                console.error(`❌ Failed to update to ${status}:`, error.message);
                process.exit(1);
            }
        }

        // 4. Test Invalid Status
        try {
            await jobService.updateApplicationStatus(testApp.id, 'invalid_status');
            console.error('❌ Should have failed for invalid status');
        } catch (error) {
            console.log('✅ Correctly rejected invalid status');
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        if (testApp) await knex('job_applications').where('id', testApp.id).del();
        if (testJob) await knex('jobs').where('id', testJob.id).del();
        if (testUser) await knex('users').where('id', testUser.id).del();
        await knex.destroy();
    }
}

runVerification();
