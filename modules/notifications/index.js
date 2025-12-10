/**
 * Notifications Module
 * Exports notification routes and service
 */

const notificationRoutes = require('./routes/notificationRoutes');
const notificationService = require('./services/notificationService');

module.exports = {
    routes: notificationRoutes,
    service: notificationService
};
