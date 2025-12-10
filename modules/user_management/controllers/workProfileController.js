const knex = require('../../../config/knex');
const storageService = require('../../../services/storageService');
const { v4: uuidv4 } = require('uuid');

class WorkProfileController {
    /**
     * Get Work Profile for the authenticated user
     */
    async getMyWorkProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await knex('work_profiles')
                .where({ user_id: userId })
                .first();

            // If no profile exists, return empty structure or null
            // Alternatively, create one on the fly? Let's just return null for now if not found
            // or a default empty object to make frontend easier
            const data = profile || {
                user_id: userId,
                headline: '',
                bio: '',
                skills: [],
                projects: [],
                experience: [],
                education: [],
                is_new: true
            };

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update (or Create) Work Profile
     */
    async updateWorkProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const payload = req.body;

            // Clean payload
            const updateData = {
                headline: payload.headline,
                bio: payload.bio,
                skills: JSON.stringify(payload.skills || []),
                projects: JSON.stringify(payload.projects || []),
                experience: JSON.stringify(payload.experience || []),
                education: JSON.stringify(payload.education || []),
                linkedin_url: payload.linkedin_url,
                portfolio_url: payload.portfolio_url,
                updated_at: new Date()
            };

            // Handle file upload if present (resume)
            if (req.file) {
                const result = await storageService.uploadFile(
                    req.file.buffer,
                    `resume-${uuidv4()}-${req.file.originalname}`,
                    req.file.mimetype,
                    'work-profiles/resumes'
                );
                updateData.resume_url = result.fileUrl;
            }

            // Check if profile exists
            const existing = await knex('work_profiles').where({ user_id: userId }).first();

            let profile;
            if (existing) {
                [profile] = await knex('work_profiles')
                    .where({ user_id: userId })
                    .update(updateData)
                    .returning('*');
            } else {
                [profile] = await knex('work_profiles')
                    .insert({
                        ...updateData,
                        user_id: userId,
                        created_at: new Date()
                    })
                    .returning('*');
            }

            res.json({ success: true, data: profile, message: 'Work profile updated successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new WorkProfileController();
