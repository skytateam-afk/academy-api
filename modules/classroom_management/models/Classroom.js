const knex = require('../../../config/knex');

class Classroom {
  static async create(classroomData) {
    const [id] = await knex('classrooms').insert(classroomData);
    return this.findById(id);
  }

  static async findById(id) {
    const classroom = await knex('classrooms')
      .where('classrooms.id', id)
      .leftJoin('users as teacher', 'classrooms.class_teacher_id', 'teacher.id')
      .leftJoin('users as creator', 'classrooms.created_by', 'creator.id')
      .select(
        'classrooms.*',
        'teacher.username as teacher_username',
        'teacher.first_name as teacher_first_name',
        'teacher.last_name as teacher_last_name',
        'teacher.email as teacher_email',
        'creator.username as created_by_username'
      )
      .first();

    if (classroom) {
      // Get student count
      const studentCount = await knex('classroom_students')
        .where('classroom_id', id)
        .where('status', 'active')
        .count('* as count')
        .first();

      classroom.student_count = parseInt(studentCount.count) || 0;
    }

    return classroom;
  }

  static async findAll(filters = {}) {
    let query = knex('classrooms')
      .leftJoin('users as teacher', 'classrooms.class_teacher_id', 'teacher.id')
      .select(
        'classrooms.*',
        'teacher.username as teacher_username',
        'teacher.first_name as teacher_first_name',
        'teacher.last_name as teacher_last_name'
      );

    // Apply filters
    if (filters.search) {
      query = query.where(function () {
        this.where('classrooms.name', 'like', `%${filters.search}%`)
          .orWhere('classrooms.code', 'like', `%${filters.search}%`)
          .orWhere('classrooms.room_number', 'like', `%${filters.search}%`);
      });
    }

    if (filters.level) {
      query = query.where('classrooms.level', filters.level);
    }

    if (filters.type) {
      query = query.where('classrooms.type', filters.type);
    }

    if (filters.academic_year) {
      query = query.where('classrooms.academic_year', filters.academic_year);
    }

    if (filters.academic_term) {
      query = query.where('classrooms.academic_term', filters.academic_term);
    }

    if (filters.is_active !== undefined) {
      query = query.where('classrooms.is_active', filters.is_active);
    }

    if (filters.class_teacher_id) {
      query = query.where('classrooms.class_teacher_id', filters.class_teacher_id);
    }

    // Sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.orderBy(`classrooms.${sortBy}`, sortOrder);

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    // Create a separate count query without joins
    let countQuery = knex('classrooms');

    if (filters.search) {
      countQuery = countQuery.where(function () {
        this.where('classrooms.name', 'like', `%${filters.search}%`)
          .orWhere('classrooms.code', 'like', `%${filters.search}%`)
          .orWhere('classrooms.room_number', 'like', `%${filters.search}%`);
      });
    }
    if (filters.level) {
      countQuery = countQuery.where('classrooms.level', filters.level);
    }
    if (filters.type) {
      countQuery = countQuery.where('classrooms.type', filters.type);
    }
    if (filters.academic_year) {
      countQuery = countQuery.where('classrooms.academic_year', filters.academic_year);
    }
    if (filters.academic_term) {
      countQuery = countQuery.where('classrooms.academic_term', filters.academic_term);
    }
    if (filters.is_active !== undefined) {
      countQuery = countQuery.where('classrooms.is_active', filters.is_active);
    }
    if (filters.class_teacher_id) {
      countQuery = countQuery.where('classrooms.class_teacher_id', filters.class_teacher_id);
    }

    const [countResult] = await countQuery.count('* as total');
    const total = parseInt(countResult.total) || 0;

    const classrooms = await query.limit(limit).offset(offset);

    // Get student counts for all classrooms
    const classroomIds = classrooms.map(c => c.id);
    if (classroomIds.length > 0) {
      const studentCounts = await knex('classroom_students')
        .whereIn('classroom_id', classroomIds)
        .where('status', 'active')
        .groupBy('classroom_id')
        .select('classroom_id', knex.raw('COUNT(*) as count'));

      const countMap = {};
      studentCounts.forEach(sc => {
        countMap[sc.classroom_id] = parseInt(sc.count) || 0;
      });

      classrooms.forEach(classroom => {
        classroom.student_count = countMap[classroom.id] || 0;
      });
    }

    return {
      data: classrooms,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  static async update(id, classroomData) {
    await knex('classrooms')
      .where('id', id)
      .update({
        ...classroomData,
        updated_at: new Date()
      });
    return this.findById(id);
  }

  static async delete(id) {
    return knex('classrooms').where('id', id).delete();
  }

  static async findByCode(code) {
    return knex('classrooms').where('code', code).first();
  }

  // Student assignment methods
  static async assignStudent(classroomId, studentData) {
    const [result] = await knex('classroom_students').insert({
      classroom_id: classroomId,
      student_id: studentData.student_id,
      enrollment_number: studentData.enrollment_number,
      roll_number: studentData.roll_number,
      assigned_date: studentData.assigned_date || new Date(),      
      status: studentData.status || 'active',
      notes: studentData.notes,
      assigned_by: studentData.assigned_by
    }).returning('id');
    return this.findStudentAssignment(result.id);
  }

  static async findStudentAssignment(id) {
    return knex('classroom_students')
      .where('classroom_students.id', id)
      .leftJoin('users as student', 'classroom_students.student_id', 'student.id')
      .leftJoin('classrooms', 'classroom_students.classroom_id', 'classrooms.id')
      .select(
        'classroom_students.*',
        'student.username',
        'student.first_name',
        'student.last_name',
        'student.email',
        'student.avatar_url',
        'classrooms.name as classroom_name',
        'classrooms.code as classroom_code'
      )
      .first();
  }

  static async getClassroomStudents(classroomId, filters = {}) {
    let query = knex('classroom_students')
      .where('classroom_students.classroom_id', classroomId)
      .leftJoin('users as student', 'classroom_students.student_id', 'student.id')
      .select(
        'classroom_students.*',
        'student.username',
        'student.first_name',
        'student.last_name',
        'student.email',
        'student.phone',
        'student.avatar_url'
      );

    // Apply filters
    if (filters.search) {
      query = query.where(function () {
        this.where('student.username', 'like', `%${filters.search}%`)
          .orWhere('student.first_name', 'like', `%${filters.search}%`)
          .orWhere('student.last_name', 'like', `%${filters.search}%`)
          .orWhere('student.email', 'like', `%${filters.search}%`)
          .orWhere('classroom_students.enrollment_number', 'like', `%${filters.search}%`);
      });
    }

    if (filters.status) {
      query = query.where('classroom_students.status', filters.status);
    }

    // Sorting
    const sortBy = filters.sort_by || 'roll_number';
    const sortOrder = filters.sort_order || 'asc';

    if (sortBy === 'name') {
      query = query.orderBy('student.first_name', sortOrder).orderBy('student.last_name', sortOrder);
    } else if (sortBy === 'roll_number') {
      query = query.orderBy('classroom_students.roll_number', sortOrder);
    } else {
      query = query.orderBy(`classroom_students.${sortBy}`, sortOrder);
    }

    return query;
  }

  static async removeStudent(classroomId, studentId) {
    return knex('classroom_students')
      .where('classroom_id', classroomId)
      .where('student_id', studentId)
      .delete();
  }

  static async updateStudentAssignment(id, updateData) {
    await knex('classroom_students')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: new Date()
      });
    return this.findStudentAssignment(id);
  }

  static async bulkAssignStudents(classroomId, students, assignedBy) {
    const assignments = students.map(student => ({
      classroom_id: classroomId,
      student_id: student.student_id,
      enrollment_number: student.enrollment_number,
      roll_number: student.roll_number,
      assigned_date: student.assigned_date || new Date(),
      status: 'active',
      notes: student.notes,
      assigned_by: assignedBy
    }));

    await knex('classroom_students').insert(assignments);
    return this.getClassroomStudents(classroomId);
  }

  static async getStudentClassroom(studentId, academicYear) {
    let query = knex('classroom_students')
      .where('classroom_students.student_id', studentId)
      .where('classroom_students.status', 'active')
      .leftJoin('classrooms', 'classroom_students.classroom_id', 'classrooms.id')
      .leftJoin('users as teacher', 'classrooms.class_teacher_id', 'teacher.id')
      .select(
        'classroom_students.*',
        'classrooms.name as classroom_name',
        'classrooms.code as classroom_code',
        'classrooms.level',
        'classrooms.type',
        'classrooms.section',
        'classrooms.room_number',
        'classrooms.academic_year',
        'classrooms.academic_term',
        'teacher.username as teacher_username',
        'teacher.first_name as teacher_first_name',
        'teacher.last_name as teacher_last_name',
        'teacher.email as teacher_email'
      );

    if (academicYear) {
      query = query.where('classrooms.academic_year', academicYear);
    }

    return query.first();
  }

  static async getClassroomStatistics(classroomId) {
    const stats = await knex('classroom_students')
      .where('classroom_id', classroomId)
      .select(
        knex.raw('COUNT(*) as total_students'),
        knex.raw('SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active_students'),
        knex.raw('SUM(CASE WHEN status = "transferred" THEN 1 ELSE 0 END) as transferred_students'),
        knex.raw('SUM(CASE WHEN status = "withdrawn" THEN 1 ELSE 0 END) as withdrawn_students')
      )
      .first();

    return stats;
  }

  // Get student's active assignment in a specific academic year
  static async getStudentActiveAssignmentInYear(studentId, academicYear) {
    const assignment = await knex('classroom_students')
      .where('classroom_students.student_id', studentId)
      .where('classroom_students.status', 'active')
      .leftJoin('classrooms', 'classroom_students.classroom_id', 'classrooms.id')
      .where('classrooms.academic_year', academicYear)
      .select(
        'classroom_students.id',
        'classroom_students.classroom_id',
        'classroom_students.status',
        'classrooms.name as classroom_name',
        'classrooms.code as classroom_code',
        'classrooms.academic_year'
      )
      .first();

    return assignment;
  }

  // Update student assignment status (for transfers/promotions)
  static async updateStudentAssignmentStatus(assignmentId, status, notes) {
    const updateData = {
      status,
      updated_at: new Date()
    };

    if (notes) {
      updateData.notes = notes;
    }

    await knex('classroom_students')
      .where('id', assignmentId)
      .update(updateData);

    return this.findStudentAssignment(assignmentId);
  }

  // Teacher assignment methods
  static async assignTeacher(classroomId, teacherData) {
    const [result] = await knex('classroom_teachers').insert({
      classroom_id: classroomId,
      teacher_id: teacherData.teacher_id,
      is_primary: teacherData.is_primary || false,
      assigned_date: teacherData.assigned_date || new Date(),
      status: teacherData.status || 'active',
      notes: teacherData.notes,
      assigned_by: teacherData.assigned_by
    }).returning('id');
    return this.findTeacherAssignment(result.id);
  }

  static async findTeacherAssignment(id) {
    return knex('classroom_teachers')
      .where('classroom_teachers.id', id)
      .leftJoin('users as teacher', 'classroom_teachers.teacher_id', 'teacher.id')
      .leftJoin('classrooms', 'classroom_teachers.classroom_id', 'classrooms.id')
      .select(
        'classroom_teachers.*',
        'teacher.username',
        'teacher.first_name',
        'teacher.last_name',
        'teacher.email',
        'teacher.avatar_url',
        'teacher.bio',
        'classrooms.name as classroom_name',
        'classrooms.code as classroom_code'
      )
      .first();
  }

  static async getClassroomTeachers(classroomId, filters = {}) {
    let query = knex('classroom_teachers')
      .where('classroom_teachers.classroom_id', classroomId)
      .leftJoin('users as teacher', 'classroom_teachers.teacher_id', 'teacher.id')
      .select(
        'classroom_teachers.*',
        'teacher.username',
        'teacher.first_name',
        'teacher.last_name',
        'teacher.email',
        'teacher.phone',
        'teacher.avatar_url',
        'teacher.bio'
      );

    // Apply filters
    if (filters.search) {
      query = query.where(function () {
        this.where('teacher.username', 'like', `%${filters.search}%`)
          .orWhere('teacher.first_name', 'like', `%${filters.search}%`)
          .orWhere('teacher.last_name', 'like', `%${filters.search}%`)
          .orWhere('teacher.email', 'like', `%${filters.search}%`);
      });
    }

    if (filters.status) {
      query = query.where('classroom_teachers.status', filters.status);
    }

    if (filters.is_primary !== undefined) {
      query = query.where('classroom_teachers.is_primary', filters.is_primary);
    }

    // Sorting
    const sortBy = filters.sort_by || 'is_primary';
    const sortOrder = filters.sort_order || 'desc';

    if (sortBy === 'name') {
      query = query.orderBy('teacher.first_name', sortOrder).orderBy('teacher.last_name', sortOrder);
    } else if (sortBy === 'is_primary') {
      query = query.orderBy('classroom_teachers.is_primary', sortOrder).orderBy('teacher.first_name', 'asc');
    } else {
      query = query.orderBy(`classroom_teachers.${sortBy}`, sortOrder);
    }

    return query;
  }

  static async removeTeacher(classroomId, teacherId) {
    return knex('classroom_teachers')
      .where('classroom_id', classroomId)
      .where('teacher_id', teacherId)
      .delete();
  }

  static async bulkAssignTeachers(classroomId, teachers, assignedBy) {
    const assignments = teachers.map(teacher => ({
      classroom_id: classroomId,
      teacher_id: teacher.teacher_id,
      is_primary: teacher.is_primary || false,
      assigned_date: teacher.assigned_date || new Date(),
      status: 'active',
      notes: teacher.notes,
      assigned_by: assignedBy
    }));

    await knex('classroom_teachers').insert(assignments);
    return this.getClassroomTeachers(classroomId);
  }

  static async getAvailableTeachers(classroomId, filters = {}) {
    // Get teachers already assigned to this classroom
    const assignedTeacherIds = await knex('classroom_teachers')
      .where('classroom_id', classroomId)
      .where('status', 'active')
      .pluck('teacher_id');

    // Get instructor role ID
    const instructorRole = await knex('roles').where('name', 'instructor').first();
    if (!instructorRole) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0
        }
      };
    }

    let query = knex('users')
      .where('users.role_id', instructorRole.id)
      .where('users.is_active', true)
      .whereNotIn('users.id', assignedTeacherIds.length > 0 ? assignedTeacherIds : [0])
      .select(
        'users.id',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone',
        'users.avatar_url',
        'users.bio',
        'users.created_at'
      );

    // Apply search filter
    if (filters.search) {
      query = query.where(function () {
        this.where('users.username', 'like', `%${filters.search}%`)
          .orWhere('users.first_name', 'like', `%${filters.search}%`)
          .orWhere('users.last_name', 'like', `%${filters.search}%`)
          .orWhere('users.email', 'like', `%${filters.search}%`);
      });
    }

    // Sorting
    const sortBy = filters.sort_by || 'first_name';
    const sortOrder = filters.sort_order || 'asc';
    query = query.orderBy(`users.${sortBy}`, sortOrder);

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    // Count total available teachers
    let countQuery = knex('users')
      .where('users.role_id', instructorRole.id)
      .where('users.is_active', true)
      .whereNotIn('users.id', assignedTeacherIds.length > 0 ? assignedTeacherIds : [0]);

    if (filters.search) {
      countQuery = countQuery.where(function () {
        this.where('users.username', 'like', `%${filters.search}%`)
          .orWhere('users.first_name', 'like', `%${filters.search}%`)
          .orWhere('users.last_name', 'like', `%${filters.search}%`)
          .orWhere('users.email', 'like', `%${filters.search}%`);
      });
    }

    const [countResult] = await countQuery.count('* as total');
    const total = parseInt(countResult.total) || 0;

    const teachers = await query.limit(limit).offset(offset);

    return {
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = Classroom;
