/**
 * Tag Management Controller
 * System-wide tagging/metadata management
 */

const Tag = require('../../models/Tag');

/**
 * Get all tags
 * @route GET /api/tags
 */
const getTags = async (req, res, next) => {
    try {
        const {
            search,
            tag_key,
            tag_type,
            category_id,
            page = 1,
            limit = 100
        } = req.query;

        const tags = await Tag.getAll({
            search,
            tag_key,
            tag_type,
            category_id,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: tags,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tag by ID
 * @route GET /api/tags/:id
 */
const getTagById = async (req, res, next) => {
    try {
        const tag = await Tag.getById(req.params.id);

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
        }

        res.json({
            success: true,
            data: tag
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new tag
 * @route POST /api/tags
 */
const createTag = async (req, res, next) => {
    try {
        const {
            tag_key,
            tag_value,
            description,
            tag_type = 'custom',
            category_id
        } = req.body;

        if (!tag_key || !tag_value) {
            return res.status(400).json({
                success: false,
                message: 'tag_key and tag_value are required'
            });
        }

        const tag = await Tag.create({
            tag_key,
            tag_value,
            description,
            tag_type,
            category_id,
            created_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Tag created successfully',
            data: tag
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a tag
 * @route PATCH /api/tags/:id
 */
const updateTag = async (req, res, next) => {
    try {
        const { description, tag_type, category_id } = req.body;

        const tag = await Tag.update(req.params.id, {
            description,
            tag_type,
            category_id
        });

        res.json({
            success: true,
            message: 'Tag updated successfully',
            data: tag
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a tag
 * @route DELETE /api/tags/:id
 */
const deleteTag = async (req, res, next) => {
    try {
        await Tag.delete(req.params.id);

        res.json({
            success: true,
            message: 'Tag deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all tag keys
 * @route GET /api/tags/keys
 */
const getTagKeys = async (req, res, next) => {
    try {
        const keys = await Tag.getTagKeys();

        res.json({
            success: true,
            data: keys
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tag values for a key
 * @route GET /api/tags/keys/:key/values
 */
const getTagValues = async (req, res, next) => {
    try {
        const values = await Tag.getTagValues(req.params.key);

        res.json({
            success: true,
            data: values
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Tag a resource
 * @route POST /api/tags/resources
 */
const tagResource = async (req, res, next) => {
    try {
        const {
            resource_type,
            resource_id,
            tag_key,
            tag_value,
            tag_description,
            tag_type,
            category_id
        } = req.body;

        if (!resource_type || !resource_id || !tag_key || !tag_value) {
            return res.status(400).json({
                success: false,
                message: 'resource_type, resource_id, tag_key, and tag_value are required'
            });
        }

        const resourceTag = await Tag.tagResource({
            resource_type,
            resource_id,
            tag_key,
            tag_value,
            tagged_by: req.user.id,
            tag_description,
            tag_type,
            category_id
        });

        res.status(201).json({
            success: true,
            message: 'Resource tagged successfully',
            data: resourceTag
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Untag a resource
 * @route DELETE /api/tags/resources/:resource_type/:resource_id/:tag_id
 */
const untagResource = async (req, res, next) => {
    try {
        const { resource_type, resource_id, tag_id } = req.params;

        await Tag.untagResource(resource_type, resource_id, tag_id);

        res.json({
            success: true,
            message: 'Resource untagged successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tags for a resource
 * @route GET /api/tags/resources/:resource_type/:resource_id
 */
const getResourceTags = async (req, res, next) => {
    try {
        const { resource_type, resource_id } = req.params;

        const tags = await Tag.getResourceTags(resource_type, resource_id);

        res.json({
            success: true,
            data: tags
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Search resources by tags
 * @route POST /api/tags/search
 */
const searchResourcesByTags = async (req, res, next) => {
    try {
        const {
            resource_type,
            tags,
            match_type = 'all'
        } = req.body;

        if (!resource_type || !tags || !Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: 'resource_type and tags array are required'
            });
        }

        const resourceIds = await Tag.searchResourcesByTags(
            resource_type,
            tags,
            match_type
        );

        res.json({
            success: true,
            data: resourceIds,
            count: resourceIds.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tag categories
 * @route GET /api/tags/categories
 */
const getCategories = async (req, res, next) => {
    try {
        const categories = await Tag.getCategories();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk tag resources
 * @route POST /api/tags/bulk
 */
const bulkTagResources = async (req, res, next) => {
    try {
        const { resources, tags } = req.body;

        if (!resources || !Array.isArray(resources) || !tags || !Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: 'resources and tags arrays are required'
            });
        }

        const count = await Tag.bulkTagResources(resources, tags, req.user.id);

        res.json({
            success: true,
            message: `Successfully tagged ${count} resource-tag combinations`,
            data: { count }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag,
    getTagKeys,
    getTagValues,
    tagResource,
    untagResource,
    getResourceTags,
    searchResourcesByTags,
    getCategories,
    bulkTagResources
};
