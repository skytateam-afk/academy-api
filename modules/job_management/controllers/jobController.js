const jobService = require('../services/jobService');

class JobController {
    // Public: List active jobs
    async listPublicJobs(req, res, next) {
        try {
            const result = await jobService.listJobs({
                ...req.query,
                status: 'active',
                userId: req.user ? req.user.userId : null
            });
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // Public: Get job detail
    async getJobDetail(req, res, next) {
        try {
            const job = await jobService.getJobById(
                req.params.id,
                true,
                req.user ? req.user.userId : null
            );
            res.json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    // Public: Apply for job
    async applyForJob(req, res, next) {
        try {
            const jobId = req.params.id;
            const applicantData = req.body;

            // Files are attached to req.files if using multer fields, or req.file if single
            // Expecting fields: resume, cover_letter
            const files = {};
            if (req.files) {
                if (req.files.resume) files.resume = req.files.resume[0];
                if (req.files.cover_letter) files.cover_letter = req.files.cover_letter[0];
            }

            const application = await jobService.submitApplication(jobId, applicantData, files);
            res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Admin: List all jobs
    async listAdminJobs(req, res, next) {
        try {
            const result = await jobService.listJobs({
                ...req.query,
                status: 'all' // Show all
            });
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Create job
    async createJob(req, res, next) {
        try {
            const jobData = req.body;
            const logoFile = req.file; // company_logo uploaded via multer
            const job = await jobService.createJob(jobData, logoFile);
            res.status(201).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Update job
    async updateJob(req, res, next) {
        try {
            const jobData = req.body;
            const logoFile = req.file; // company_logo uploaded via multer
            const job = await jobService.updateJob(req.params.id, jobData, logoFile);
            res.json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Delete job
    async deleteJob(req, res, next) {
        try {
            await jobService.deleteJob(req.params.id);
            res.json({ success: true, message: 'Job deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Toggle status
    async toggleStatus(req, res, next) {
        try {
            const job = await jobService.toggleJobStatus(req.params.id);
            res.json({ success: true, data: job, message: `Job ${job.is_active ? 'activated' : 'deactivated'}` });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Get Job (edit view)
    async getAdminJob(req, res, next) {
        try {
            const job = await jobService.getJobById(req.params.id, false); // false = ignore active check
            res.json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    // Admin: List Applications for a job
    async listJobApplications(req, res, next) {
        try {
            const result = await jobService.listApplications(req.params.id, req.query);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // User: Get own job profile
    async getMyJobProfile(req, res, next) {
        try {
            const profile = await jobService.getJobProfile(req.user.userId);
            res.json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    // User: Create/Update own job profile
    async saveMyJobProfile(req, res, next) {
        try {
            const profileData = req.body;
            const resumeFile = req.file; // resume file uploaded via multer
            const profile = await jobService.saveJobProfile(req.user.userId, profileData, resumeFile);
            res.json({ success: true, data: profile, message: 'Job profile saved successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Admin: List all job profiles
    async listAllJobProfiles(req, res, next) {
        try {
            const result = await jobService.listAllJobProfiles(req.query);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Delete job profile
    async deleteJobProfile(req, res, next) {
        try {
            await jobService.deleteJobProfile(req.params.id);
            res.json({ success: true, message: 'Job profile deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Update application status
    async updateApplicationStatus(req, res, next) {
        try {
            const { status } = req.body;
            const application = await jobService.updateApplicationStatus(req.params.id, status);
            res.json({ success: true, data: application, message: `Application status updated to ${status}` });
        } catch (error) {
            next(error);
        }
    }

    // Admin: Delete application
    async deleteApplication(req, res, next) {
        try {
            await jobService.deleteApplication(req.params.id);
            res.json({ success: true, message: 'Application deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new JobController();
