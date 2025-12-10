/**
 * Role Repository
 * Handles all database operations for roles using Knex
 */

const knex = require('../../../config/knex');

class RoleRepository {
  /**
   * Get all roles
   */
  async findAll() {
    return await knex('roles')
      .select('*')
      .orderBy('name');
  }

  /**
   * Get all roles with permissions
   */
  async findAllWithPermissions() {
    const roles = await this.findAll();
    
    for (const role of roles) {
      role.permissions = await this.getPermissions(role.id);
    }
    
    return roles;
  }

  /**
   * Find role by ID
   */
  async findById(id) {
    return await knex('roles')
      .where({ id })
      .first();
  }

  /**
   * Find role by ID with permissions
   */
  async findByIdWithPermissions(id) {
    const role = await this.findById(id);
    
    if (!role) return null;
    
    role.permissions = await this.getPermissions(id);
    
    return role;
  }

  /**
   * Find role by name
   */
  async findByName(name) {
    return await knex('roles')
      .where({ name })
      .first();
  }

  /**
   * Create a new role
   */
  async create(roleData) {
    const { name, description } = roleData;
    
    const [role] = await knex('roles')
      .insert({
        name,
        description,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');
    
    return role;
  }

  /**
   * Update role
   */
  async update(id, roleData) {
    const [role] = await knex('roles')
      .where({ id })
      .update({
        ...roleData,
        updated_at: knex.fn.now()
      })
      .returning('*');
    
    return role;
  }

  /**
   * Delete role
   */
  async delete(id) {
    // First remove all role_permissions associations
    await knex('role_permissions')
      .where({ role_id: id })
      .delete();
    
    // Then delete the role
    await knex('roles')
      .where({ id })
      .delete();
  }

  /**
   * Get permissions for a role
   */
  async getPermissions(roleId) {
    return await knex('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .orderBy('permissions.name');
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(roleId, permissionIds) {
    // Remove existing permissions
    await knex('role_permissions')
      .where({ role_id: roleId })
      .delete();
    
    // Add new permissions
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId
      }));
      
      await knex('role_permissions').insert(rolePermissions);
    }
  }

  /**
   * Add single permission to role
   */
  async addPermission(roleId, permissionId) {
    await knex('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId
      })
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId, permissionId) {
    await knex('role_permissions')
      .where({
        role_id: roleId,
        permission_id: permissionId
      })
      .delete();
  }

  /**
   * Check if role has permission
   */
  async hasPermission(roleId, permissionName) {
    const result = await knex('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId)
      .where('permissions.name', permissionName)
      .first();
    
    return !!result;
  }

  /**
   * Get users count for a role
   */
  async getUsersCount(roleId) {
    const result = await knex('users')
      .where({ role_id: roleId })
      .count('* as count')
      .first();
    
    return parseInt(result.count);
  }
}

module.exports = new RoleRepository();
