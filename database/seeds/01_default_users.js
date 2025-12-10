/**
 * Seed Default Users
 * Creates default admin and sample user accounts
 */

const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Get roles
  const superAdminRole = await knex('roles').where('name', 'super_admin').first();
  const instructorRole = await knex('roles').where('name', 'instructor').first();
  const studentRole = await knex('roles').where('name', 'student').first();

  if (!superAdminRole || !instructorRole || !studentRole) {
    throw new Error('Roles not found. Please run permissions and roles seed first.');
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@2024!', 10);
  const instructorPassword = await bcrypt.hash('Instructor@2024!', 10);
  const studentPassword = await bcrypt.hash('Student@2024!', 10);

  // Check if users already exist
  const existingAdmin = await knex('users').where('email', 'admin@topuniverse.org').first();
  const existingInstructor = await knex('users').where('email', 'instructor@topuniverse.org').first();
  const existingStudent = await knex('users').where('email', 'student@topuniverse.org').first();

  // Insert default admin if doesn't exist
  if (!existingAdmin) {
    await knex('users').insert({
      username: 'admin',
      email: 'admin@topuniverse.org',
      password_hash: adminPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role_id: superAdminRole.id,
      is_active: true,
      is_verified: true,
      email_verified_at: knex.fn.now(),
      bio: 'System administrator with full access to all features',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    console.log('✅ Default admin user created');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Insert default instructor if doesn't exist
  if (!existingInstructor) {
    await knex('users').insert({
      username: 'instructor_demo',
      email: 'instructor@topuniverse.org',
      password_hash: instructorPassword,
      first_name: 'Demo',
      last_name: 'Instructor',
      role_id: instructorRole.id,
      is_active: true,
      is_verified: true,
      email_verified_at: knex.fn.now(),
      bio: 'Sample instructor account for testing and demonstration',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    console.log('✅ Default instructor user created');
  } else {
    console.log('ℹ️  Instructor user already exists');
  }

  // Insert default student if doesn't exist
  if (!existingStudent) {
    await knex('users').insert({
      username: 'student_demo',
      email: 'student@topuniverse.org',
      password_hash: studentPassword,
      first_name: 'Demo',
      last_name: 'Student',
      role_id: studentRole.id,
      is_active: true,
      is_verified: true,
      email_verified_at: knex.fn.now(),
      bio: 'Sample student account for testing and demonstration',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    console.log('✅ Default student user created');
  } else {
    console.log('ℹ️  Student user already exists');
  }

  console.log('\n📝 Default User Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Account:');
  console.log('  Email: admin@topuniverse.org');
  console.log('  Password: Admin@2024!');
  console.log('  Role: Super Administrator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Instructor Account:');
  console.log('  Email: instructor@topuniverse.org');
  console.log('  Password: Instructor@2024!');
  console.log('  Role: Instructor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Student Account:');
  console.log('  Email: student@topuniverse.org');
  console.log('  Password: Student@2024!');
  console.log('  Role: Student');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};
