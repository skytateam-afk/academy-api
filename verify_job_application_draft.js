const knex = require('./config/knex');
const jobService = require('./modules/job_management/services/jobService');
const { v4: uuidv4 } = require('uuid');

async function runVerification() {
    console.log('Starting verification...');

    let testUser = null;
    let testJob = null;
    let applicationId = null;

    try {
        // 1. Create a test user
        const userEmail = `test.user.${uuidv4()}@example.com`;
        const [user] = await knex('users').insert({
            email: userEmail,
            password: 'hashedpassword',
            first_name: 'Test',
            last_name: 'User',
            role: 'student',
            is_active: true
        }).returning('*');
        testUser = user;
        console.log('Test user created:', testUser.id);

        // 2. Create a test job
        testJob = await jobService.createJob({
            title: 'Test Job ' + uuidv4(),
            description: 'Test Description',
            company_name: 'Test Company',
            location: 'Remote',
            type: 'full-time',
            is_active: true,
            requirements: ['Node.js'],
            responsibilities: ['Coding']
        });
        console.log('Test job created:', testJob.id);

        // 3. Check is_applied before application
        console.log('\n--- Checking is_applied BEFORE application ---');
        const jobsListBefore = await jobService.listJobs({ userId: testUser.id, limit: 100 });
        const myJobBefore = jobsListBefore.jobs.find(j => j.id === testJob.id);
        console.log(`ListJobs is_applied: ${myJobBefore ? myJobBefore.is_applied : 'Job not found in list'}`);

        const jobDetailBefore = await jobService.getJobById(testJob.id, true, testUser.id);
        console.log(`GetJob is_applied: ${jobDetailBefore.is_applied}`);

        if (myJobBefore && myJobBefore.is_applied !== false) console.error('FAIL: is_applied should be false');
        if (jobDetailBefore.is_applied !== false) console.error('FAIL: is_applied should be false');

        // 4. Submit application
        console.log('\n--- Submitting Application ---');
        const application = await jobService.submitApplication(testJob.id, {
            user_id: testUser.id,
            first_name: 'Test',
            last_name: 'User',
            email: userEmail,
            phone: '1234567890'
        }, {}); // No files for this test, might fail if validation is strict, let's see service code
        // Service check: if (!resumeUrl) throw ... 
        // Wait, I strictly implemented "Resume is required" in submitApplication service?
        // Let's verify service code again... yes: `if (!resumeUrl) { throw ... }`
        // I need to mock file upload or bypass it. 
        // The service uses storageService.uploadFile. I might need to mock storageService or providing a dummy file buffer.
        // For integration test on real DB, mocking storageService require rewriting it or using a mock wrapper.
        // EASIER: Just mock the `files` object to return a dummy URL without calling actual upload? 
        // No, `submitApplication` accepts `files` object and CALLS `storageService`.
        // I will monkey-patch `storageService.uploadFile` for this test process.
    } catch (e) {
        if (e.message === 'Resume is required') {
            console.log('Caught expected validation error: Resume is required. Monkey patching storageService to proceed...');
        } else {
            throw e;
        }
    }
}

// Separate file to run with monkey patching
runVerification().catch(console.error).finally(() => process.exit());
