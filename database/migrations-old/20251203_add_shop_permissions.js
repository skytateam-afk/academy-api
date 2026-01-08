/**
 * Add Shop Management Permissions
 * Creates permissions for shop categories, products, orders, and sales management
 */

exports.up = async function(knex) {
  // Insert shop permissions
  await knex('permissions').insert([
    // Shop Category permissions
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_category.create',
      resource: 'shop_category',
      action: 'create',
      description: 'Create shop categories',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_category.read',
      resource: 'shop_category',
      action: 'read',
      description: 'View shop categories',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_category.update',
      resource: 'shop_category',
      action: 'update',
      description: 'Update shop categories',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_category.delete',
      resource: 'shop_category',
      action: 'delete',
      description: 'Delete shop categories',
      created_at: new Date()
    },
    
    // Shop Product permissions
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_product.create',
      resource: 'shop_product',
      action: 'create',
      description: 'Create shop products',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_product.read',
      resource: 'shop_product',
      action: 'read',
      description: 'View shop products',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_product.update',
      resource: 'shop_product',
      action: 'update',
      description: 'Update shop products',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_product.delete',
      resource: 'shop_product',
      action: 'delete',
      description: 'Delete shop products',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_product.publish',
      resource: 'shop_product',
      action: 'publish',
      description: 'Publish/unpublish shop products',
      created_at: new Date()
    },
    
    // Shop Order permissions
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_order.read',
      resource: 'shop_order',
      action: 'read',
      description: 'View shop orders',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_order.update',
      resource: 'shop_order',
      action: 'update',
      description: 'Update shop orders',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_order.delete',
      resource: 'shop_order',
      action: 'delete',
      description: 'Delete shop orders',
      created_at: new Date()
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_order.manage',
      resource: 'shop_order',
      action: 'manage',
      description: 'Manage order fulfillment and status',
      created_at: new Date()
    },
    
    // Shop Cart permissions
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_cart.manage',
      resource: 'shop_cart',
      action: 'manage',
      description: 'Manage shopping cart',
      created_at: new Date()
    },
    
    // Shop Analytics permissions
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'shop_analytics.view',
      resource: 'shop_analytics',
      action: 'view',
      description: 'View shop analytics and sales reports',
      created_at: new Date()
    }
  ]).onConflict(['resource', 'action']).ignore();

  // Assign shop permissions to super_admin and admin roles
  const superAdminRole = await knex('roles').where('name', 'super_admin').first();
  const adminRole = await knex('roles').where('name', 'admin').first();
  
  if (superAdminRole) {
    const shopPermissions = await knex('permissions')
      .whereIn('resource', ['shop_category', 'shop_product', 'shop_order', 'shop_cart', 'shop_analytics'])
      .select('id');
    
    const rolePermissions = shopPermissions.map(perm => ({
      id: knex.raw('uuid_generate_v4()'),
      role_id: superAdminRole.id,
      permission_id: perm.id,
      created_at: new Date()
    }));
    
    await knex('role_permissions').insert(rolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  }
  
  if (adminRole) {
    const adminShopPermissions = await knex('permissions')
      .whereIn('name', [
        'shop_category.read',
        'shop_category.create',
        'shop_category.update',
        'shop_product.read',
        'shop_product.create',
        'shop_product.update',
        'shop_product.publish',
        'shop_order.read',
        'shop_order.update',
        'shop_order.manage',
        'shop_analytics.view'
      ])
      .select('id');
    
    const rolePermissions = adminShopPermissions.map(perm => ({
      id: knex.raw('uuid_generate_v4()'),
      role_id: adminRole.id,
      permission_id: perm.id,
      created_at: new Date()
    }));
    
    await knex('role_permissions').insert(rolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  }
  
  // Student/user roles get cart management and product viewing
  const studentRole = await knex('roles').where('name', 'student').first();
  const userRole = await knex('roles').where('name', 'user').first();
  
  const customerPermissions = await knex('permissions')
    .whereIn('name', ['shop_product.read', 'shop_cart.manage'])
    .select('id');
  
  if (studentRole && customerPermissions.length > 0) {
    const rolePermissions = customerPermissions.map(perm => ({
      id: knex.raw('uuid_generate_v4()'),
      role_id: studentRole.id,
      permission_id: perm.id,
      created_at: new Date()
    }));
    
    await knex('role_permissions').insert(rolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  }
  
  if (userRole && customerPermissions.length > 0) {
    const rolePermissions = customerPermissions.map(perm => ({
      id: knex.raw('uuid_generate_v4()'),
      role_id: userRole.id,
      permission_id: perm.id,
      created_at: new Date()
    }));
    
    await knex('role_permissions').insert(rolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  }
};

exports.down = async function(knex) {
  // Remove shop permissions
  await knex('permissions')
    .whereIn('resource', ['shop_category', 'shop_product', 'shop_order', 'shop_cart', 'shop_analytics'])
    .del();
};
