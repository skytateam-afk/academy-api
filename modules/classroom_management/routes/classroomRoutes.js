const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

// Classroom CRUD operations
router.post(
  '/',
  authenticateToken,
  requirePermission('classroom.create'),
  classroomController.createValidation,
  classroomController.createClassroom.bind(classroomController)
);

router.get(
  '/',
  authenticateToken,
  requirePermission('classroom.read'),
  classroomController.getClassrooms.bind(classroomController)
);

// Get current user's own classroom (for students) - MUST come before /:id route
router.get(
  '/my-classroom',
  authenticateToken,
  classroomController.getMyClassroom.bind(classroomController)
);

router.get(
  '/:id',
  authenticateToken,
  requirePermission('classroom.read'),
  classroomController.getClassroomById.bind(classroomController)
);

router.put(
  '/:id',
  authenticateToken,
  requirePermission('classroom.update'),
  classroomController.updateValidation,
  classroomController.updateClassroom.bind(classroomController)
);

router.delete(
  '/:id',
  authenticateToken,
  requirePermission('classroom.delete'),
  classroomController.deleteClassroom.bind(classroomController)
);

// Student assignment operations
router.post(
  '/:id/students',
  authenticateToken,
  requirePermission('classroom.assign_students'),
  classroomController.assignStudentValidation,
  classroomController.assignStudent.bind(classroomController)
);

router.post(
  '/:id/students/bulk',
  authenticateToken,
  requirePermission('classroom.assign_students'),
  classroomController.bulkAssignValidation,
  classroomController.bulkAssignStudents.bind(classroomController)
);

router.get(
  '/:id/students',
  authenticateToken,
  requirePermission('classroom.read'),
  classroomController.getClassroomStudents.bind(classroomController)
);

router.delete(
  '/:id/students/:studentId',
  authenticateToken,
  requirePermission('classroom.assign_students'),
  classroomController.removeStudent.bind(classroomController)
);

router.put(
  '/assignments/:assignmentId',
  authenticateToken,
  requirePermission('classroom.assign_students'),
  classroomController.updateStudentAssignment.bind(classroomController)
);

// Transfer student to new classroom
router.post(
  '/students/:studentId/transfer',
  authenticateToken,
  requirePermission('classroom.assign_students'),
  classroomController.transferStudentValidation,
  classroomController.transferStudent.bind(classroomController)
);

// Get student's current classroom
router.get(
  '/students/:studentId/classroom',
  authenticateToken,
  requirePermission('classroom.read'),
  classroomController.getStudentClassroom.bind(classroomController)
);

// Classroom statistics
router.get(
  '/:id/statistics',
  authenticateToken,
  requirePermission('classroom.read'),
  classroomController.getClassroomStatistics.bind(classroomController)
);

// Teacher assignment operations
router.post(
  '/:id/teachers',
  authenticateToken,
  requirePermission('classroom.assign_teachers'),
  classroomController.assignTeacherValidation,
  classroomController.assignTeacher.bind(classroomController)
);

router.post(
  '/:id/teachers/bulk',
  authenticateToken,
  requirePermission('classroom.assign_teachers'),
  classroomController.bulkAssignTeachersValidation,
  classroomController.bulkAssignTeachers.bind(classroomController)
);

router.get(
  '/:id/teachers',
  authenticateToken,
  requirePermission('classroom.read'),
  classroomController.getClassroomTeachers.bind(classroomController)
);

router.get(
  '/:id/teachers/available',
  authenticateToken,
  requirePermission('classroom.read'),
  classroomController.getAvailableTeachers.bind(classroomController)
);

router.delete(
  '/:id/teachers/:teacherId',
  authenticateToken,
  requirePermission('classroom.assign_teachers'),
  classroomController.removeTeacher.bind(classroomController)
);

module.exports = router;
