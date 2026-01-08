/**
 * Base Seed File
 * ===============
 * This is the comprehensive base seed file that initializes the database with:
 * - All system permissions
 * - Default roles (super_admin, admin, instructor, student, user, guest)
 * - Role-permission assignments
 * - Default admin user
 * 
 * Run this seed when connecting to a new database instance to set up the foundation.
 * 
 * Usage:
 *   npx knex seed:run --specific=00_base_seed.js
 */

const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  console.log('\n🌱 Starting base seed process...\n');

  // ============================================
  // 1. INSERT ALL PERMISSIONS
  // ============================================
  console.log('📋 Seeding permissions...');
  
  const permissions = [
    // User permissions
    { name: 'user.create', resource: 'user', action: 'create', description: 'Create new users' },
    { name: 'user.read', resource: 'user', action: 'read', description: 'View user information' },
    { name: 'user.update', resource: 'user', action: 'update', description: 'Update user information' },
    { name: 'user.delete', resource: 'user', action: 'delete', description: 'Delete users' },
    { name: 'user.manage_roles', resource: 'user', action: 'manage_roles', description: 'Assign roles to users' },

    // Course permissions
    { name: 'course.create', resource: 'course', action: 'create', description: 'Create new courses' },
    { name: 'course.read', resource: 'course', action: 'read', description: 'View courses' },
    { name: 'course.update', resource: 'course', action: 'update', description: 'Update courses' },
    { name: 'course.delete', resource: 'course', action: 'delete', description: 'Delete courses' },
    { name: 'course.publish', resource: 'course', action: 'publish', description: 'Publish/unpublish courses' },
    { name: 'course.enroll', resource: 'course', action: 'enroll', description: 'Enroll in courses' },

    // Lesson permissions
    { name: 'lesson.create', resource: 'lesson', action: 'create', description: 'Create lessons' },
    { name: 'lesson.read', resource: 'lesson', action: 'read', description: 'View lessons' },
    { name: 'lesson.update', resource: 'lesson', action: 'update', description: 'Update lessons' },
    { name: 'lesson.delete', resource: 'lesson', action: 'delete', description: 'Delete lessons' },

    // Quiz permissions
    { name: 'quiz.create', resource: 'quiz', action: 'create', description: 'Create quizzes' },
    { name: 'quiz.read', resource: 'quiz', action: 'read', description: 'View quizzes' },
    { name: 'quiz.update', resource: 'quiz', action: 'update', description: 'Update quizzes' },
    { name: 'quiz.delete', resource: 'quiz', action: 'delete', description: 'Delete quizzes' },
    { name: 'quiz.attempt', resource: 'quiz', action: 'attempt', description: 'Take quizzes' },
    { name: 'quiz.grade', resource: 'quiz', action: 'grade', description: 'Grade quiz attempts' },

    // Assignment permissions
    { name: 'assignment.create', resource: 'assignment', action: 'create', description: 'Create assignments' },
    { name: 'assignment.read', resource: 'assignment', action: 'read', description: 'View assignments' },
    { name: 'assignment.update', resource: 'assignment', action: 'update', description: 'Update assignments' },
    { name: 'assignment.delete', resource: 'assignment', action: 'delete', description: 'Delete assignments' },
    { name: 'assignment.submit', resource: 'assignment', action: 'submit', description: 'Submit assignments' },
    { name: 'assignment.grade', resource: 'assignment', action: 'grade', description: 'Grade assignments' },

    // Category permissions
    { name: 'category.create', resource: 'category', action: 'create', description: 'Create categories' },
    { name: 'category.read', resource: 'category', action: 'read', description: 'View categories' },
    { name: 'category.update', resource: 'category', action: 'update', description: 'Update categories' },
    { name: 'category.delete', resource: 'category', action: 'delete', description: 'Delete categories' },

    // Role permissions
    { name: 'role.create', resource: 'role', action: 'create', description: 'Create roles' },
    { name: 'role.read', resource: 'role', action: 'read', description: 'View roles' },
    { name: 'role.update', resource: 'role', action: 'update', description: 'Update roles' },
    { name: 'role.delete', resource: 'role', action: 'delete', description: 'Delete roles' },

    // Permission management permissions
    { name: 'permission.create', resource: 'permission', action: 'create', description: 'Create new permissions' },
    { name: 'permission.read', resource: 'permission', action: 'read', description: 'View permissions' },
    { name: 'permission.update', resource: 'permission', action: 'update', description: 'Update permissions' },
    { name: 'permission.delete', resource: 'permission', action: 'delete', description: 'Delete permissions' },

    // Payment permissions
    { name: 'payment.process', resource: 'payment', action: 'process', description: 'Process payments' },
    { name: 'payment.refund', resource: 'payment', action: 'refund', description: 'Refund payments' },
    { name: 'payment.view', resource: 'payment', action: 'view', description: 'View payment transactions' },

    // Analytics permissions
    { name: 'analytics.view', resource: 'analytics', action: 'view', description: 'View analytics and reports' },

    // Parent permissions
    { name: 'parent.read', resource: 'parent', action: 'read', description: 'View parent information' },
    { name: 'parent.create', resource: 'parent', action: 'create', description: 'Create new parents' },
    { name: 'parent.update', resource: 'parent', action: 'update', description: 'Update parent information' },
    { name: 'parent.delete', resource: 'parent', action: 'delete', description: 'Delete parents' },
    { name: 'parent.manage_students', resource: 'parent', action: 'manage_students', description: 'Manage parent-student relationships' },

    // Pathway permissions
    { name: 'pathway.create', resource: 'pathway', action: 'create', description: 'Create new pathways' },
    { name: 'pathway.read', resource: 'pathway', action: 'read', description: 'View pathways' },
    { name: 'pathway.update', resource: 'pathway', action: 'update', description: 'Update pathways' },
    { name: 'pathway.delete', resource: 'pathway', action: 'delete', description: 'Delete pathways' },
    { name: 'pathway.publish', resource: 'pathway', action: 'publish', description: 'Publish/unpublish pathways' },
    { name: 'pathway.apply', resource: 'pathway', action: 'apply', description: 'Apply for pathway access' },
    { name: 'pathway.review', resource: 'pathway', action: 'review', description: 'Review and approve/reject pathway applications' },

    // Library permissions
    { name: 'library.read', resource: 'library', action: 'read', description: 'View library items' },
    { name: 'library.manage', resource: 'library', action: 'manage', description: 'Manage library items' },
    { name: 'library.delete', resource: 'library', action: 'delete', description: 'Delete library items' },
    { name: 'library.view', resource: 'library', action: 'view', description: 'View library statistics and borrowings' },

    // Staff permissions
    { name: 'staff.create', resource: 'staff', action: 'create', description: 'Create staff members' },
    { name: 'staff.read', resource: 'staff', action: 'read', description: 'View staff information' },
    { name: 'staff.update', resource: 'staff', action: 'update', description: 'Update staff information' },
    { name: 'staff.delete', resource: 'staff', action: 'delete', description: 'Delete staff members' },

    // Shop Product permissions
    { name: 'shop_product.create', resource: 'shop_product', action: 'create', description: 'Create shop products' },
    { name: 'shop_product.read', resource: 'shop_product', action: 'read', description: 'View shop products' },
    { name: 'shop_product.update', resource: 'shop_product', action: 'update', description: 'Update shop products' },
    { name: 'shop_product.delete', resource: 'shop_product', action: 'delete', description: 'Delete shop products' },
    { name: 'shop_product.publish', resource: 'shop_product', action: 'publish', description: 'Publish/unpublish shop products' },

    // Shop Category permissions
    { name: 'shop_category.create', resource: 'shop_category', action: 'create', description: 'Create shop categories' },
    { name: 'shop_category.read', resource: 'shop_category', action: 'read', description: 'View shop categories' },
    { name: 'shop_category.update', resource: 'shop_category', action: 'update', description: 'Update shop categories' },
    { name: 'shop_category.delete', resource: 'shop_category', action: 'delete', description: 'Delete shop categories' },

    // Shop Order permissions
    { name: 'shop_order.read', resource: 'shop_order', action: 'read', description: 'View shop orders' },
    { name: 'shop_order.update', resource: 'shop_order', action: 'update', description: 'Update shop orders' },
    { name: 'shop_order.manage', resource: 'shop_order', action: 'manage', description: 'Manage shop orders' },

    // Shop Analytics permissions
    { name: 'shop_analytics.view', resource: 'shop_analytics', action: 'view', description: 'View shop analytics' },

    // Menu permissions
    { name: 'menu.create', resource: 'menu', action: 'create', description: 'Create menu items' },
    { name: 'menu.read', resource: 'menu', action: 'read', description: 'View menu items' },
    { name: 'menu.update', resource: 'menu', action: 'update', description: 'Update menu items' },
    { name: 'menu.delete', resource: 'menu', action: 'delete', description: 'Delete menu items' },

    // Settings permissions
    { name: 'settings.read', resource: 'settings', action: 'read', description: 'View settings' },
    { name: 'settings.update', resource: 'settings', action: 'update', description: 'Update settings' },
    { name: 'settings.create', resource: 'settings', action: 'create', description: 'Create settings' },
    { name: 'settings.delete', resource: 'settings', action: 'delete', description: 'Delete settings' },

    // Contact permissions
    { name: 'contact.read', resource: 'contact', action: 'read', description: 'View contact submissions' },
    { name: 'contact.update', resource: 'contact', action: 'update', description: 'Update contact submissions' },
    { name: 'contact.delete', resource: 'contact', action: 'delete', description: 'Delete contact submissions' },

    // Classroom permissions
    { name: 'classroom.create', resource: 'classroom', action: 'create', description: 'Create classrooms' },
    { name: 'classroom.read', resource: 'classroom', action: 'read', description: 'View classrooms' },
    { name: 'classroom.update', resource: 'classroom', action: 'update', description: 'Update classrooms' },
    { name: 'classroom.delete', resource: 'classroom', action: 'delete', description: 'Delete classrooms' },
    { name: 'classroom.assign_students', resource: 'classroom', action: 'assign_students', description: 'Assign students to classrooms' },
    { name: 'classroom.assign_teachers', resource: 'classroom', action: 'assign_teachers', description: 'Assign teachers to classrooms' },

    // Subscription permissions
    { name: 'subscription.create', resource: 'subscription', action: 'create', description: 'Create subscription tiers' },
    { name: 'subscription.read', resource: 'subscription', action: 'read', description: 'View subscription tiers' },
    { name: 'subscription.update', resource: 'subscription', action: 'update', description: 'Update subscription tiers' },
    { name: 'subscription.delete', resource: 'subscription', action: 'delete', description: 'Delete subscription tiers' },
    { name: 'subscription.manage', resource: 'subscription', action: 'manage', description: 'Manage subscription settings' },
    { name: 'subscription.view', resource: 'subscription', action: 'view', description: 'View subscription data' },
    { name: 'subscription.cancel', resource: 'subscription', action: 'cancel', description: 'Cancel subscriptions' },

    // Announcement permissions
    { name: 'announcement.create', resource: 'announcement', action: 'create', description: 'Create announcements' },
    { name: 'announcement.read', resource: 'announcement', action: 'read', description: 'View announcements' },
    { name: 'announcement.update', resource: 'announcement', action: 'update', description: 'Update announcements' },
    { name: 'announcement.delete', resource: 'announcement', action: 'delete', description: 'Delete announcements' },

    // Promotion permissions
    { name: 'promotion.create', resource: 'promotion', action: 'create', description: 'Create promotions' },
    { name: 'promotion.read', resource: 'promotion', action: 'read', description: 'View promotions' },
    { name: 'promotion.update', resource: 'promotion', action: 'update', description: 'Update promotions' },
    { name: 'promotion.delete', resource: 'promotion', action: 'delete', description: 'Delete promotions' },

    // Certificate permissions
    { name: 'certificate.create', resource: 'certificate', action: 'create', description: 'Create certificates' },
    { name: 'certificate.read', resource: 'certificate', action: 'read', description: 'View certificates' },
    { name: 'certificate.update', resource: 'certificate', action: 'update', description: 'Update certificates' },
    { name: 'certificate.delete', resource: 'certificate', action: 'delete', description: 'Delete certificates' },
    { name: 'certificate.issue', resource: 'certificate', action: 'issue', description: 'Issue certificates' },

    // Document permissions
    { name: 'document.create', resource: 'document', action: 'create', description: 'Create documents' },
    { name: 'document.read', resource: 'document', action: 'read', description: 'View documents' },
    { name: 'document.update', resource: 'document', action: 'update', description: 'Update documents' },
    { name: 'document.delete', resource: 'document', action: 'delete', description: 'Delete documents' },

    // Institution permissions
    { name: 'institution.create', resource: 'institution', action: 'create', description: 'Create institutions' },
    { name: 'institution.view', resource: 'institution', action: 'view', description: 'View institutions' },
    { name: 'institution.update', resource: 'institution', action: 'update', description: 'Update institutions' },
    { name: 'institution.delete', resource: 'institution', action: 'delete', description: 'Delete institutions' },
  ];

  await knex('permissions').insert(permissions).onConflict(['resource', 'action']).ignore();
  console.log(`✅ Inserted ${permissions.length} permissions`);

  // ============================================
  // 2. INSERT DEFAULT ROLES
  // ============================================
  console.log('\n👥 Seeding roles...');
  
  const roles = [
    { name: 'super_admin', description: 'Super Administrator with full system access', is_system_role: true },
    { name: 'admin', description: 'Administrator with management access', is_system_role: true },
    { name: 'instructor', description: 'Course instructor who can create and manage courses', is_system_role: true },
    { name: 'student', description: 'Student who can enroll in and take courses', is_system_role: true },
    { name: 'user', description: 'Regular user who can view and enroll in courses', is_system_role: true },
    { name: 'guest', description: 'Guest user with limited read access', is_system_role: true }
  ];

  await knex('roles').insert(roles).onConflict('name').ignore();
  console.log(`✅ Inserted ${roles.length} roles`);

  // ============================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  console.log('\n🔐 Assigning permissions to roles...');
  
  // Get role IDs
  const superAdminRole = await knex('roles').where('name', 'super_admin').first();
  const adminRole = await knex('roles').where('name', 'admin').first();
  const instructorRole = await knex('roles').where('name', 'instructor').first();
  const studentRole = await knex('roles').where('name', 'student').first();
  const userRole = await knex('roles').where('name', 'user').first();
  const guestRole = await knex('roles').where('name', 'guest').first();

  // Get all permissions
  const allPermissions = await knex('permissions').select('id');

  // ====== SUPER ADMIN: ALL PERMISSIONS ======
  const superAdminPermissions = allPermissions.map(p => ({
    role_id: superAdminRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(superAdminPermissions).onConflict(['role_id', 'permission_id']).ignore();
  console.log(`✅ Super Admin: ${superAdminPermissions.length} permissions`);

  // ====== ADMIN: MANAGEMENT PERMISSIONS ======
  const adminPermissionNames = [
    // User management
    'user.create', 'user.read', 'user.update', 'user.delete', 'user.manage_roles',
    
    // Course management
    'course.create', 'course.read', 'course.update', 'course.delete', 'course.publish',
    
    // Lesson management
    'lesson.create', 'lesson.read', 'lesson.update', 'lesson.delete',
    
    // Quiz management
    'quiz.create', 'quiz.read', 'quiz.update', 'quiz.delete', 'quiz.grade',
    
    // Assignment management
    'assignment.create', 'assignment.read', 'assignment.update', 'assignment.delete', 'assignment.grade',
    
    // Category management
    'category.create', 'category.read', 'category.update', 'category.delete',
    
    // Role management (read only - admin cannot modify roles for security)
    'role.read',
    
    // Permission management (read only - admin cannot create permissions but can view)
    'permission.read',
    
    // Payment management
    'payment.view', 'payment.refund',
    
    // Analytics
    'analytics.view',
    
    // Parent management
    'parent.read', 'parent.create', 'parent.update', 'parent.delete', 'parent.manage_students',
    
    // Pathway management
    'pathway.create', 'pathway.read', 'pathway.update', 'pathway.delete', 'pathway.publish', 'pathway.review',
    
    // Library management
    'library.read', 'library.manage', 'library.delete', 'library.view',
    
    // Staff management
    'staff.create', 'staff.read', 'staff.update', 'staff.delete',
    
    // Shop management
    'shop_product.create', 'shop_product.read', 'shop_product.update', 'shop_product.delete', 'shop_product.publish',
    'shop_category.create', 'shop_category.read', 'shop_category.update', 'shop_category.delete',
    'shop_order.read', 'shop_order.update', 'shop_order.manage',
    'shop_analytics.view',
    
    // Menu management
    'menu.create', 'menu.read', 'menu.update', 'menu.delete',
    
    // Settings management
    'settings.create', 'settings.read', 'settings.update', 'settings.delete',
    
    // Contact management
    'contact.read', 'contact.update', 'contact.delete',
    
    // Classroom management
    'classroom.create', 'classroom.read', 'classroom.update', 'classroom.delete',
    'classroom.assign_students', 'classroom.assign_teachers',
    
    // Subscription management
    'subscription.view',
    
    // Announcement management
    'announcement.create', 'announcement.read', 'announcement.update', 'announcement.delete',
    
    // Promotion management
    'promotion.create', 'promotion.read', 'promotion.update', 'promotion.delete',
    
    // Certificate management
    'certificate.create', 'certificate.read', 'certificate.update', 'certificate.delete', 'certificate.issue',
    
    // Document management
    'document.create', 'document.read', 'document.update', 'document.delete',

    // Institution management
    'institution.create', 'institution.view', 'institution.update', 'institution.delete'
  ];
  
  const adminPermissions = await knex('permissions').whereIn('name', adminPermissionNames).select('id');
  const adminRolePermissions = adminPermissions.map(p => ({
    role_id: adminRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(adminRolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  console.log(`✅ Admin: ${adminRolePermissions.length} permissions`);

  // ====== INSTRUCTOR: TEACHING PERMISSIONS ======
  const instructorPermissionNames = [
    'course.create', 'course.read', 'course.update', 'course.publish',
    'lesson.create', 'lesson.read', 'lesson.update', 'lesson.delete',
    'quiz.create', 'quiz.read', 'quiz.update', 'quiz.delete', 'quiz.grade',
    'assignment.create', 'assignment.read', 'assignment.update', 'assignment.delete', 'assignment.grade',
    'category.read',
    'analytics.view',
    'classroom.read',
    'user.read', // Can view user/student information
    'announcement.create', 'announcement.read',
    'document.create', 'document.read', 'document.update',
    'library.read'
  ];
  
  const instructorPermissions = await knex('permissions').whereIn('name', instructorPermissionNames).select('id');
  const instructorRolePermissions = instructorPermissions.map(p => ({
    role_id: instructorRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(instructorRolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  console.log(`✅ Instructor: ${instructorRolePermissions.length} permissions`);

  // ====== STUDENT: LEARNING PERMISSIONS ======
  const studentPermissionNames = [
    'course.read', 'course.enroll',
    'lesson.read',
    'quiz.read', 'quiz.attempt',
    'assignment.read', 'assignment.submit',
    'category.read',
    'payment.process',
    'pathway.read', 'pathway.apply',
    'library.read',
    'announcement.read',
    'certificate.read',
    'document.read'
  ];
  
  const studentPermissions = await knex('permissions').whereIn('name', studentPermissionNames).select('id');
  const studentRolePermissions = studentPermissions.map(p => ({
    role_id: studentRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(studentRolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  console.log(`✅ Student: ${studentRolePermissions.length} permissions`);

  // ====== USER: BASIC PERMISSIONS ======
  const userPermissionNames = [
    'course.read', 'course.enroll',
    'lesson.read',
    'quiz.read', 'quiz.attempt',
    'assignment.read', 'assignment.submit',
    'category.read',
    'library.read',
    'announcement.read',
    'shop_product.read',
    'document.read'
  ];
  
  const userPermissions = await knex('permissions').whereIn('name', userPermissionNames).select('id');
  const userRolePermissions = userPermissions.map(p => ({
    role_id: userRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(userRolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  console.log(`✅ User: ${userRolePermissions.length} permissions`);

  // ====== GUEST: READ-ONLY PERMISSIONS ======
  const guestPermissionNames = [
    'course.read',
    'category.read',
    'announcement.read',
    'shop_product.read'
  ];
  
  const guestPermissions = await knex('permissions').whereIn('name', guestPermissionNames).select('id');
  const guestRolePermissions = guestPermissions.map(p => ({
    role_id: guestRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(guestRolePermissions).onConflict(['role_id', 'permission_id']).ignore();
  console.log(`✅ Guest: ${guestRolePermissions.length} permissions`);

  // ============================================
  // 4. CREATE DEFAULT ADMIN USER
  // ============================================
  console.log('\n👤 Creating default admin user...');
  
  // Hash password
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // Check if admin already exists
  const existingAdmin = await knex('users').where('email', 'admin@skyta.space').first();

  if (!existingAdmin) {
    await knex('users').insert({
      username: 'admin',
      email: 'admin@skyta.space',
      password_hash: adminPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role_id: superAdminRole.id,
      is_active: true,
      is_verified: true,
      email_verified_at: new Date(),
      bio: 'System administrator with full access to all features',
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('✅ Default admin user created');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // ============================================
  // SEED COMPLETE
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('🎉 BASE SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log('\n📝 Default Admin Credentials:');
  console.log('━'.repeat(70));
  console.log('  Email:    admin@skyta.space');
  console.log('  Password: Admin@123');
  console.log('  Role:     Super Administrator');
  console.log('━'.repeat(70));
  console.log('\n📊 Summary:');
  console.log(`  ✅ ${permissions.length} permissions created`);
  console.log(`  ✅ ${roles.length} roles created`);
  console.log(`  ✅ All role-permission assignments completed`);
  console.log(`  ✅ Default admin user ready`);
  console.log('\n⚠️  IMPORTANT: Change the default admin password after first login!');
  console.log('='.repeat(70) + '\n');
};
