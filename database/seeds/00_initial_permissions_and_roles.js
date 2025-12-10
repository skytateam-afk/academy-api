/**
 * Seed: Initial Permissions and Roles
 * Seeds default permissions and roles for the SchoolBox system
 */

exports.seed = async function(knex) {
  // ============================================
  // Insert default permissions
  // ============================================
  await knex('permissions').insert([
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
    { name: 'pathway.review', resource: 'pathway', action: 'review', description: 'Review and approve/reject pathway applications' }
  ]).onConflict(['resource', 'action']).ignore();

  // ============================================
  // Insert default roles
  // ============================================
  await knex('roles').insert([
    { name: 'super_admin', description: 'Super Administrator with full system access', is_system_role: true },
    { name: 'admin', description: 'Administrator with management access', is_system_role: true },
    { name: 'instructor', description: 'Course instructor who can create and manage courses', is_system_role: true },
    { name: 'student', description: 'Student who can enroll in and take courses', is_system_role: true },
    { name: 'user', description: 'Regular user who can view and enroll in courses', is_system_role: true },
    { name: 'guest', description: 'Guest user with limited read access', is_system_role: true }
  ]).onConflict('name').ignore();

  // ============================================
  // Assign permissions to roles
  // ============================================
  
  // Get role IDs
  const superAdminRole = await knex('roles').where('name', 'super_admin').first();
  const adminRole = await knex('roles').where('name', 'admin').first();
  const instructorRole = await knex('roles').where('name', 'instructor').first();
  const studentRole = await knex('roles').where('name', 'student').first();
  const userRole = await knex('roles').where('name', 'user').first();
  const guestRole = await knex('roles').where('name', 'guest').first();

  // Get all permissions
  const allPermissions = await knex('permissions').select('id');

  // Assign all permissions to super_admin
  const superAdminPermissions = allPermissions.map(p => ({
    role_id: superAdminRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(superAdminPermissions).onConflict(['role_id', 'permission_id']).ignore();

  // Assign admin permissions
  const adminPermissionNames = [
    'user.create', 'user.read', 'user.update', 'user.delete',
    'course.create', 'course.read', 'course.update', 'course.delete', 'course.publish',
    'lesson.create', 'lesson.read', 'lesson.update', 'lesson.delete',
    'quiz.create', 'quiz.read', 'quiz.update', 'quiz.delete', 'quiz.grade',
    'assignment.create', 'assignment.read', 'assignment.update', 'assignment.delete', 'assignment.grade',
    'category.create', 'category.read', 'category.update', 'category.delete',
    'role.read', 'payment.view', 'payment.refund', 'analytics.view',
    'parent.read', 'parent.create', 'parent.update', 'parent.delete', 'parent.manage_students',
    'pathway.create', 'pathway.read', 'pathway.update', 'pathway.delete', 'pathway.publish', 'pathway.review'
  ];
  const adminPermissions = await knex('permissions').whereIn('name', adminPermissionNames).select('id');
  const adminRolePermissions = adminPermissions.map(p => ({
    role_id: adminRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(adminRolePermissions).onConflict(['role_id', 'permission_id']).ignore();

  // Assign instructor permissions
  const instructorPermissionNames = [
    'course.create', 'course.read', 'course.update', 'course.publish',
    'lesson.create', 'lesson.read', 'lesson.update', 'lesson.delete',
    'quiz.create', 'quiz.read', 'quiz.update', 'quiz.delete', 'quiz.grade',
    'assignment.create', 'assignment.read', 'assignment.update', 'assignment.delete', 'assignment.grade',
    'category.read', 'analytics.view'
  ];
  const instructorPermissions = await knex('permissions').whereIn('name', instructorPermissionNames).select('id');
  const instructorRolePermissions = instructorPermissions.map(p => ({
    role_id: instructorRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(instructorRolePermissions).onConflict(['role_id', 'permission_id']).ignore();

  // Assign student permissions
  const studentPermissionNames = [
    'course.read', 'course.enroll',
    'lesson.read',
    'quiz.read', 'quiz.attempt',
    'assignment.read', 'assignment.submit',
    'category.read', 'payment.process'
  ];
  const studentPermissions = await knex('permissions').whereIn('name', studentPermissionNames).select('id');
  const studentRolePermissions = studentPermissions.map(p => ({
    role_id: studentRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(studentRolePermissions).onConflict(['role_id', 'permission_id']).ignore();

  // Assign user permissions (regular users who can view, enroll, and access library)
  const userPermissionNames = [
    'course.read', 'course.enroll',
    'lesson.read',
    'quiz.read', 'quiz.attempt',
    'assignment.read', 'assignment.submit',
    'category.read',
    'library.read' // Access to library
  ];
  const userPermissions = await knex('permissions').whereIn('name', userPermissionNames).select('id');
  const userRolePermissions = userPermissions.map(p => ({
    role_id: userRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(userRolePermissions).onConflict(['role_id', 'permission_id']).ignore();

  // Assign guest permissions
  const guestPermissionNames = [
    'course.read',
    'category.read'
  ];
  const guestPermissions = await knex('permissions').whereIn('name', guestPermissionNames).select('id');
  const guestRolePermissions = guestPermissions.map(p => ({
    role_id: guestRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(guestRolePermissions).onConflict(['role_id', 'permission_id']).ignore();
};
