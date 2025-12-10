/**
 * Permission Repository
 * Handles all database operations for permissions using Knex
 */

const knex = require('../../../config/knex');

class PermissionRepository {
  /**
   * Get all permissions
   */
  async findAll() {
    return await knex('permissions')
      .select('*')
      .orderBy('name');
  }

  /**
   * Find permission by ID
   */
  async findById(id) {
    return await knex('permissions')
      .where({ id })
      .first();
  }

  /**
   * Find permission by name
   */
  async findByName(name) {
    return await knex('permissions')
      .where({ name })
      .first();
  }

  /**
   * Find permissions by names
   */
  async findByNames(names) {
    return await knex('permissions')
      .whereIn('name', names)
      .orderBy('name');
  }

  /**
   * Create a new permission
   */
  async create(permissionData) {
    const { name, description } = permissionData;
    
    const [permission] = await knex('permissions')
      .insert({
        name,
        description,
        created_at: knex.fn.now()
      })
      .returning('*');
    
    return permission;
  }

  /**
   * Update permission
   */
  async update(id, permissionData) {
    const [permission] = await knex('permissions')
      .where({ id })
      .update(permissionData)
      .returning('*');
    
    return permission;
  }

  /**
   * Delete permission
   */
  async delete(id) {
    // First remove all role_permissions associations
    await knex('role_permissions')
      .where({ permission_id: id })
      .delete();
    
    // Then delete the permission
    await knex('permissions')
      .where({ id })
      .delete();
  }

  /**
   * Get roles that have this permission
   */
  async getRoles(permissionId) {
    return await knex('roles')
      .select('roles.*')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .where('role_permissions.permission_id', permissionId)
      .orderBy('roles.name');
  }

  /**
   * Get permissions by resource
   */
  async findByResource(resource) {
    return await knex('permissions')
      .where('name', 'like', `${resource}.%`)
      .orderBy('name');
  }

  /**
   * Bulk create permissions
   */
  async bulkCreate(permissionsData) {
    const permissions = permissionsData.map(p => ({
      name: p.name,
      description: p.description,
      created_at: knex.fn.now()
    }));
    
    return await knex('permissions')
      .insert(permissions)
      .returning('*');
  }

  /**
   * Check if permission exists
   */
  async exists(name) {
    const permission = await this.findByName(name);
    return !!permission;
  }

  /**
   * Get permission usage count (how many roles use it)
   */
  async getUsageCount(permissionId) {
    const result = await knex('role_permissions')
      .where({ permission_id: permissionId })
      .count('* as count')
      .first();
    
    return parseInt(result.count);
  }
}

module.exports = new PermissionRepository();
