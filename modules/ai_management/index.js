/**
 * AI Management Module
 * Handles all AI-related functionality: conversations, feedbacks, widget config, prompts, and knowledge base
 */

const routes = require('./routes/aiManagementRoutes');

const conversationController = require('./controllers/conversationController');
const feedbackController = require('./controllers/feedbackController');
const widgetConfigController = require('./controllers/widgetConfigController');
const promptController = require('./controllers/promptController');
const knowledgeBaseController = require('./controllers/knowledgeBaseController');

const conversationRepository = require('./repositories/conversationRepository');
const feedbackRepository = require('./repositories/feedbackRepository');
const widgetConfigRepository = require('./repositories/widgetConfigRepository');
const promptRepository = require('./repositories/promptRepository');
const knowledgeBaseRepository = require('./repositories/knowledgeBaseRepository');

module.exports = {
  routes,
  controllers: {
    conversationController,
    feedbackController,
    widgetConfigController,
    promptController,
    knowledgeBaseController
  },
  repositories: {
    conversationRepository,
    feedbackRepository,
    widgetConfigRepository,
    promptRepository,
    knowledgeBaseRepository
  }
};
