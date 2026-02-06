const knex = require('../../../config/knex');
const logger = require('../../../config/winston');
const storageService = require('../../../services/storageService');
const { v4: uuidv4 } = require('uuid');

class JobService {
    /**
     * List jobs with filtering and pagination
     */
    async listJobs(options = {}) {
        const {
            page = 1,
            limit = 10,
            status, // 'active' | 'all'
            type,
            query,
            location,
            min_salary,
            max_salary,
            company_name
        } = options;

        const offset = (page - 1) * limit;

        const dbQuery = knex('jobs')
            .select('jobs.*')
            .select(knex.raw('COUNT(job_applications.id)::integer as application_count'))
            .leftJoin('job_applications', 'jobs.id', 'job_applications.job_id')
            .groupBy('jobs.id');

        // Check if user has applied
        // Check if user has applied
        if (options.userId) {
            dbQuery.select(knex.raw(`
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM job_applications ja 
                        WHERE ja.job_id = jobs.id AND ja.user_id = ?
                    ) THEN true 
                    ELSE false 
                END as is_applied
            `, [options.userId]));
        } else {
            dbQuery.select(knex.raw('false as is_applied'));
        }

        // Filter by status (public view sees only active)
        if (status === 'active') {
            dbQuery.where('jobs.is_active', true);
        }

        // Filter by type
        if (type) {
            dbQuery.where('type', type);
        }

        // Filter by location (exact or partial match)
        if (location) {
            dbQuery.where('location', 'ilike', `%${location}%`);
        }

        // Filter by salary range - job's salary range should overlap with filter range
        if (min_salary || max_salary) {
            dbQuery.where((builder) => {
                if (min_salary && max_salary) {
                    const minSalaryNum = parseFloat(min_salary);
                    const maxSalaryNum = parseFloat(max_salary);
                    if (!isNaN(minSalaryNum) && !isNaN(maxSalaryNum)) {
                        // Job's max salary should be >= filter's min AND job's min salary should be <= filter's max
                        builder.where((subBuilder) => {
                            subBuilder.where('salary_max', '>=', minSalaryNum)
                                .orWhereNull('salary_max');
                        }).where((subBuilder) => {
                            subBuilder.where('salary_min', '<=', maxSalaryNum)
                                .orWhereNull('salary_min');
                        });
                    }
                } else if (min_salary) {
                    const minSalaryNum = parseFloat(min_salary);
                    if (!isNaN(minSalaryNum)) {
                        // Job's max salary should be >= filter's min (or null)
                        builder.where('salary_max', '>=', minSalaryNum)
                            .orWhereNull('salary_max');
                    }
                } else if (max_salary) {
                    const maxSalaryNum = parseFloat(max_salary);
                    if (!isNaN(maxSalaryNum)) {
                        // Job's min salary should be <= filter's max (or null)
                        builder.where('salary_min', '<=', maxSalaryNum)
                            .orWhereNull('salary_min');
                    }
                }
            });
        }

        // Filter by company name
        if (company_name) {
            dbQuery.where('company_name', 'ilike', `%${company_name}%`);
        }

        // General search query (searches across multiple fields)
        if (query) {
            dbQuery.where((builder) => {
                builder.where('title', 'ilike', `%${query}%`)
                    .orWhere('description', 'ilike', `%${query}%`)
                    .orWhere('location', 'ilike', `%${query}%`)
                    .orWhere('company_name', 'ilike', `%${query}%`);
            });
        }

        // Count total - need to use a subquery approach since we have GROUP BY
        const countSubquery = dbQuery.clone()
            .clearSelect()
            .select('jobs.id')
            .as('count_subquery');

        const totalResult = await knex.count('* as total')
            .from(countSubquery)
            .first();

        const total = parseInt(totalResult.total);

        // Fetch data
        const jobs = await dbQuery
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);

        return {
            jobs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get single job by ID
     */
    async getJobById(id, publicView = true, userId = null) {
        const query = knex('jobs').where({ id }).first();

        // If public view, ensure it's active
        if (publicView) {
            query.where('is_active', true);
        }

        // Add is_applied check if userId provided
        // Add is_applied check if userId provided
        if (userId) {
            query.select('jobs.*', knex.raw(`
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM job_applications ja 
                        WHERE ja.job_id = jobs.id AND ja.user_id = ?
                    ) THEN true 
                    ELSE false 
                END as is_applied
            `, [userId]));
        } else {
            query.select('jobs.*', knex.raw('false as is_applied'));
        }

        const job = await query;
        if (!job) {
            throw { status: 404, message: 'Job not found' };
        }

        // Ensure is_applied is boolean (postgres might return it as check)
        if (job.is_applied !== undefined) {
            job.is_applied = !!job.is_applied;
        }

        return job;
    }

    /**
     * Create a new job
     */
    async createJob(data, logoFile) {
        // Parse JSON fields if they're strings
        const jobData = { ...data };

        // Log incoming data for debugging
        logger.info('Incoming job data:', {
            requirementsType: typeof jobData.requirements,
            requirementsValue: jobData.requirements,
            responsibilitiesType: typeof jobData.responsibilities,
            responsibilitiesValue: jobData.responsibilities
        });

        // Handle requirements
        if (typeof jobData.requirements === 'string') {
            try {
                const parsed = JSON.parse(jobData.requirements);
                // Ensure it's an array and filter out empty strings
                jobData.requirements = Array.isArray(parsed) ? parsed.filter(r => r && r.trim()) : [];
            } catch (e) {
                logger.error('Failed to parse requirements:', e);
                jobData.requirements = [];
            }
        } else if (!Array.isArray(jobData.requirements)) {
            jobData.requirements = [];
        } else {
            // Filter out empty strings if already an array
            jobData.requirements = jobData.requirements.filter(r => r && r.trim());
        }

        // Handle responsibilities
        if (typeof jobData.responsibilities === 'string') {
            try {
                const parsed = JSON.parse(jobData.responsibilities);
                // Ensure it's an array and filter out empty strings
                jobData.responsibilities = Array.isArray(parsed) ? parsed.filter(r => r && r.trim()) : [];
            } catch (e) {
                logger.error('Failed to parse responsibilities:', e);
                jobData.responsibilities = [];
            }
        } else if (!Array.isArray(jobData.responsibilities)) {
            jobData.responsibilities = [];
        } else {
            // Filter out empty strings if already an array
            jobData.responsibilities = jobData.responsibilities.filter(r => r && r.trim());
        }

        // Convert string booleans to actual booleans
        if (typeof jobData.is_external === 'string') {
            jobData.is_external = jobData.is_external === 'true';
        }
        if (typeof jobData.is_active === 'string') {
            jobData.is_active = jobData.is_active === 'true';
        }

        // Upload company logo if provided
        if (logoFile) {
            const result = await storageService.uploadFile(
                logoFile.buffer,
                `company-logo-${uuidv4()}-${logoFile.originalname}`,
                logoFile.mimetype,
                'job-logos'
            );
            jobData.company_logo_url = result.fileUrl;
        }

        // Knex with PostgreSQL JSONB sometimes needs explicit JSON strings
        // Convert arrays to JSON strings for JSONB columns
        const insertData = {
            ...jobData,
            requirements: JSON.stringify(jobData.requirements),
            responsibilities: JSON.stringify(jobData.responsibilities)
        };

        const [job] = await knex('jobs').insert(insertData).returning('*');
        return job;
    }

    /**
     * Update a job
     */
    async updateJob(id, data, logoFile) {
        // Parse JSON fields if they're strings
        const jobData = { ...data };

        // Handle requirements
        if (typeof jobData.requirements === 'string') {
            try {
                jobData.requirements = JSON.parse(jobData.requirements);
            } catch (e) {
                jobData.requirements = [];
            }
        }
        if (!jobData.requirements || jobData.requirements.length === 0) {
            jobData.requirements = [];
        }

        // Handle responsibilities
        if (typeof jobData.responsibilities === 'string') {
            try {
                jobData.responsibilities = JSON.parse(jobData.responsibilities);
            } catch (e) {
                jobData.responsibilities = [];
            }
        }
        if (!jobData.responsibilities || jobData.responsibilities.length === 0) {
            jobData.responsibilities = [];
        }

        // Convert string booleans to actual booleans
        if (typeof jobData.is_external === 'string') {
            jobData.is_external = jobData.is_external === 'true';
        }
        if (typeof jobData.is_active === 'string') {
            jobData.is_active = jobData.is_active === 'true';
        }

        // Upload new company logo if provided
        if (logoFile) {
            const result = await storageService.uploadFile(
                logoFile.buffer,
                `company-logo-${uuidv4()}-${logoFile.originalname}`,
                logoFile.mimetype,
                'job-logos'
            );
            jobData.company_logo_url = result.fileUrl;
        }

        // For JSONB columns, Knex expects plain JS objects/arrays
        // Make sure arrays are proper arrays (not objects with numeric keys)
        if (Array.isArray(jobData.requirements)) {
            jobData.requirements = JSON.parse(JSON.stringify(jobData.requirements));
        }
        if (Array.isArray(jobData.responsibilities)) {
            jobData.responsibilities = JSON.parse(JSON.stringify(jobData.responsibilities));
        }

        const [job] = await knex('jobs')
            .where({ id })
            .update({
                ...jobData,
                updated_at: new Date()
            })
            .returning('*');

        if (!job) {
            throw { status: 404, message: 'Job not found' };
        }
        return job;
    }

    /**
     * Delete a job
     */
    async deleteJob(id) {
        const deleted = await knex('jobs').where({ id }).del();
        if (!deleted) {
            throw { status: 404, message: 'Job not found' };
        }
        return { message: 'Job deleted successfully' };
    }

    /**
     * Toggle job activation status
     */
    async toggleJobStatus(id) {
        // Fetch current status
        const job = await knex('jobs').select('is_active').where({ id }).first();
        if (!job) {
            throw { status: 404, message: 'Job not found' };
        }

        const [updatedJob] = await knex('jobs')
            .where({ id })
            .update({
                is_active: !job.is_active,
                updated_at: new Date()
            })
            .returning('*');

        return updatedJob;
    }

    /**
     * Submit a job application
     */
    async submitApplication(jobId, applicantData, files) {
        // Verify job exists and is active
        const job = await this.getJobById(jobId, true);

        const {
            user_id,
            first_name,
            last_name,
            email,
            phone
        } = applicantData;
        // Check for existing application if user_id is provided
        if (user_id) {
            const existingApplication = await knex('job_applications')
                .where({ job_id: jobId, user_id: user_id })
                .whereIn('status', ['pending', 'reviewed', 'shortlisted', 'interview'])
                .first();

            if (existingApplication) {
                throw { status: 400, message: 'You have already applied for this job and your application is active.' };
            }
        }

        // Upload files to R2
        let resumeUrl = null;
        let coverLetterUrl = null;

        if (files.resume) {
            const result = await storageService.uploadFile(
                files.resume.buffer,
                `resume-${uuidv4()}-${files.resume.originalname}`,
                files.resume.mimetype,
                'job-applications/resumes'
            );
            resumeUrl = result.fileUrl;
        }

        if (files.cover_letter) {
            const result = await storageService.uploadFile(
                files.cover_letter.buffer,
                `cover-${uuidv4()}-${files.cover_letter.originalname}`,
                files.cover_letter.mimetype,
                'job-applications/cover-letters'
            );
            coverLetterUrl = result.fileUrl;
        }

        if (!resumeUrl) {
            throw { status: 400, message: 'Resume is required' };
        }

        const [application] = await knex('job_applications').insert({
            job_id: jobId,
            user_id: user_id || null,
            first_name,
            last_name,
            email,
            phone,
            resume_url: resumeUrl,
            cover_letter_url: coverLetterUrl,
            status: 'pending'
        }).returning('*');

        return application;
    }

    /**
     * List applications for a job (Admin)
     */
    async listApplications(jobId, options = {}) {
        const { page = 1, limit = 20, status, query, dateFrom, dateTo } = options;
        const offset = (page - 1) * limit;

        const dbQuery = knex('job_applications')
            .where({ job_id: jobId });

        // Filter by status if provided
        if (status && status !== 'all') {
            dbQuery.where('status', status);
        }

        // Search by name, email, or phone
        if (query) {
            dbQuery.where((builder) => {
                builder.where('first_name', 'ilike', `%${query}%`)
                    .orWhere('last_name', 'ilike', `%${query}%`)
                    .orWhere('email', 'ilike', `%${query}%`)
                    .orWhere('phone', 'ilike', `%${query}%`);
            });
        }

        // Filter by date range
        if (dateFrom) {
            dbQuery.where('created_at', '>=', new Date(dateFrom));
        }
        if (dateTo) {
            // Add one day to include the entire end date
            const endDate = new Date(dateTo);
            endDate.setDate(endDate.getDate() + 1);
            dbQuery.where('created_at', '<', endDate);
        }

        const countQuery = dbQuery.clone().clearSelect().count('id as total').first();
        const totalResult = await countQuery;
        const total = parseInt(totalResult.total);

        const applications = await dbQuery
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);

        return {
            applications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get user's job profile
     */
    async getJobProfile(userId) {
        const result = await knex.raw(
            'SELECT * FROM job_profiles WHERE user_id = ? LIMIT 1',
            [userId]
        );

        return result.rows[0] || null;
    }

    /**
     * Create or update user's job profile
     */
    async saveJobProfile(userId, data, resumeFile) {
        logger.info('saveJobProfile called with:', { userId, hasResumeFile: !!resumeFile });

        const profileData = { ...data };

        // Parse preferred_types if it's a string
        if (typeof profileData.preferred_types === 'string') {
            try {
                profileData.preferred_types = JSON.parse(profileData.preferred_types);
            } catch (e) {
                profileData.preferred_types = [];
            }
        }

        // Ensure preferred_types is an array
        if (!Array.isArray(profileData.preferred_types)) {
            profileData.preferred_types = [];
        }

        // Upload resume if provided
        if (resumeFile) {
            const result = await storageService.uploadFile(
                resumeFile.buffer,
                `resume-${uuidv4()}-${resumeFile.originalname}`,
                resumeFile.mimetype,
                'job-profiles/resumes'
            );
            profileData.resume_url = result.fileUrl;
        }

        // Check if profile exists using raw SQL to bypass schema cache
        const existingResult = await knex.raw(
            'SELECT * FROM job_profiles WHERE user_id = ? LIMIT 1',
            [userId]
        );
        const existingProfile = existingResult.rows[0];

        let profile;
        if (existingProfile) {
            // Update existing profile
            [profile] = await knex('job_profiles')
                .where({ user_id: userId })
                .update({
                    title: profileData.title,
                    skills: profileData.skills,
                    years_of_experience: profileData.years_of_experience || 0,
                    preferred_types: JSON.stringify(profileData.preferred_types),
                    preferred_locations: profileData.preferred_locations,
                    bio: profileData.bio,
                    ...(profileData.resume_url && { resume_url: profileData.resume_url }),
                    updated_at: new Date()
                })
                .returning('*');
        } else {
            // Create new profile
            [profile] = await knex('job_profiles')
                .insert({
                    user_id: userId,
                    title: profileData.title,
                    skills: profileData.skills,
                    years_of_experience: profileData.years_of_experience || 0,
                    preferred_types: JSON.stringify(profileData.preferred_types),
                    preferred_locations: profileData.preferred_locations,
                    resume_url: profileData.resume_url || null,
                    bio: profileData.bio,
                    is_active: true
                })
                .returning('*');
        }

        return profile;
    }

    /**
     * List all job profiles (Admin)
     */
    async listAllJobProfiles(options = {}) {
        const { page = 1, limit = 20, query } = options;
        const offset = (page - 1) * limit;

        const dbQuery = knex('job_profiles')
            .select('job_profiles.*', 'users.email', 'users.first_name', 'users.last_name')
            .leftJoin('users', 'job_profiles.user_id', 'users.id');

        // Search query
        if (query) {
            dbQuery.where((builder) => {
                builder.where('job_profiles.title', 'ilike', `%${query}%`)
                    .orWhere('job_profiles.skills', 'ilike', `%${query}%`)
                    .orWhere('users.email', 'ilike', `%${query}%`)
                    .orWhere('users.first_name', 'ilike', `%${query}%`)
                    .orWhere('users.last_name', 'ilike', `%${query}%`);
            });
        }

        // Count total
        const countQuery = dbQuery.clone().clearSelect().count('job_profiles.id as total').first();
        const totalResult = await countQuery;
        const total = parseInt(totalResult.total);

        // Fetch data
        const profiles = await dbQuery
            .orderBy('job_profiles.created_at', 'desc')
            .limit(limit)
            .offset(offset);

        return {
            profiles,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Delete a job profile (Admin)
     */
    async deleteJobProfile(id) {
        const deleted = await knex('job_profiles').where({ id }).del();
        if (!deleted) {
            throw { status: 404, message: 'Job profile not found' };
        }
        return { message: 'Job profile deleted successfully' };
    }

    /**
     * Update application status (Admin)
     */
    async updateApplicationStatus(applicationId, status) {
        // Validate status
        const validStatuses = ['pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired', 'withdrawn'];
        if (!validStatuses.includes(status)) {
            throw { status: 400, message: 'Invalid status. Must be one of: pending, reviewed, shortlisted, interview, rejected, hired, withdrawn' };
        }

        const [application] = await knex('job_applications')
            .where({ id: applicationId })
            .update({
                status,
                updated_at: new Date()
            })
            .returning('*');

        if (!application) {
            throw { status: 404, message: 'Application not found' };
        }

        return application;
    }

    /**
     * Delete an application (Admin)
     */
    async deleteApplication(applicationId) {
        const deleted = await knex('job_applications').where({ id: applicationId }).del();
        if (!deleted) {
            throw { status: 404, message: 'Application not found' };
        }
        return { message: 'Application deleted successfully' };
    }
}

module.exports = new JobService();
