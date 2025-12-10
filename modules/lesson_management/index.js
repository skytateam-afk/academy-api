/**
 * Lesson Management Module
 * Exports all lesson management components
 */

const lessonRoutes = require('./routes/lessonRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const lessonController = require('./controllers/lessonController');
const attachmentController = require('./controllers/attachmentController');
const moduleController = require('./controllers/moduleController');
const moduleAttachmentController = require('./controllers/moduleAttachmentController');
const lessonRepository = require('./repositories/lessonRepository');
const attachmentRepository = require('./repositories/attachmentRepository');
const moduleRepository = require('./repositories/moduleRepository');
const moduleAttachmentRepository = require('./repositories/moduleAttachmentRepository');

module.exports = {
  routes: {
    lessonRoutes,
    moduleRoutes
  },
  controllers: {
    lessonController,
    attachmentController,
    moduleController,
    moduleAttachmentController
  },
  repositories: {
    lessonRepository,
    attachmentRepository,
    moduleRepository,
    moduleAttachmentRepository
  }
};
