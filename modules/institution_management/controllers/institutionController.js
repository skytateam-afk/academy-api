/**
 * Institution Controller
 * Handles HTTP requests for institution management
 */

const Institution = require('../../../models/Institution');
const logger = require('../../../config/winston');
const { z } = require('zod');

const User = require('../../../models/User');

// Validation schemas
const createInstitutionSchema = z.object({
    name: z.string().min(3).max(255),
    official_email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    phone_number: z.string().optional().nullable(),
    subscription_tier_id: z.string().uuid().optional().nullable(),
    // Admin details
    admin_email: z.string().email(),
    admin_password: z.string().min(6).optional(),
    admin_first_name: z.string().min(2),
    admin_last_name: z.string().min(2),
    admin_username: z.string().min(3).optional()
});

const updateInstitutionSchema = z.object({
    name: z.string().min(3).max(255).optional(),
    official_email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    phone_number: z.string().optional().nullable(),
    subscription_tier_id: z.string().uuid().optional().nullable()
});

/**
 * Create a new institution and admin user
 */
exports.createInstitution = async (req, res) => {
    try {
        const validationResult = createInstitutionSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const data = validationResult.data;

        // Check if institution already exists
        const exists = await Institution.exists(data.name);
        if (exists) {
            return res.status(409).json({
                success: false,
                error: 'Institution with this name already exists'
            });
        }

        // Check if admin email already exists
        const existingUser = await User.findByEmail(data.admin_email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this admin email already exists'
            });
        }

        // Password handling
        let adminPassword = data.admin_password;
        if (!adminPassword) {
            const crypto = require('crypto');
            adminPassword = crypto.randomBytes(12).toString('base64').slice(0, 12);
        }

        // 1. Create Institution
        const institution = await Institution.create({
            name: data.name,
            official_email: data.official_email,
            address: data.address,
            phone_number: data.phone_number,
            subscription_tier_id: data.subscription_tier_id
        });

        try {
            // 2. Create Admin User linked to institution
            const adminUser = await User.create({
                email: data.admin_email,
                password: adminPassword,
                first_name: data.admin_first_name,
                last_name: data.admin_last_name,
                username: data.admin_username, // Optional, will auto-generate if missing
                institution_id: institution.id,
                role_name: 'institution_admin',
                is_active: true
            });

            // Send account created email with credentials
            const emailService = require('../../../services/emailService');
            emailService.sendAccountCreatedEmail({
                email: adminUser.email,
                username: adminUser.username,
                password: adminPassword,
                firstName: adminUser.first_name,
                lastName: adminUser.last_name,
                roleName: 'Institution Admin'
            }).catch(err => logger.error('Failed to send institution admin welcome email', { error: err.message }));

            logger.info('Institution and Admin User created successfully', {
                institutionId: institution.id,
                userId: adminUser.id,
                operatorId: req.user?.userId
            });

            res.status(201).json({
                success: true,
                message: 'Institution and admin account created successfully',
                data: {
                    institution,
                    admin: {
                        id: adminUser.id,
                        email: adminUser.email,
                        username: adminUser.username
                    }
                }
            });

        } catch (userError) {
            logger.error('Failed to create admin user, rolling back institution', { error: userError.message });
            // Rollback: Delete the created institution
            await Institution.delete(institution.id);
            throw userError;
        }

    } catch (error) {
        logger.error('Error in createInstitution', { error: error.message, stack: error.stack });

        // Return appropriate error message
        const status = error.message.includes('exists') ? 409 : 500;
        res.status(status).json({
            success: false,
            error: error.message || 'Failed to create institution'
        });
    }
};

/**
 * Get all institutions
 */
exports.getAllInstitutions = async (req, res) => {
    try {
        const {
            page,
            limit,
            search,
            sortBy,
            sortOrder
        } = req.query;

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            search,
            sortBy: sortBy || 'created_at',
            sortOrder: sortOrder || 'DESC'
        };

        const result = await Institution.getAll(options);

        logger.info('Retrieved all institutions', {
            count: result.institutions.length,
            page: options.page
        });

        res.json({
            success: true,
            data: result.institutions,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getAllInstitutions', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch institutions'
        });
    }
};

/**
 * Get institution by ID
 */
exports.getInstitutionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid institution ID format'
            });
        }

        const institution = await Institution.getById(id);

        if (!institution) {
            return res.status(404).json({
                success: false,
                error: 'Institution not found'
            });
        }

        res.json({
            success: true,
            data: institution
        });
    } catch (error) {
        logger.error('Error in getInstitutionById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch institution'
        });
    }
};

/**
 * Update institution
 */
exports.updateInstitution = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid institution ID format'
            });
        }

        const validationResult = updateInstitutionSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        // Check if institution exists
        const institution = await Institution.getById(id);
        if (!institution) {
            return res.status(404).json({
                success: false,
                error: 'Institution not found'
            });
        }

        // If updating name, check if new name already exists
        if (validationResult.data.name && validationResult.data.name !== institution.name) {
            const exists = await Institution.exists(validationResult.data.name);
            if (exists) {
                return res.status(409).json({
                    success: false,
                    error: 'Institution with this name already exists'
                });
            }
        }

        const updatedInstitution = await Institution.update(id, validationResult.data);

        logger.info('Institution updated successfully', {
            institutionId: id,
            userId: req.user?.userId
        });

        res.json({
            success: true,
            message: 'Institution updated successfully',
            data: updatedInstitution
        });
    } catch (error) {
        logger.error('Error in updateInstitution', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update institution'
        });
    }
};

/**
 * Delete institution
 */
exports.deleteInstitution = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid institution ID format'
            });
        }

        // Check if institution exists
        const institution = await Institution.getById(id);
        if (!institution) {
            return res.status(404).json({
                success: false,
                error: 'Institution not found'
            });
        }

        await Institution.delete(id);

        logger.info('Institution deleted successfully', {
            institutionId: id,
            userId: req.user?.userId
        });

        res.json({
            success: true,
            message: 'Institution deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteInstitution', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to delete institution'
        });
    }
};
