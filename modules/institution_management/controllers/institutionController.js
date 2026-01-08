/**
 * Institution Controller
 * Handles HTTP requests for institution management
 */

const Institution = require('../../../models/Institution');
const logger = require('../../../config/winston');
const { z } = require('zod');

// Validation schemas
const createInstitutionSchema = z.object({
    name: z.string().min(3).max(255),
    official_email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    phone_number: z.string().optional().nullable(),
    subscription_tier_id: z.string().uuid().optional().nullable()
});

const updateInstitutionSchema = z.object({
    name: z.string().min(3).max(255).optional(),
    official_email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    phone_number: z.string().optional().nullable(),
    subscription_tier_id: z.string().uuid().optional().nullable()
});

/**
 * Create a new institution
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

        // Check if institution already exists
        const exists = await Institution.exists(validationResult.data.name);
        if (exists) {
            return res.status(409).json({
                success: false,
                error: 'Institution with this name already exists'
            });
        }

        const institution = await Institution.create(validationResult.data);

        logger.info('Institution created successfully', {
            institutionId: institution.id,
            name: institution.name,
            userId: req.user?.userId
        });

        res.status(201).json({
            success: true,
            message: 'Institution created successfully',
            data: institution
        });
    } catch (error) {
        logger.error('Error in createInstitution', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: 'Failed to create institution'
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
