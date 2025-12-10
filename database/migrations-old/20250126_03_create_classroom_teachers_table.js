exports.up = function(knex) {
  return knex.schema.createTable('classroom_teachers', (table) => {
    table.increments('id').primary();
    table.integer('classroom_id').unsigned().notNullable();
    table.foreign('classroom_id').references('id').inTable('classrooms').onDelete('CASCADE');
    table.uuid('teacher_id').notNullable();
    table.foreign('teacher_id').references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_primary').defaultTo(false).comment('Indicates if this is the primary/form teacher');
    table.date('assigned_date').notNullable().defaultTo(knex.fn.now()).comment('Date assigned to classroom');
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.text('notes').comment('Additional notes about the assignment');
    table.uuid('assigned_by');
    table.foreign('assigned_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    
    // Indexes
    table.index('classroom_id');
    table.index('teacher_id');
    table.index('status');
    table.index('is_primary');
    
    // Unique constraint: a teacher can only be assigned once to a classroom in active status
    table.unique(['classroom_id', 'teacher_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('classroom_teachers');
};
