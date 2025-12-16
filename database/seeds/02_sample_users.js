/**
 * Sample Users Seed
 * Creates sample users for testing and demonstration
 */

const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  console.log('👥 Starting sample users seeding...');

  try {
    // Check if sample data already exists
    const existingUsers = await knex('users').where('username', 'like', 'sample_%').count('* as count').first();
    if (existingUsers && parseInt(existingUsers.count) > 0) {
      console.log('ℹ️  Sample users already exist. Skipping seed.');
      console.log('💡 To re-seed, first delete existing sample users or reset the database.');
      return;
    }

    // Get role IDs
    const roles = await knex('roles').select('id', 'name');
    const studentRoleId = roles.find(r => r.name === 'student')?.id;
    const instructorRoleId = roles.find(r => r.name === 'instructor')?.id;

    if (!studentRoleId || !instructorRoleId) {
      throw new Error('Required roles not found. Please run base seed first.');
    }

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create Sample Students (50 students)
    console.log('Creating sample students...');
    
    const students = [];
    for (let i = 1; i <= 50; i++) {
      const createdDaysAgo = Math.floor(Math.random() * 90); // Random date in last 90 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);

      students.push({
        username: `sample_student${i}`,
        email: `sample.student${i}@example.com`,
        password_hash: hashedPassword,
        first_name: `Student`,
        last_name: `${i}`,
        role_id: studentRoleId,
        is_active: true,
        is_verified: true,
        bio: `I'm a student passionate about learning and growing my skills.`,
        created_at: createdAt,
        updated_at: createdAt
      });
    }

    await knex('users').insert(students);
    console.log(`✓ Created ${students.length} students`);

    // Create Sample Instructors (20 instructors)
    console.log('Creating sample instructors...');
    
    const instructorNames = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
      'David Wilson', 'Lisa Anderson', 'James Taylor', 'Jennifer Martinez',
      'Robert Garcia', 'Mary Rodriguez', 'Christopher Lee', 'Patricia White',
      'Daniel Harris', 'Nancy Clark', 'Matthew Lewis', 'Karen Walker',
      'Anthony Hall', 'Betty Allen', 'Mark Young', 'Sandra King'
    ];

    const instructors = [];
    for (let i = 1; i <= 20; i++) {
      const [firstName, lastName] = instructorNames[i - 1].split(' ');
      const createdDaysAgo = Math.floor(Math.random() * 180); // Random date in last 180 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);

      instructors.push({
        username: `sample_instructor${i}`,
        email: `sample.instructor${i}@example.com`,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role_id: instructorRoleId,
        is_active: true,
        is_verified: true,
        bio: `Experienced educator with expertise in various subjects. Passionate about helping students succeed and making learning accessible to everyone.`,
        created_at: createdAt,
        updated_at: createdAt
      });
    }

    await knex('users').insert(instructors);
    console.log(`✓ Created ${instructors.length} instructors`);

    console.log('\n✅ Sample users seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total users created: ${students.length + instructors.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Instructors: ${instructors.length}`);
    console.log('\n🔑 Sample Login Credentials:');
    console.log('━'.repeat(70));
    console.log('   Instructor: sample.instructor1@example.com / Password123!');
    console.log('   Student:    sample.student1@example.com / Password123!');
    console.log('━'.repeat(70));
    console.log('\n💡 Note: Use these accounts for testing and demonstration purposes.');

  } catch (error) {
    console.error('❌ Error seeding sample users:', error);
    throw error;
  }
};
