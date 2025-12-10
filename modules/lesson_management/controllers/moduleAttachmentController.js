/**
 * Module Attachment Controller
 * Handles HTTP requests for module attachments
 */

const moduleAttachmentRepository = require('../repositories/moduleAttachmentRepository');
const moduleRepository = require('../repositories/moduleRepository');

/**
 * Get all attachments for a module
 */
exports.getAttachmentsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const attachments = await moduleAttachmentRepository.findByModule(moduleId);

    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single attachment by ID
 */
exports.getAttachmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attachment = await moduleAttachmentRepository.findById(id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    res.json({
      success: true,
      data: attachment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new attachment
 */
exports.createAttachment = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const attachmentData = req.body;

    // Verify module exists
    const module = await moduleRepository.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Get next order index if not provided
    if (attachmentData.order_index === undefined) {
      attachmentData.order_index = await moduleAttachmentRepository.getNextOrderIndex(moduleId);
    }

    const attachment = await moduleAttachmentRepository.create({
      module_id: moduleId,
      ...attachmentData
    });

    res.status(201).json({
      success: true,
      message: 'Attachment created successfully',
      data: attachment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an attachment
 */
exports.updateAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const attachment = await moduleAttachmentRepository.findById(id);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    const updatedAttachment = await moduleAttachmentRepository.update(id, updates);

    res.json({
      success: true,
      message: 'Attachment updated successfully',
      data: updatedAttachment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an attachment
 */
exports.deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attachment = await moduleAttachmentRepository.findById(id);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    await moduleAttachmentRepository.delete(id);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create attachments
 */
exports.bulkCreateAttachments = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { attachments } = req.body;

    if (!Array.isArray(attachments) || attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attachments array is required and must not be empty'
      });
    }

    const createdAttachments = await moduleAttachmentRepository.bulkCreate(moduleId, attachments);

    res.status(201).json({
      success: true,
      message: `${createdAttachments.length} attachments created successfully`,
      data: createdAttachments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder attachments
 */
exports.reorderAttachments = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { attachments } = req.body;

    if (!Array.isArray(attachments)) {
      return res.status(400).json({
        success: false,
        message: 'Attachments must be an array'
      });
    }

    await moduleAttachmentRepository.reorder(moduleId, attachments);

    res.json({
      success: true,
      message: 'Attachments reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attachment statistics
 */
exports.getAttachmentStatistics = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const stats = await moduleAttachmentRepository.getStatistics(moduleId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
