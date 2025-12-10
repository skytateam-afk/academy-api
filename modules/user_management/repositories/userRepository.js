/**
 * User Repository
 * Handles all database operations for users using Knex
 */

const knex = require('../../../config/knex');
const bcrypt = require('bcrypt');

class UserRepository {
  /**
   * Get all users with pagination
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, search, role } = options;
    const offset = (page - 1) * limit;

    let query = knex('users')
      .select('users.*', 'roles.name as role_name')
      .leftJoin('roles', 'users.role_id', 'roles.id');

    if (search) {
      query = query.where(function() {
        this.where('users.username', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`)
          .orWhere('users.first_name', 'ilike', `%${search}%`)
          .orWhere('users.last_name', 'ilike', `%${search}%`);
      });
    }

    if (role) {
      query = query.where('roles.name', role);
    }

    const total = await query.clone().count('* as count').first();
    const users = await query.limit(limit).offset(offset).orderBy('users.created_at', 'desc');

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    return await knex('users')
      .select('users.*', 'roles.name as role_name')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.id', id)
      .first();
  }

  /**
   * Find user by ID with roles and permissions
   */
  async findByIdWithRoles(id) {
    const user = await this.findById(id);
    
    if (!user) return null;

    const permissions = await knex('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', user.role_id);

    return {
      ...user,
      permissions
    };
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await knex('users')
      .where({ email })
      .first();
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return await knex('users')
      .where({ username })
      .first();
  }

  /**
   * Create a new user
   */
  async create(userData) {
    const { username, email, password, first_name, last_name, role_id } = userData;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    const [user] = await knex('users')
      .insert({
        username,
        email,
        password_hash,
        first_name,
        last_name,
        role_id: role_id || (await this.getDefaultRoleId()),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');
    
    return user;
  }

  /**
   * Update user
   */
  async update(id, userData) {
    const updateData = { ...userData };
    delete updateData.password; // Don't allow password update through this method
    
    const [user] = await knex('users')
      .where({ id })
      .update({
        ...updateData,
        updated_at: knex.fn.now()
      })
      .returning('*');
    
    return user;
  }

  /**
   * Update user password
   */
  async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    
    await knex('users')
      .where({ id })
      .update({
        password_hash,
        updated_at: knex.fn.now()
      });
  }

  /**
   * Delete user
   */
  async delete(id) {
    await knex('users')
      .where({ id })
      .delete();
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId, permissionName) {
    const result = await knex('users')
      .select('permissions.name')
      .join('roles', 'users.role_id', 'roles.id')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('users.id', userId)
      .where('permissions.name', permissionName)
      .first();

    return !!result;
  }

  /**
   * Get user permissions
   */
  async getPermissions(userId) {
    return await knex('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('users', 'role_permissions.role_id', 'users.role_id')
      .where('users.id', userId);
  }

  /**
   * Get default role ID (user role)
   */
  async getDefaultRoleId() {
    const role = await knex('roles')
      .where({ name: 'user' })
      .first();
    
    return role ? role.id : null;
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last login
   */
  async updateLastLogin(id) {
    await knex('users')
      .where({ id })
      .update({
        last_login: knex.fn.now()
      });
  }

  /**
   * Toggle MFA
   */
  async toggleMFA(id, enabled) {
    await knex('users')
      .where({ id })
      .update({
        mfa_enabled: enabled,
        updated_at: knex.fn.now()
      });
  }
}

module.exports = new UserRepository();
