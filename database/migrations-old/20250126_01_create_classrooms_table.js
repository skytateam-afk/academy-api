exports.up = function(knex) {
  return knex.schema.createTable('classrooms', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().comment('Classroom name (e.g., JSS1A, Year 1A, CS101)');
    table.string('code', 50).notNullable().unique().comment('Unique classroom code');
    table.enum('level', ['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3', 'year1', 'year2', 'year3', 'year4', 'year5', 'other']).notNullable().comment('Education level');
    table.enum('type', ['secondary', 'university', 'other']).notNullable().defaultTo('secondary').comment('Institution type');
    table.string('section', 10).comment('Section/Division (e.g., A, B, C)');
    table.integer('capacity').unsigned().comment('Maximum student capacity');
    table.integer('academic_year').unsigned().notNullable().comment('Academic year (e.g., 2024, 2025)');
    table.string('academic_term', 20).comment('Academic term (e.g., First Term, Second Term, Semester 1)');
    table.uuid('class_teacher_id').comment('Primary teacher/form teacher ID');
    table.foreign('class_teacher_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('room_number', 50).comment('Physical room/location');
    table.text('description').comment('Additional information about the classroom');
    table.boolean('is_active').defaultTo(true).comment('Active status');
    table.uuid('created_by');
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by');
    table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    
    // Indexes
    table.index('code');
    table.index('level');
    table.index('type');
    table.index('academic_year');
    table.index('is_active');
    table.index('class_teacher_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('classrooms');
};
