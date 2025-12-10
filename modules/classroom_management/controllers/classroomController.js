const classroomRepository = require('../repositories/classroomRepository');
const { body, param, query, validationResult } = require('express-validator');

class ClassroomController {
  constructor() {
    // Validation rules as instance properties
    this.createValidation = [
      body('name').trim().notEmpty().withMessage('Classroom name is required'),
      body('code').trim().notEmpty().withMessage('Classroom code is required'),
      body('level').isIn(['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3', 'year1', 'year2', 'year3', 'year4', 'year5', 'other']).withMessage('Invalid level'),
      body('type').optional().isIn(['secondary', 'university', 'other']).withMessage('Invalid type'),
      body('section').optional().trim(),
      body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
      body('academic_year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid academic year'),
      body('academic_term').optional().trim(),
      body('class_teacher_id').optional().isUUID().withMessage('Invalid teacher ID'),
      body('room_number').optional().trim(),
      body('description').optional().trim(),
      body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
    ];

    this.updateValidation = [
      param('id').isInt().withMessage('Invalid classroom ID'),
      body('name').optional().trim().notEmpty().withMessage('Classroom name cannot be empty'),
      body('code').optional().trim().notEmpty().withMessage('Classroom code cannot be empty'),
      body('level').optional().isIn(['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3', 'year1', 'year2', 'year3', 'year4', 'year5', 'other']).withMessage('Invalid level'),
      body('type').optional().isIn(['secondary', 'university', 'other']).withMessage('Invalid type'),
      body('section').optional().trim(),
      body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
      body('academic_year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid academic year'),
      body('academic_term').optional().trim(),
      body('class_teacher_id').optional().isUUID().withMessage('Invalid teacher ID'),
      body('room_number').optional().trim(),
      body('description').optional().trim(),
      body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
    ];

    this.assignStudentValidation = [
      param('id').isInt().withMessage('Invalid classroom ID'),
      body('student_id').isUUID().withMessage('Invalid student ID'),
      body('enrollment_number').optional().trim(),
      body('roll_number').optional().isInt({ min: 1 }).withMessage('Roll number must be a positive integer'),
      body('notes').optional().trim()
    ];

    this.bulkAssignValidation = [
      param('id').isInt().withMessage('Invalid classroom ID'),
      body('students').isArray({ min: 1 }).withMessage('Students array is required and must not be empty'),
      body('students.*.student_id').isUUID().withMessage('Invalid student ID'),
      body('students.*.enrollment_number').optional().trim(),
      body('students.*.roll_number').optional().isInt({ min: 1 }).withMessage('Roll number must be a positive integer')
    ];

    this.assignTeacherValidation = [
      param('id').isInt().withMessage('Invalid classroom ID'),
      body('teacher_id').isUUID().withMessage('Invalid teacher ID'),
      body('is_primary').optional().isBoolean().withMessage('is_primary must be a boolean'),
      body('notes').optional().trim()
    ];

    this.bulkAssignTeachersValidation = [
      param('id').isInt().withMessage('Invalid classroom ID'),
      body('teachers').isArray({ min: 1 }).withMessage('Teachers array is required and must not be empty'),
      body('teachers.*.teacher_id').isUUID().withMessage('Invalid teacher ID'),
      body('teachers.*.is_primary').optional().isBoolean().withMessage('is_primary must be a boolean'),
      body('teachers.*.notes').optional().trim()
    ];

    this.transferStudentValidation = [
      param('id').isInt().withMessage('Invalid classroom ID (target classroom)'),
      body('student_id').isUUID().withMessage('Invalid student ID'),
      body('reason').optional().isIn(['transfer', 'promotion']).withMessage('Reason must be either transfer or promotion'),
      body('enrollment_number').optional().trim(),
      body('roll_number').optional().isInt({ min: 1 }).withMessage('Roll number must be a positive integer'),
      body('notes').optional().trim(),
      body('transfer_notes').optional().trim()
    ];
  }

  // Create a new classroom
  async createClassroom(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if code already exists
      const existingClassroom = await classroomRepository.getClassroomByCode(req.body.code);
      if (existingClassroom) {
        return res.status(400).json({
          message: 'A classroom with this code already exists'
        });
      }

      const classroom = await classroomRepository.createClassroom(req.body, req.user.userId);

      res.status(201).json({
        message: 'Classroom created successfully',
        data: classroom
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all classrooms with filters and pagination
  async getClassrooms(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        level: req.query.level,
        type: req.query.type,
        academic_year: req.query.academic_year,
        academic_term: req.query.academic_term,
        is_active: req.query.is_active,
        class_teacher_id: req.query.class_teacher_id,
        page: req.query.page,
        limit: req.query.limit,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      const result = await classroomRepository.getAllClassrooms(filters);

      res.json({
        message: 'Classrooms retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single classroom by ID
  async getClassroomById(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);

      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      res.json({
        message: 'Classroom retrieved successfully',
        data: classroom
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a classroom
  async updateClassroom(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if classroom exists
      const existingClassroom = await classroomRepository.getClassroomById(req.params.id);
      if (!existingClassroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      // Check if code is being updated and already exists
      if (req.body.code && req.body.code !== existingClassroom.code) {
        const codeExists = await classroomRepository.getClassroomByCode(req.body.code);
        if (codeExists) {
          return res.status(400).json({
            message: 'A classroom with this code already exists'
          });
        }
      }

      const classroom = await classroomRepository.updateClassroom(
        req.params.id,
        req.body,
        req.user.userId
      );

      res.json({
        message: 'Classroom updated successfully',
        data: classroom
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a classroom
  async deleteClassroom(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);

      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      // Check if classroom has students
      if (classroom.student_count > 0) {
        return res.status(400).json({
          message: 'Cannot delete classroom with assigned students. Please remove all students first.'
        });
      }

      await classroomRepository.deleteClassroom(req.params.id);

      res.json({
        message: 'Classroom deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Assign a student to a classroom
  async assignStudent(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      // Check if student already has an active assignment in the same academic year
      const existingAssignment = await classroomRepository.getStudentActiveAssignmentInYear(
        req.body.student_id,
        classroom.academic_year
      );

      if (existingAssignment) {
        return res.status(400).json({
          message: `Student is already assigned to classroom "${existingAssignment.classroom_name}" (${existingAssignment.classroom_code}) for academic year ${classroom.academic_year}. Please transfer or complete the current assignment first.`,
          current_classroom: {
            id: existingAssignment.classroom_id,
            name: existingAssignment.classroom_name,
            code: existingAssignment.classroom_code,
            academic_year: existingAssignment.academic_year
          }
        });
      }

      // Check capacity if set
      if (classroom.capacity && classroom.student_count >= classroom.capacity) {
        return res.status(400).json({
          message: 'Classroom has reached maximum capacity'
        });
      }

      const assignment = await classroomRepository.assignStudentToClassroom(
        req.params.id,
        req.body,
        req.user.userId
      );

      res.status(201).json({
        message: 'Student assigned to classroom successfully',
        data: assignment
      });
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return res.status(400).json({
          message: 'Student is already assigned to this classroom'
        });
      }
      next(error);
    }
  }

  // Get all students in a classroom
  async getClassroomStudents(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      const filters = {
        search: req.query.search,
        status: req.query.status,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      const students = await classroomRepository.getClassroomStudents(req.params.id, filters);

      res.json({
        message: 'Classroom students retrieved successfully',
        data: students
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove a student from a classroom
  async removeStudent(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      await classroomRepository.removeStudentFromClassroom(
        req.params.id,
        req.params.studentId
      );

      res.json({
        message: 'Student removed from classroom successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update student assignment (roll number, enrollment number, etc.)
  async updateStudentAssignment(req, res, next) {
    try {
      const assignment = await classroomRepository.updateStudentAssignment(
        req.params.assignmentId,
        req.body
      );

      if (!assignment) {
        return res.status(404).json({
          message: 'Assignment not found'
        });
      }

      res.json({
        message: 'Student assignment updated successfully',
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk assign students to a classroom
  async bulkAssignStudents(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      // Check capacity if set
      if (classroom.capacity) {
        const newTotal = classroom.student_count + req.body.students.length;
        if (newTotal > classroom.capacity) {
          return res.status(400).json({
            message: `Cannot assign students. Classroom capacity (${classroom.capacity}) would be exceeded. Current: ${classroom.student_count}, Adding: ${req.body.students.length}`
          });
        }
      }

      const students = await classroomRepository.bulkAssignStudents(
        req.params.id,
        req.body.students,
        req.user.userId
      );

      res.status(201).json({
        message: 'Students assigned to classroom successfully',
        data: students
      });
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return res.status(400).json({
          message: 'One or more students are already assigned to this classroom'
        });
      }
      next(error);
    }
  }

  // Get student's current classroom
  async getStudentClassroom(req, res, next) {
    try {
      const classroom = await classroomRepository.getStudentCurrentClassroom(
        req.params.studentId,
        req.query.academic_year
      );

      if (!classroom) {
        return res.status(404).json({
          message: 'Student is not assigned to any classroom'
        });
      }

      res.json({
        message: 'Student classroom retrieved successfully',
        data: classroom
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user's classroom (for students to view their own)
  async getMyClassroom(req, res, next) {
    try {
      const studentId = req.user.userId;
      
      // Get student's classroom assignment
      const assignment = await classroomRepository.getStudentCurrentClassroom(
        studentId,
        req.query.academic_year
      );

      if (!assignment) {
        return res.status(404).json({
          message: 'You are not assigned to any classroom'
        });
      }

      // Get complete classroom details
      const classroom = await classroomRepository.getClassroomById(assignment.classroom_id);
      
      // Get teachers and students
      const teachers = await classroomRepository.getClassroomTeachers(assignment.classroom_id, { status: 'active' });
      const students = await classroomRepository.getClassroomStudents(assignment.classroom_id, { status: 'active' });

      // Remove sensitive information from students (for privacy)
      const sanitizedStudents = students.map(student => ({
        id: student.id, // assignment id, not student_id
        username: student.username,
        first_name: student.first_name,
        last_name: student.last_name,
        avatar_url: student.avatar_url,
        roll_number: student.roll_number,
        enrollment_number: student.enrollment_number,
        assigned_date: student.assigned_date,
        status: student.status
        // Excluded: student_id, email, phone for privacy
      }));

      // Build complete response with student's personal assignment info
      const response = {
        ...classroom,
        teachers,
        students: sanitizedStudents,
        my_enrollment_number: assignment.enrollment_number,
        my_roll_number: assignment.roll_number,
        my_assignment_id: assignment.id
      };

      res.json({
        message: 'Your classroom retrieved successfully',
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  // Get classroom statistics
  async getClassroomStatistics(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      const stats = await classroomRepository.getClassroomStatistics(req.params.id);

      res.json({
        message: 'Classroom statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Assign a teacher to a classroom
  async assignTeacher(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      const assignment = await classroomRepository.assignTeacherToClassroom(
        req.params.id,
        req.body,
        req.user.userId
      );

      res.status(201).json({
        message: 'Teacher assigned to classroom successfully',
        data: assignment
      });
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return res.status(400).json({
          message: 'Teacher is already assigned to this classroom'
        });
      }
      next(error);
    }
  }

  // Get all teachers in a classroom
  async getClassroomTeachers(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      const filters = {
        search: req.query.search,
        status: req.query.status,
        is_primary: req.query.is_primary,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      const teachers = await classroomRepository.getClassroomTeachers(req.params.id, filters);

      res.json({
        message: 'Classroom teachers retrieved successfully',
        data: teachers
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove a teacher from a classroom
  async removeTeacher(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      await classroomRepository.removeTeacherFromClassroom(
        req.params.id,
        req.params.teacherId
      );

      res.json({
        message: 'Teacher removed from classroom successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk assign teachers to a classroom
  async bulkAssignTeachers(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      const teachers = await classroomRepository.bulkAssignTeachers(
        req.params.id,
        req.body.teachers,
        req.user.userId
      );

      res.status(201).json({
        message: 'Teachers assigned to classroom successfully',
        data: teachers
      });
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return res.status(400).json({
          message: 'One or more teachers are already assigned to this classroom'
        });
      }
      next(error);
    }
  }

  // Get available teachers (not yet assigned to this classroom)
  async getAvailableTeachers(req, res, next) {
    try {
      const classroom = await classroomRepository.getClassroomById(req.params.id);
      if (!classroom) {
        return res.status(404).json({
          message: 'Classroom not found'
        });
      }

      const filters = {
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      const result = await classroomRepository.getAvailableTeachers(req.params.id, filters);

      res.json({
        message: 'Available teachers retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Transfer/Promote student to a new classroom
  async transferStudent(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const newClassroom = await classroomRepository.getClassroomById(req.params.id);
      if (!newClassroom) {
        return res.status(404).json({
          message: 'Target classroom not found'
        });
      }

      const studentId = req.body.student_id;

      // Get current active assignment
      const currentAssignment = await classroomRepository.getStudentActiveAssignmentInYear(
        studentId,
        newClassroom.academic_year
      );

      if (currentAssignment) {
        // Check if trying to transfer to the same classroom
        if (currentAssignment.classroom_id === newClassroom.id) {
          return res.status(400).json({
            message: 'Student is already in this classroom'
          });
        }

        // Mark old assignment as transferred or completed based on the reason
        const transferReason = req.body.reason || 'transferred';
        const newStatus = transferReason === 'promotion' ? 'completed' : 'transferred';

        await classroomRepository.updateStudentAssignmentStatus(
          currentAssignment.id,
          newStatus,
          req.body.transfer_notes
        );
      }

      // Check capacity of new classroom
      if (newClassroom.capacity && newClassroom.student_count >= newClassroom.capacity) {
        return res.status(400).json({
          message: 'Target classroom has reached maximum capacity'
        });
      }

      // Assign to new classroom
      const newAssignment = await classroomRepository.assignStudentToClassroom(
        req.params.id,
        {
          student_id: studentId,
          enrollment_number: req.body.enrollment_number,
          roll_number: req.body.roll_number,
          notes: req.body.notes || `Transferred from ${currentAssignment ? currentAssignment.classroom_name : 'previous classroom'}`
        },
        req.user.userId
      );

      res.status(201).json({
        message: currentAssignment ? 'Student transferred successfully' : 'Student assigned successfully',
        data: newAssignment,
        previous_classroom: currentAssignment ? {
          id: currentAssignment.classroom_id,
          name: currentAssignment.classroom_name,
          code: currentAssignment.classroom_code,
          status: currentAssignment.status
        } : null
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClassroomController();
