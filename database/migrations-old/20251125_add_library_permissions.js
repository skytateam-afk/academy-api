/**
 * Add Library Management Permissions
 */

exports.up = async function(knex) {
  // Insert library management permissions
  await knex('permissions').insert([
    { 
      name: 'library.view', 
      resource: 'library', 
      action: 'view', 
      description: 'View library items, borrowings, and reservations' 
    },
    { 
      name: 'library.manage', 
      resource: 'library', 
      action: 'manage', 
      description: 'Create and update library items, manage borrowings and reservations' 
    },
    { 
      name: 'library.delete', 
      resource: 'library', 
      action: 'delete', 
      description: 'Delete library items and categories' 
    }
  ]).onConflict(['resource', 'action']).ignore();

  // Get role IDs
  const superAdminRole = await knex('roles').where('name', 'super_admin').first();
  const adminRole = await knex('roles').where('name', 'admin').first();

  // Get library permissions
  const libraryPermissions = await knex('permissions')
    .where('resource', 'library')
    .select('id');

  if (superAdminRole && libraryPermissions.length > 0) {
    // Assign all library permissions to super_admin
    const superAdminRolePermissions = libraryPermissions.map(p => ({
      role_id: superAdminRole.id,
      permission_id: p.id
    }));
    await knex('role_permissions')
      .insert(superAdminRolePermissions)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  if (adminRole && libraryPermissions.length > 0) {
    // Assign all library permissions to admin
    const adminRolePermissions = libraryPermissions.map(p => ({
      role_id: adminRole.id,
      permission_id: p.id
    }));
    await knex('role_permissions')
      .insert(adminRolePermissions)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  console.log('✓ Library management permissions added successfully');
};

exports.down = async function(knex) {
  // Get library permissions
  const libraryPermissions = await knex('permissions')
    .where('resource', 'library')
    .select('id');

  const permissionIds = libraryPermissions.map(p => p.id);

  // Remove role_permissions entries
  await knex('role_permissions')
    .whereIn('permission_id', permissionIds)
    .del();

  // Remove library permissions
  await knex('permissions')
    .where('resource', 'library')
    .del();

  console.log('✓ Library management permissions removed');
};
