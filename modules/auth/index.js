/**
 * Auth Module
 * Handles authentication and authorization
 */

const authController = require('./controllers/authController');
const authRoutes = require('./routes/authRoutes');

// Repositories
const userRepository = require('./repositories/userRepository');
const otpRepository = require('./repositories/otpRepository');

module.exports = {
  controllers: {
    authController
  },
  repositories: {
    userRepository,
    otpRepository
  },
  routes: authRoutes
};
