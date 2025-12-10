/**
 * Staff Management Migration
 * Comprehensive staff records with Nigerian school-specific fields and dynamic metadata
 */

exports.up = function(knex) {
  return knex.schema.createTable('staff', function(table) {
    // Primary Key
    table.increments('id').primary();
    
    // Personal Information
    table.string('staff_id', 50).unique().notNullable().comment('Unique staff identifier');
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100);
    table.string('last_name', 100).notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('phone', 20);
    table.string('alternate_phone', 20);
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other']);
    table.enum('marital_status', ['single', 'married', 'divorced', 'widowed']);
    
    // Nigerian Specific Fields
    table.string('nin', 11).comment('National Identification Number');
    table.string('bvn', 11).comment('Bank Verification Number');
    table.string('state_of_origin', 50);
    table.string('lga_of_origin', 100).comment('Local Government Area');
    table.string('nationality', 50).defaultTo('Nigerian');
    table.text('permanent_address');
    table.text('current_address');
    
    // Employment Information
    table.string('department', 100).notNullable();
    table.string('position', 100).notNullable();
    table.string('job_title', 150);
    table.enum('employment_type', ['full-time', 'part-time', 'contract', 'temporary']).defaultTo('full-time');
    table.enum('employment_status', ['active', 'on-leave', 'suspended', 'terminated', 'retired']).defaultTo('active');
    table.date('hire_date').notNullable();
    table.date('confirmation_date');
    table.date('termination_date');
    table.string('reporting_to', 50).comment('Staff ID of supervisor');
    
    // Qualification & Certification
    table.string('highest_qualification', 100);
    table.string('institution_attended', 200);
    table.integer('years_of_experience').defaultTo(0);
    table.specificType('certifications', 'text[]').comment('Array of certification names');
    table.specificType('specializations', 'text[]').comment('Areas of specialization');
    
    // Salary & Benefits
    table.decimal('basic_salary', 12, 2);
    table.string('salary_grade', 20);
    table.string('salary_step', 20);
    table.string('bank_name', 100);
    table.string('account_number', 20);
    table.string('account_name', 150);
    table.string('pension_pin', 50);
    table.string('tax_id', 50);
    
    // Emergency Contact
    table.string('next_of_kin_name', 150);
    table.string('next_of_kin_relationship', 50);
    table.string('next_of_kin_phone', 20);
    table.text('next_of_kin_address');
    
    // Additional Information
    table.string('blood_group', 5);
    table.string('genotype', 5);
    table.specificType('languages_spoken', 'text[]');
    table.text('health_conditions').comment('Any medical conditions to be aware of');
    table.text('allergies');
    
    // Documents
    table.string('avatar_url', 500);
    table.string('resume_url', 500);
    table.specificType('document_urls', 'jsonb').comment('Additional document URLs with metadata');
    
    // Permissions & Access
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.specificType('permissions', 'text[]').comment('Special permissions or access levels');
    
    // Leave & Attendance
    table.integer('annual_leave_days').defaultTo(21);
    table.integer('sick_leave_days').defaultTo(12);
    table.integer('casual_leave_days').defaultTo(7);
    table.date('last_promotion_date');
    table.date('last_appraisal_date');
    
    // Dynamic Custom Fields (JSONB)
    table.specificType('custom_fields', 'jsonb').defaultTo('{}').comment('Dynamic custom fields for institution-specific data');
    table.specificType('metadata', 'jsonb').defaultTo('{}').comment('Additional metadata and notes');
    
    // Audit Fields
    table.integer('created_by').unsigned();
    table.integer('updated_by').unsigned();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    
    // Indexes
    table.index('staff_id');
    table.index('email');
    table.index('department');
    table.index('employment_status');
    table.index('nin');
    table.index(['first_name', 'last_name']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('staff');
};
