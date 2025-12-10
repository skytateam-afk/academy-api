const Classroom = require('../models/Classroom');

class ClassroomRepository {
  async createClassroom(classroomData, userId) {
    return Classroom.create({
      ...classroomData,
      created_by: userId,
      updated_by: userId
    });
  }

  async getClassroomById(id) {
    return Classroom.findById(id);
  }

  async getAllClassrooms(filters) {
    return Classroom.findAll(filters);
  }

  async updateClassroom(id, classroomData, userId) {
    return Classroom.update(id, {
      ...classroomData,
      updated_by: userId
    });
  }

  async deleteClassroom(id) {
    return Classroom.delete(id);
  }

  async getClassroomByCode(code) {
    return Classroom.findByCode(code);
  }

  // Student assignment methods
  async assignStudentToClassroom(classroomId, studentData, userId) {
    return Classroom.assignStudent(classroomId, {
      ...studentData,
      assigned_by: userId
    });
  }

  async getClassroomStudents(classroomId, filters = {}) {
    return Classroom.getClassroomStudents(classroomId, filters);
  }

  async removeStudentFromClassroom(classroomId, studentId) {
    return Classroom.removeStudent(classroomId, studentId);
  }

  async updateStudentAssignment(assignmentId, updateData) {
    return Classroom.updateStudentAssignment(assignmentId, updateData);
  }

  async bulkAssignStudents(classroomId, students, userId) {
    return Classroom.bulkAssignStudents(classroomId, students, userId);
  }

  async getStudentCurrentClassroom(studentId, academicYear) {
    return Classroom.getStudentClassroom(studentId, academicYear);
  }

  async getClassroomStatistics(classroomId) {
    return Classroom.getClassroomStatistics(classroomId);
  }

  // Teacher assignment methods
  async assignTeacherToClassroom(classroomId, teacherData, userId) {
    return Classroom.assignTeacher(classroomId, {
      ...teacherData,
      assigned_by: userId
    });
  }

  async getClassroomTeachers(classroomId, filters = {}) {
    return Classroom.getClassroomTeachers(classroomId, filters);
  }

  async removeTeacherFromClassroom(classroomId, teacherId) {
    return Classroom.removeTeacher(classroomId, teacherId);
  }

  async bulkAssignTeachers(classroomId, teachers, userId) {
    return Classroom.bulkAssignTeachers(classroomId, teachers, userId);
  }

  async getAvailableTeachers(classroomId, filters = {}) {
    return Classroom.getAvailableTeachers(classroomId, filters);
  }

  // Get student's active assignment in a specific academic year
  async getStudentActiveAssignmentInYear(studentId, academicYear) {
    return Classroom.getStudentActiveAssignmentInYear(studentId, academicYear);
  }

  // Update student assignment status (for transfers/promotions)
  async updateStudentAssignmentStatus(assignmentId, status, notes) {
    return Classroom.updateStudentAssignmentStatus(assignmentId, status, notes);
  }
}

module.exports = new ClassroomRepository();
