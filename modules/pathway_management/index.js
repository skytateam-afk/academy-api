/**
 * Pathway Management Module
 * Handles all pathway-related operations including creation, management, and enrollment
 */

const pathwayRoutes = require('./routes/pathwayRoutes');

module.exports = {
    routes: pathwayRoutes,
    basePath: '/pathways'
};
