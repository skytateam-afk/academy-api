/**
 * Course Management Module
 * Handles courses, categories, and enrollments
 */

const courseController = require('./controllers/courseController');
const categoryController = require('./controllers/categoryController');

const Course = require('./models/Course');
const Category = require('./models/Category');

// Repositories
const courseRepository = require('./repositories/courseRepository');
const categoryRepository = require('./repositories/categoryRepository');

const courseRoutes = require('./routes/courseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

module.exports = {
  controllers: {
    courseController,
    categoryController
  },
  models: {
    Course,
    Category
  },
  repositories: {
    courseRepository,
    categoryRepository
  },
  routes: {
    courseRoutes,
    categoryRoutes
  }
};
