/**
 * Staff Data Validation
 */

const validateStaffData = (data, isUpdate = false) => {
  const errors = [];

  // Required fields for creation
  if (!isUpdate) {
    if (!data.first_name || data.first_name.trim() === '') {
      errors.push('First name is required');
    }

    if (!data.last_name || data.last_name.trim() === '') {
      errors.push('Last name is required');
    }

    if (!data.email || data.email.trim() === '') {
      errors.push('Email is required');
    }

    if (!data.department || data.department.trim() === '') {
      errors.push('Department is required');
    }

    if (!data.position || data.position.trim() === '') {
      errors.push('Position is required');
    }

    if (!data.hire_date) {
      errors.push('Hire date is required');
    }
  }

  // Email format validation
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }

  // Phone validation (Nigerian format)
  if (data.phone) {
    const phoneRegex = /^\+?234[0-9]{10}$|^0[0-9]{10}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      errors.push('Invalid Nigerian phone format. Use +2348012345678 or 08012345678');
    }
  }

  // NIN validation (11 digits)
  if (data.nin) {
    if (!/^\d{11}$/.test(data.nin)) {
      errors.push('NIN must be exactly 11 digits');
    }
  }

  // BVN validation (11 digits)
  if (data.bvn) {
    if (!/^\d{11}$/.test(data.bvn)) {
      errors.push('BVN must be exactly 11 digits');
    }
  }

  // Employment type validation
  if (data.employment_type) {
    const validTypes = ['full-time', 'part-time', 'contract', 'temporary'];
    if (!validTypes.includes(data.employment_type)) {
      errors.push('Invalid employment type');
    }
  }

  // Employment status validation
  if (data.employment_status) {
    const validStatuses = ['active', 'on-leave', 'suspended', 'terminated', 'retired'];
    if (!validStatuses.includes(data.employment_status)) {
      errors.push('Invalid employment status');
    }
  }

  // Gender validation
  if (data.gender) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(data.gender)) {
      errors.push('Invalid gender value');
    }
  }

  // Marital status validation
  if (data.marital_status) {
    const validStatuses = ['single', 'married', 'divorced', 'widowed'];
    if (!validStatuses.includes(data.marital_status)) {
      errors.push('Invalid marital status');
    }
  }

  // Date validations
  if (data.date_of_birth) {
    const dob = new Date(data.date_of_birth);
    const today = new Date();
    const age = (today - dob) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (age < 18) {
      errors.push('Staff member must be at least 18 years old');
    }
    if (age > 100) {
      errors.push('Invalid date of birth');
    }
  }

  if (data.hire_date && data.termination_date) {
    if (new Date(data.termination_date) < new Date(data.hire_date)) {
      errors.push('Termination date cannot be before hire date');
    }
  }

  // Salary validation
  if (data.basic_salary) {
    if (data.basic_salary < 0) {
      errors.push('Salary cannot be negative');
    }
  }

  // Years of experience validation
  if (data.years_of_experience !== undefined && data.years_of_experience !== null) {
    if (data.years_of_experience < 0 || data.years_of_experience > 50) {
      errors.push('Years of experience must be between 0 and 50');
    }
  }

  // Leave days validation
  if (data.annual_leave_days !== undefined && (data.annual_leave_days < 0 || data.annual_leave_days > 365)) {
    errors.push('Invalid annual leave days');
  }

  if (data.sick_leave_days !== undefined && (data.sick_leave_days < 0 || data.sick_leave_days > 365)) {
    errors.push('Invalid sick leave days');
  }

  if (data.casual_leave_days !== undefined && (data.casual_leave_days < 0 || data.casual_leave_days > 365)) {
    errors.push('Invalid casual leave days');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateCustomField = (field) => {
  const errors = [];

  if (!field.key || field.key.trim() === '') {
    errors.push('Field key is required');
  }

  if (!field.label || field.label.trim() === '') {
    errors.push('Field label is required');
  }

  if (!field.type) {
    errors.push('Field type is required');
  }

  const validTypes = ['text', 'number', 'date', 'select', 'textarea', 'checkbox', 'radio', 'email', 'phone', 'url'];
  if (field.type && !validTypes.includes(field.type)) {
    errors.push('Invalid field type');
  }

  if (field.type === 'select' || field.type === 'radio') {
    if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
      errors.push('Options are required for select/radio fields');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateStaffData,
  validateCustomField
};
