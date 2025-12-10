/**
 * Library Management Module
 * Exports routes for the library management system
 */

const libraryRoutes = require('./routes/libraryRoutes');

module.exports = {
  routes: libraryRoutes,
  prefix: '/library'
};
