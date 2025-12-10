/**
 * User Management Module
 * Handles users, roles, and permissions
 */

const userController = require('./controllers/userController');
const roleController = require('./controllers/roleController');
const permissionController = require('./controllers/permissionController');

const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');

// Repositories
const userRepository = require('./repositories/userRepository');
const roleRepository = require('./repositories/roleRepository');
const permissionRepository = require('./repositories/permissionRepository');

const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');

const rbacMiddleware = require('./middleware/rbac');

module.exports = {
  controllers: {
    userController,
    roleController,
    permissionController
  },
  models: {
    User,
    Role,
    Permission
  },
  repositories: {
    userRepository,
    roleRepository,
    permissionRepository
  },
  routes: {
    userRoutes,
    roleRoutes,
    permissionRoutes,
    workProfileRoutes: require('./routes/workProfileRoutes')
  },
  middleware: {
    rbac: rbacMiddleware
  },
  workProfileController: require('./controllers/workProfileController') // Export controller directly too if needed
};
