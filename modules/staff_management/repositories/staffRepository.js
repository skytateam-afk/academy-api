const Staff = require('../models/Staff');

class StaffRepository {
  async getAllStaff(filters) {
    return await Staff.getAll(filters);
  }

  async getStaffCount(filters) {
    return await Staff.getCount(filters);
  }

  async getStaffById(id) {
    return await Staff.getById(id);
  }

  async getStaffByStaffId(staffId) {
    return await Staff.getByStaffId(staffId);
  }

  async getStaffByEmail(email) {
    return await Staff.getByEmail(email);
  }

  async createStaff(staffData) {
    return await Staff.create(staffData);
  }

  async updateStaff(id, staffData) {
    return await Staff.update(id, staffData);
  }

  async updateCustomFields(id, customFields) {
    return await Staff.updateCustomFields(id, customFields);
  }

  async updateMetadata(id, metadata) {
    return await Staff.updateMetadata(id, metadata);
  }

  async deleteStaff(id) {
    return await Staff.delete(id);
  }

  async updateStaffStatus(id, status) {
    return await Staff.updateStatus(id, status);
  }

  async getStaffByDepartment(department) {
    return await Staff.getByDepartment(department);
  }

  async getDepartmentStatistics() {
    return await Staff.getDepartmentStats();
  }

  async getEmploymentStatistics() {
    return await Staff.getEmploymentStats();
  }

  async getUpcomingReviews(days) {
    return await Staff.getUpcomingReviews(days);
  }

  async bulkUpdateStaff(staffIds, updateData) {
    return await Staff.bulkUpdate(staffIds, updateData);
  }

  async generateStaffId() {
    return await Staff.generateStaffId();
  }
}

module.exports = new StaffRepository();
