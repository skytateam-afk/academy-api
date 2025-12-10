/**
 * Migration: Add Settings Permissions
 * Adds permissions for managing institution and user settings
 */

exports.up = async function(knex) {
  // Insert settings permissions
  await knex('permissions').insert([
    { 
      name: 'settings.view', 
      resource: 'settings', 
      action: 'view', 
      description: 'View settings' 
    },
    { 
      name: 'settings.update', 
      resource: 'settings', 
      action: 'update', 
      description: 'Update settings including institution settings' 
    }
  ]).onConflict(['resource', 'action']).ignore();

  // Get role IDs
  const superAdminRole = await knex('roles').where('name', 'super_admin').first();
  const adminRole = await knex('roles').where('name', 'admin').first();

  // Get settings permissions
  const settingsPermissions = await knex('permissions')
    .where('resource', 'settings')
    .select('id');

  if (superAdminRole && settingsPermissions.length > 0) {
    // Assign all settings permissions to super_admin
    const superAdminRolePermissions = settingsPermissions.map(p => ({
      role_id: superAdminRole.id,
      permission_id: p.id
    }));
    await knex('role_permissions')
      .insert(superAdminRolePermissions)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  if (adminRole && settingsPermissions.length > 0) {
    // Assign all settings permissions to admin
    const adminRolePermissions = settingsPermissions.map(p => ({
      role_id: adminRole.id,
      permission_id: p.id
    }));
    await knex('role_permissions')
      .insert(adminRolePermissions)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }
};

exports.down = async function(knex) {
  // Get settings permissions
  const settingsPermissions = await knex('permissions')
    .where('resource', 'settings')
    .select('id');

  const permissionIds = settingsPermissions.map(p => p.id);

  // Remove role_permissions entries
  await knex('role_permissions')
    .whereIn('permission_id', permissionIds)
    .del();

  // Remove settings permissions
  await knex('permissions')
    .where('resource', 'settings')
    .del();
};
