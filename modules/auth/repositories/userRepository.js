/**
 * User Repository
 * Handles all database operations for users using Knex
 */

const knex = require('../../../config/knex');
const bcrypt = require('bcrypt');

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id) {
    return await knex('users')
      .select('users.*', 'roles.name as role')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where({ 'users.id': id })
      .first();
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await knex('users')
      .select('users.*', 'roles.name as role')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where({ 'users.email': email })
      .first();
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return await knex('users')
      .select('users.*', 'roles.name as role')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where({ 'users.username': username })
      .first();
  }

  /**
   * Find user with password hash
   */
  async findByUsernameWithPassword(username) {
    return await knex('users')
      .select('*')
      .where({ username })
      .first();
  }

  /**
   * Find user by email with password hash
   */
  async findByEmailWithPassword(email) {
    return await knex('users')
      .select('*')
      .where({ email })
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
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return user;
  }

  /**
   * Update user
   */
  async update(id, userData) {
    const [user] = await knex('users')
      .where({ id })
      .update({
        ...userData,
        updated_at: new Date()
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
        updated_at: new Date()
      });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id) {
    await knex('users')
      .where({ id })
      .update({
        last_login: new Date()
      });
  }

  /**
   * Get user permissions
   */
  async getPermissions(userId) {
    return await knex('permissions')
      .select('permissions.name', 'permissions.description')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('users', 'role_permissions.role_id', 'users.role_id')
      .where('users.id', userId);
  }

  /**
   * Toggle MFA for user
   */
  async toggleMFA(id, enabled) {
    await knex('users')
      .where({ id })
      .update({
        mfa_enabled: enabled,
        updated_at: new Date()
      });
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
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
   * Delete user
   */
  async delete(id) {
    await knex('users')
      .where({ id })
      .delete();
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(userId, hashedToken, expiresAt) {
    // Delete any existing reset tokens for this user
    await knex('password_reset_tokens')
      .where({ user_id: userId })
      .delete();

    // Insert new reset token
    await knex('password_reset_tokens')
      .insert({
        user_id: userId,
        token_hash: hashedToken,
        expires_at: expiresAt,
        created_at: new Date()
      });
  }

  /**
   * Verify password reset token and return user
   */
  async verifyPasswordResetToken(hashedToken) {
    const tokenRecord = await knex('password_reset_tokens')
      .where({ token_hash: hashedToken })
      .andWhere('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      return null;
    }

    // Get user
    const user = await this.findById(tokenRecord.user_id);
    return user;
  }

  /**
   * Delete password reset token
   */
  async deletePasswordResetToken(userId) {
    await knex('password_reset_tokens')
      .where({ user_id: userId })
      .delete();
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId) {
    const settings = await knex('user_settings')
      .where({ user_id: userId })
      .first();

    // If no settings exist, create default settings
    if (!settings) {
      return await this.createDefaultSettings(userId);
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId, updates) {
    // Check if settings exist
    const existing = await knex('user_settings')
      .where({ user_id: userId })
      .first();

    if (existing) {
      // Update existing settings
      const [updated] = await knex('user_settings')
        .where({ user_id: userId })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      return updated;
    } else {
      // Create new settings
      const [created] = await knex('user_settings')
        .insert({
          user_id: userId,
          ui_mode: updates.ui_mode || 'explorer',
          theme: updates.theme || 'green',
          theme_mode: updates.theme_mode || 'light',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return created;
    }
  }

  /**
   * Create default settings for user
   */
  async createDefaultSettings(userId) {
    const [settings] = await knex('user_settings')
      .insert({
        user_id: userId,
        ui_mode: 'explorer',
        theme: 'green',
        theme_mode: 'light',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return settings;
  }
}

module.exports = new UserRepository();
