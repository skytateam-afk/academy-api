exports.up = function(knex) {
  return knex.schema.createTable('classroom_students', (table) => {
    table.increments('id').primary();
    table.integer('classroom_id').unsigned().notNullable();
    table.foreign('classroom_id').references('id').inTable('classrooms').onDelete('CASCADE');
    table.uuid('student_id').notNullable();
    table.foreign('student_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('enrollment_number', 50).comment('Student enrollment/admission number');
    table.integer('roll_number').unsigned().comment('Roll number within the classroom');
    table.date('assigned_date').notNullable().defaultTo(knex.fn.now()).comment('Date assigned to classroom');
    table.enum('status', ['active', 'transferred', 'completed', 'withdrawn']).defaultTo('active');
    table.text('notes').comment('Additional notes about the assignment');
    table.uuid('assigned_by');
    table.foreign('assigned_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    
    // Indexes
    table.index('classroom_id');
    table.index('student_id');
    table.index('status');
    table.index('enrollment_number');
    
    // Unique constraint: a student can only be assigned once to a classroom in active status
    table.unique(['classroom_id', 'student_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('classroom_students');
};
