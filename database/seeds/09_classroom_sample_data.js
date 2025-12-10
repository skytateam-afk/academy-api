/**
 * Classroom Sample Data Seed
 * Creates sample classrooms with teacher and student assignments
 */

exports.seed = async function(knex) {
  console.log('🌱 Starting classroom sample data seeding...');

  try {
    // Check if classroom data already exists
    const existingClassrooms = await knex('classrooms').count('* as count').first();
    if (existingClassrooms && parseInt(existingClassrooms.count) > 0) {
      console.log('ℹ️  Classroom data already exists. Skipping seed.');
      console.log('💡 To re-seed, first delete existing classroom data or reset the database.');
      return;
    }

    // Get instructor users (teachers)
    const teachers = await knex('users')
      .join('roles', 'users.role_id', 'roles.id')
      .where('roles.name', 'instructor')
      .where('users.is_active', true)
      .select('users.id', 'users.username', 'users.first_name', 'users.last_name', 'users.email')
      .orderBy('users.created_at', 'asc');

    if (teachers.length === 0) {
      console.log('⚠️  No teachers found. Please run user seeds first.');
      return;
    }

    // Get student users
    const students = await knex('users')
      .join('roles', 'users.role_id', 'roles.id')
      .where('roles.name', 'student')
      .where('users.is_active', true)
      .select('users.id', 'users.username', 'users.first_name', 'users.last_name', 'users.email')
      .orderBy('users.created_at', 'asc');

    if (students.length === 0) {
      console.log('⚠️  No students found. Please run user seeds first.');
      return;
    }

    // Get admin user for created_by
    const adminUser = await knex('users')
      .join('roles', 'users.role_id', 'roles.id')
      .where('roles.name', 'admin')
      .where('users.is_active', true)
      .select('users.id')
      .first();

    if (!adminUser) {
      console.log('⚠️  No admin user found. Looking for any user with admin permissions...');
      // Try to find any user
      const anyUser = await knex('users')
        .where('users.is_active', true)
        .select('users.id')
        .first();
      
      if (!anyUser) {
        console.log('⚠️  No users found at all. Please run user seeds first.');
        return;
      }
      console.log('ℹ️  Using first available user as creator.');
      var createdBy = anyUser.id;
    } else {
      var createdBy = adminUser.id;
    }

    const currentYear = new Date().getFullYear();

    // 1. Create Secondary School Classrooms (JSS & SS)
    console.log('Creating secondary school classrooms...');
    
    const secondaryLevels = [
      { level: 'jss1', name: 'JSS 1' },
      { level: 'jss2', name: 'JSS 2' },
      { level: 'jss3', name: 'JSS 3' },
      { level: 'ss1', name: 'SS 1' },
      { level: 'ss2', name: 'SS 2' },
      { level: 'ss3', name: 'SS 3' }
    ];

    const sections = ['A', 'B', 'C'];
    const secondaryClassrooms = [];
    let classroomIndex = 0;

    for (const levelData of secondaryLevels) {
      for (const section of sections) {
        const classroom = {
          name: `${levelData.name}${section}`,
          code: `${levelData.level.toUpperCase()}-${section}-${currentYear}`,
          level: levelData.level,
          type: 'secondary',
          section: section,
          capacity: 40,
          academic_year: currentYear,
          academic_term: 'First Term',
          class_teacher_id: teachers[classroomIndex % teachers.length].id,
          room_number: `R-${100 + classroomIndex}`,
          description: `${levelData.name} Section ${section} - Academic Year ${currentYear}`,
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        };
        secondaryClassrooms.push(classroom);
        classroomIndex++;
      }
    }

    // 2. Create University Classrooms (Year 1-4)
    console.log('Creating university classrooms...');
    
    const universityLevels = [
      { level: 'year1', name: 'Year 1' },
      { level: 'year2', name: 'Year 2' },
      { level: 'year3', name: 'Year 3' },
      { level: 'year4', name: 'Year 4' }
    ];

    const universitySections = ['A', 'B'];
    const universityClassrooms = [];

    for (const levelData of universityLevels) {
      for (const section of universitySections) {
        const classroom = {
          name: `${levelData.name}${section}`,
          code: `${levelData.level.toUpperCase()}-${section}-${currentYear}`,
          level: levelData.level,
          type: 'university',
          section: section,
          capacity: 50,
          academic_year: currentYear,
          academic_term: 'Semester 1',
          class_teacher_id: teachers[classroomIndex % teachers.length].id,
          room_number: `LH-${200 + classroomIndex}`,
          description: `${levelData.name} Section ${section} - Academic Year ${currentYear}`,
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        };
        universityClassrooms.push(classroom);
        classroomIndex++;
      }
    }

    // 3. Create Special/Other Classrooms
    console.log('Creating special classrooms...');
    
    const otherClassrooms = [
      {
        name: 'Advanced Mathematics Class',
        code: `ADVMATH-${currentYear}`,
        level: 'other',
        type: 'other',
        section: null,
        capacity: 30,
        academic_year: currentYear,
        academic_term: 'First Term',
        class_teacher_id: teachers[0].id,
        room_number: 'R-301',
        description: 'Special advanced mathematics program for gifted students',
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Computer Science Lab',
        code: `CSLAB-${currentYear}`,
        level: 'other',
        type: 'other',
        section: null,
        capacity: 35,
        academic_year: currentYear,
        academic_term: 'First Term',
        class_teacher_id: teachers[1 % teachers.length].id,
        room_number: 'LAB-1',
        description: 'Computer science practical sessions and programming classes',
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert all classrooms
    const allClassrooms = [...secondaryClassrooms, ...universityClassrooms, ...otherClassrooms];
    await knex('classrooms').insert(allClassrooms);
    console.log(`✓ Created ${allClassrooms.length} classrooms`);

    // Get inserted classrooms with IDs
    const insertedClassrooms = await knex('classrooms').select('id', 'name', 'code', 'capacity', 'type');

    // 4. Assign multiple teachers to classrooms
    console.log('Assigning teachers to classrooms...');
    const classroomTeachers = [];

    for (const classroom of insertedClassrooms) {
      // Each classroom gets 2-4 teachers
      const numTeachers = Math.floor(Math.random() * 3) + 2; // 2-4 teachers
      const assignedTeachers = new Set();
      
      for (let i = 0; i < numTeachers && assignedTeachers.size < numTeachers; i++) {
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        
        if (!assignedTeachers.has(teacher.id)) {
          assignedTeachers.add(teacher.id);
          
          classroomTeachers.push({
            classroom_id: classroom.id,
            teacher_id: teacher.id,
            is_primary: assignedTeachers.size === 1, // First teacher is primary
            assigned_date: new Date(),
            status: 'active',
            notes: assignedTeachers.size === 1 ? 'Primary/Form Teacher' : 'Subject Teacher',
            assigned_by: createdBy,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    await knex('classroom_teachers').insert(classroomTeachers);
    console.log(`✓ Assigned ${classroomTeachers.length} teacher assignments`);

    // 5. Assign students to classrooms
    console.log('Assigning students to classrooms...');
    const classroomStudents = [];
    let studentIndex = 0;

    for (const classroom of insertedClassrooms) {
      // Assign 15-30 students per classroom (not exceeding capacity)
      const numStudents = Math.min(
        Math.floor(Math.random() * 16) + 15, // 15-30 students
        classroom.capacity || 40,
        students.length - studentIndex
      );

      for (let i = 0; i < numStudents && studentIndex < students.length; i++) {
        const student = students[studentIndex];
        
        classroomStudents.push({
          classroom_id: classroom.id,
          student_id: student.id,
          enrollment_number: `ENR${currentYear}${String(studentIndex + 1).padStart(4, '0')}`,
          roll_number: i + 1,
          assigned_date: new Date(),
          status: 'active',
          notes: null,
          assigned_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        studentIndex++;
      }
    }

    await knex('classroom_students').insert(classroomStudents);
    console.log(`✓ Assigned ${classroomStudents.length} student assignments`);

    console.log('\n✅ Classroom sample data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Classrooms: ${allClassrooms.length}`);
    console.log(`     • Secondary: ${secondaryClassrooms.length}`);
    console.log(`     • University: ${universityClassrooms.length}`);
    console.log(`     • Other: ${otherClassrooms.length}`);
    console.log(`   - Teacher assignments: ${classroomTeachers.length}`);
    console.log(`   - Student assignments: ${classroomStudents.length}`);
    console.log(`   - Available teachers: ${teachers.length}`);
    console.log(`   - Available students: ${students.length}`);

  } catch (error) {
    console.error('❌ Error seeding classroom data:', error);
    throw error;
  }
};
