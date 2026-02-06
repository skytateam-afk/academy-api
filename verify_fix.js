const knex = require('./config/knex');
const jobService = require('./modules/job_management/services/jobService');
const storageService = require('./services/storageService');
const { v4: uuidv4 } = require('uuid');

// Mock storageService.uploadFile
storageService.uploadFile = async (fileBuffer, filename, mimetype, folder = 'uploads') => {
    return {
        success: true,
        fileUrl: `https://mock-storage.com/${folder}/${filename}`,
        fileKey: `${folder}/${filename}`,
        filename,
        size: 100,
        mimetype
    };
};

async function runVerification() {
    console.log('Starting verification...');

    let testJob = null;
    let testUser = null;

    try {
        // 1. Create a test user (needed for "applied" state test)
        // Get role ID for student
        const role = await knex('roles').where('name', 'student').first();
        const roleId = role ? role.id : 1;

        const userEmail = `test.user.${uuidv4()}@example.com`;
        const username = `testuser_${uuidv4().substring(0, 8)}`;

        const [user] = await knex('users').insert({
            email: userEmail,
            username: username,
            password_hash: '$2b$10$hashedpasswordplaceholder',
            first_name: 'Test',
            last_name: 'User',
            role_id: roleId,
            is_active: true
        }).returning('*');
        testUser = user;

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

        // 3. Check is_applied for GUEST (no userId)
        console.log('\n--- Checking is_applied for GUEST ---');
        const guestList = await jobService.listJobs({ limit: 100 });
        const guestJob = guestList.jobs.find(j => j.id === testJob.id);
        console.log(`Guest ListJobs is_applied: ${guestJob ? guestJob.is_applied : 'Job not found'} (Expected: false)`);

        const guestDetail = await jobService.getJobById(testJob.id, true, null);
        console.log(`Guest GetJob is_applied: ${guestDetail.is_applied} (Expected: false)`);

        if (guestJob && guestJob.is_applied !== false) console.error('FAIL: Guest ListJobs should have is_applied = false');
        if (guestDetail.is_applied !== false) console.error('FAIL: Guest GetJob should have is_applied = false');


        // 4. Check is_applied for USER (before application)
        console.log('\n--- Checking is_applied for USER (Pre-App) ---');
        const userList = await jobService.listJobs({ userId: testUser.id, limit: 100 });
        const userJob = userList.jobs.find(j => j.id === testJob.id);
        console.log(`User ListJobs is_applied: ${userJob ? userJob.is_applied : 'Job not found'} (Expected: false)`);

        const userDetail = await jobService.getJobById(testJob.id, true, testUser.id);
        console.log(`User GetJob is_applied: ${userDetail.is_applied} (Expected: false)`);

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        console.log('\n--- Cleaning up ---');
        if (testJob) await knex('jobs').where('id', testJob.id).del();
        if (testUser) await knex('users').where('id', testUser.id).del();
        process.exit();
    }
}

runVerification();
