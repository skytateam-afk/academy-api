/**
 * Modules Index
 * Central export point for all application modules
 */

const auth = require('./auth');
const userManagement = require('./user_management');
const courseManagement = require('./course_management');
const pathwayManagement = require('./pathway_management');
const institutionManagement = require('./institution_management');
const notifications = require('./notifications');
const announcements = require('./announcements');
const promotions = require('./promotions');
const libraryManagement = require('./library_management');
const staffManagement = require('./staff_management');
const classroomManagement = require('./classroom_management');
const certificates = require('./certificates/routes/certificateRoutes');
const tagManagement = require('./tag_management/tagRoutes');
const jobManagement = require('./job_management');
const results = require('./results/result.routes');
const menuVisibility = require('./menu_visibility/menuVisibility.routes');
const contactManagement = require('./contact_management/contact.routes');
const search = require('./search/search.routes');

module.exports = {
  auth,
  userManagement,
  courseManagement,
  pathwayManagement,
  institutionManagement,
  notifications,
  announcements,
  promotions,
  libraryManagement,
  staffManagement,
  classroomManagement,
  certificates,
  tagManagement,
  jobManagement,
  results,
  menuVisibility,
  contactManagement,
  search
};
