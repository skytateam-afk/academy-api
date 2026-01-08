/**
 * Migration: Create Classroom and Staff Management
 * Creates classroom, staff, payroll, and student results tables
 */

exports.up = async function(knex) {
  // Create classrooms table
  await knex.schema.createTable('classrooms', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.text('level').notNullable()
      .checkIn(['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3', 'year1', 'year2', 'year3', 'year4', 'year5', 'other']);
    table.text('type').defaultTo('secondary').notNullable()
      .checkIn(['secondary', 'university', 'other']);
    table.string('section', 10);
    table.integer('capacity');
    table.integer('academic_year').notNullable();
    table.string('academic_term', 20);
    table.uuid('class_teacher_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('room_number', 50);
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(new Date()).NotNullable();
    table.timestamp('updated_at').defaultTo(new Date()).NotNullable();

    table.index('academic_year', 'classrooms_academic_year_index');
    table.index('class_teacher_id', 'classrooms_class_teacher_id_index');
    table.index('code', 'classrooms_code_index');
    table.index('is_active', 'classrooms_is_active_index');
    table.index('level', 'classrooms_level_index');
    table.index('type', 'classrooms_type_index');
  });

  // Create classroom_students table
  await knex.schema.createTable('classroom_students', (table) => {
    table.increments('id').primary();
    table.integer('classroom_id').notNullable().references('id').inTable('classrooms').onDelete('CASCADE');
    table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('enrollment_number', 50);
    table.integer('roll_number');
    table.date('assigned_date').defaultTo(knex.fn.now());
    table.text('status').defaultTo('active')
      .checkIn(['active', 'transferred', 'completed', 'withdrawn']);
    table.text('notes');
    table.uuid('assigned_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['classroom_id', 'student_id'], { indexName: 'classroom_students_classroom_id_student_id_unique' });
    table.index('classroom_id', 'classroom_students_classroom_id_index');
    table.index('enrollment_number', 'classroom_students_enrollment_number_index');
    table.index('status', 'classroom_students_status_index');
    table.index('student_id', 'classroom_students_student_id_index');
  });

  // Create classroom_teachers table
  await knex.schema.createTable('classroom_teachers', (table) => {
    table.increments('id').primary();
    table.integer('classroom_id').notNullable().references('id').inTable('classrooms').onDelete('CASCADE');
    table.uuid('teacher_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_primary').defaultTo(false);
    table.date('assigned_date').defaultTo(knex.fn.now());
    table.text('status').defaultTo('active')
      .checkIn(['active', 'inactive']);
    table.text('notes');
    table.uuid('assigned_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['classroom_id', 'teacher_id'], { indexName: 'classroom_teachers_classroom_id_teacher_id_unique' });
    table.index('classroom_id', 'classroom_teachers_classroom_id_index');
    table.index('is_primary', 'classroom_teachers_is_primary_index');
    table.index('status', 'classroom_teachers_status_index');
    table.index('teacher_id', 'classroom_teachers_teacher_id_index');
  });

  // Create staff table
  await knex.schema.createTable('staff', (table) => {
    table.increments('id').primary();
    table.string('staff_id', 50).notNullable().unique();
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100);
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20);
    table.string('alternate_phone', 20);
    table.date('date_of_birth');
    table.text('gender').checkIn(['male', 'female', 'other']);
    table.text('marital_status').checkIn(['single', 'married', 'divorced', 'widowed']);
    table.string('nin', 11);
    table.string('bvn', 11);
    table.string('state_of_origin', 50);
    table.string('lga_of_origin', 100);
    table.string('nationality', 50).defaultTo('Nigerian');
    table.text('permanent_address');
    table.text('current_address');
    table.string('department', 100).notNullable();
    table.string('position', 100).notNullable();
    table.string('job_title', 150);
    table.text('employment_type').defaultTo('full-time')
      .checkIn(['full-time', 'part-time', 'contract', 'temporary']);
    table.text('employment_status').defaultTo('active')
      .checkIn(['active', 'on-leave', 'suspended', 'terminated', 'retired']);
    table.date('hire_date').notNullable();
    table.date('confirmation_date');
    table.date('termination_date');
    table.string('reporting_to', 50);
    table.string('highest_qualification', 100);
    table.string('institution_attended', 200);
    table.integer('years_of_experience').defaultTo(0);
    table.specificType('certifications', 'text[]');
    table.specificType('specializations', 'text[]');
    table.decimal('basic_salary', 12, 2);
    table.string('salary_grade', 20);
    table.string('salary_step', 20);
    table.string('bank_name', 100);
    table.string('account_number', 20);
    table.string('account_name', 150);
    table.string('pension_pin', 50);
    table.string('tax_id', 50);
    table.string('next_of_kin_name', 150);
    table.string('next_of_kin_relationship', 50);
    table.string('next_of_kin_phone', 20);
    table.text('next_of_kin_address');
    table.string('blood_group', 5);
    table.string('genotype', 5);
    table.specificType('languages_spoken', 'text[]');
    table.text('health_conditions');
    table.text('allergies');
    table.string('avatar_url', 500);
    table.string('resume_url', 500);
    table.jsonb('document_urls');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.specificType('permissions', 'text[]');
    table.integer('annual_leave_days').defaultTo(21);
    table.integer('sick_leave_days').defaultTo(12);
    table.integer('casual_leave_days').defaultTo(7);
    table.date('last_promotion_date');
    table.date('last_appraisal_date');
    table.jsonb('custom_fields').defaultTo('{}');
    table.jsonb('metadata').defaultTo('{}');
    table.integer('created_by');
    table.integer('updated_by');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deleted_at');

    table.index('department', 'staff_department_index');
    table.index('email', 'staff_email_index');
    table.index('employment_status', 'staff_employment_status_index');
    table.index(['first_name', 'last_name'], 'staff_first_name_last_name_index');
    table.index('nin', 'staff_nin_index');
    table.index('staff_id', 'staff_staff_id_index');
  });

  // Create staff_salaries table
  await knex.schema.createTable('staff_salaries', (table) => {
    table.increments('id').primary();
    table.integer('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.decimal('basic_salary', 15, 2).notNullable();
    table.decimal('housing_allowance', 15, 2).defaultTo(0);
    table.decimal('transport_allowance', 15, 2).defaultTo(0);
    table.decimal('meal_allowance', 15, 2).defaultTo(0);
    table.decimal('other_allowances', 15, 2).defaultTo(0);
    table.decimal('pension_percentage', 5, 2).defaultTo(8);
    table.decimal('tax_percentage', 5, 2).defaultTo(0);
    table.string('payment_frequency', 20).defaultTo('monthly');
    table.date('effective_from').notNullable();
    table.date('effective_to');
    table.boolean('is_active').defaultTo(true);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('is_active', 'staff_salaries_is_active_index');
    table.index('staff_id', 'staff_salaries_staff_id_index');
  });

  // Create staff_accounts table
  await knex.schema.createTable('staff_accounts', (table) => {
    table.increments('id').primary();
    table.integer('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.string('bank_name', 100).notNullable();
    table.string('account_number', 20).notNullable();
    table.string('account_name', 200).notNullable();
    table.string('account_type', 50).defaultTo('savings');
    table.boolean('is_primary').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('staff_id', 'staff_accounts_staff_id_index');
  });

  // Create payroll_runs table
  await knex.schema.createTable('payroll_runs', (table) => {
    table.increments('id').primary();
    table.string('payroll_month', 7).notNullable().unique();
    table.string('payroll_period', 100).notNullable();
    table.date('payment_date').notNullable();
    table.text('status').defaultTo('draft')
      .checkIn(['draft', 'approved', 'paid', 'cancelled']);
    table.decimal('total_gross', 15, 2).defaultTo(0);
    table.decimal('total_deductions', 15, 2).defaultTo(0);
    table.decimal('total_net', 15, 2).defaultTo(0);
    table.integer('staff_count').defaultTo(0);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('status', 'payroll_runs_status_index');
  });

  // Create payroll_items table
  await knex.schema.createTable('payroll_items', (table) => {
    table.increments('id').primary();
    table.integer('payroll_run_id').notNullable().references('id').inTable('payroll_runs').onDelete('CASCADE');
    table.integer('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.decimal('basic_salary', 15, 2).notNullable();
    table.decimal('housing_allowance', 15, 2).defaultTo(0);
    table.decimal('transport_allowance', 15, 2).defaultTo(0);
    table.decimal('meal_allowance', 15, 2).defaultTo(0);
    table.decimal('other_allowances', 15, 2).defaultTo(0);
    table.decimal('bonus', 15, 2).defaultTo(0);
    table.decimal('overtime', 15, 2).defaultTo(0);
    table.decimal('gross_pay', 15, 2).notNullable();
    table.decimal('pension', 15, 2).defaultTo(0);
    table.decimal('tax', 15, 2).defaultTo(0);
    table.decimal('insurance', 15, 2).defaultTo(0);
    table.decimal('loan_repayment', 15, 2).defaultTo(0);
    table.decimal('other_deductions', 15, 2).defaultTo(0);
    table.decimal('total_deductions', 15, 2).defaultTo(0);
    table.decimal('net_pay', 15, 2).notNullable();
    table.integer('working_days').defaultTo(0);
    table.integer('days_worked').defaultTo(0);
    table.integer('days_absent').defaultTo(0);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['payroll_run_id', 'staff_id'], { indexName: 'payroll_items_payroll_run_id_staff_id_unique' });
    table.index('payroll_run_id', 'payroll_items_payroll_run_id_index');
    table.index('staff_id', 'payroll_items_staff_id_index');
  });

  // Create subject_group_subjects table
  await knex.schema.createTable('subject_group_subjects', (table) => {
    table.increments('id').primary();
    table.integer('subject_group_id').references('id').inTable('subject_groups').onDelete('CASCADE');
    table.integer('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['subject_group_id', 'subject_id'], { indexName: 'subject_group_subjects_subject_group_id_subject_id_key' });
  });

  // Create student_results table
  await knex.schema.createTable('student_results', (table) => {
    table.increments('id').primary();
    table.integer('classroom_id').notNullable().references('id').inTable('classrooms').onDelete('CASCADE');
    table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('subject_id').notNullable().references('id').inTable('subjects').onDelete('CASCADE');
    table.string('academic_year', 20).notNullable();
    table.string('term', 20).notNullable();
    table.decimal('ca_score', 5, 2).defaultTo(0);
    table.decimal('exam_score', 5, 2).defaultTo(0);
    table.decimal('total_score', 5, 2).defaultTo(0);
    table.string('grade', 5);
    table.string('remark', 255);
    table.uuid('teacher_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['classroom_id', 'student_id', 'subject_id', 'academic_year', 'term'], { indexName: 'unique_student_result' });
    table.index(['classroom_id', 'academic_year', 'term'], 'student_results_classroom_id_academic_year_term_index');
    table.index('student_id', 'student_results_student_id_index');
  });

  // Create result_batches table
  await knex.schema.createTable('result_batches', (table) => {
    table.increments('id').primary();
    table.string('batch_name', 200).notNullable();
    table.string('batch_code', 50).notNullable().unique();
    table.integer('classroom_id').notNullable().references('id').inTable('classrooms').onDelete('CASCADE');
    table.string('academic_year', 20).notNullable();
    table.string('term', 20).notNullable();
    table.integer('grading_scale_id').notNullable().references('id').inTable('grading_scales').onDelete('RESTRICT');
    table.text('status').defaultTo('draft')
      .checkIn(['draft', 'processing', 'completed', 'failed', 'published']);
    table.text('csv_file_path');
    table.text('error_log');
    table.integer('total_students').defaultTo(0);
    table.integer('total_subjects').defaultTo(0);
    table.integer('total_results').defaultTo(0);
    table.integer('failed_imports').defaultTo(0);
    table.timestamp('processed_at');
    table.timestamp('published_at');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.integer('subject_group_id').references('id').inTable('subject_groups');
    table.string('teacher_name', 255);
    table.string('principal_name', 255);
    table.text('teacher_signature_url');
    table.text('principal_signature_url');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['classroom_id', 'academic_year', 'term'], 'idx_result_batches_classroom_year_term');
    table.index('created_by', 'idx_result_batches_created_by');
    table.index('status', 'idx_result_batches_status');
    table.index(['classroom_id', 'academic_year', 'term'], 'result_batches_classroom_id_academic_year_term_index');
    table.index('created_by', 'result_batches_created_by_index');
    table.index('status', 'result_batches_status_index');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('result_batches');
  await knex.schema.dropTableIfExists('student_results');
  await knex.schema.dropTableIfExists('subject_group_subjects');
  await knex.schema.dropTableIfExists('payroll_items');
  await knex.schema.dropTableIfExists('payroll_runs');
  await knex.schema.dropTableIfExists('staff_accounts');
  await knex.schema.dropTableIfExists('staff_salaries');
  await knex.schema.dropTableIfExists('staff');
  await knex.schema.dropTableIfExists('classroom_teachers');
  await knex.schema.dropTableIfExists('classroom_students');
  await knex.schema.dropTableIfExists('classrooms');
};
