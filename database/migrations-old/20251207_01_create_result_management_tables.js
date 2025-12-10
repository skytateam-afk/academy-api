exports.up = function (knex) {
    return knex.schema
        // Subjects Table
        .createTable('subjects', (table) => {
            table.increments('id').primary();
            table.string('name', 100).notNullable().comment('Subject name (e.g., Mathematics)');
            table.string('code', 50).notNullable().unique().comment('Subject code (e.g., MTH101)');
            table.enum('category', ['science', 'arts', 'commercial', 'general', 'vocational', 'language', 'humanities', 'other']).defaultTo('general');
            table.text('description');
            table.boolean('is_active').defaultTo(true);
            table.timestamps(true, true);
        })
        // Grading Scales Table
        .createTable('grading_scales', (table) => {
            table.increments('id').primary();
            table.string('name', 100).notNullable().comment('Scale name (e.g., Junior Secondary, WAEC Standard)');
            table.jsonb('grade_config').notNullable().comment('JSON array of grade ranges');
            // Example: [{"min": 70, "max": 100, "grade": "A", "remark": "Excellent"}, ...]
            table.boolean('is_default').defaultTo(false);
            table.uuid('created_by');
            table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
            table.timestamps(true, true);
        })
        // Student Results Table
        .createTable('student_results', (table) => {
            table.increments('id').primary();
            table.integer('classroom_id').unsigned().notNullable();
            table.foreign('classroom_id').references('id').inTable('classrooms').onDelete('CASCADE');
            table.uuid('student_id').notNullable();
            table.foreign('student_id').references('id').inTable('users').onDelete('CASCADE');
            table.integer('subject_id').unsigned().notNullable();
            table.foreign('subject_id').references('id').inTable('subjects').onDelete('CASCADE');

            table.string('academic_year', 20).notNullable();
            table.string('term', 20).notNullable();

            table.decimal('ca_score', 5, 2).defaultTo(0);
            table.decimal('exam_score', 5, 2).defaultTo(0);
            table.decimal('total_score', 5, 2).defaultTo(0);
            table.string('grade', 5);
            table.string('remark');

            table.uuid('teacher_id').comment('Who uploaded/entered the result');
            table.foreign('teacher_id').references('id').inTable('users').onDelete('SET NULL');

            table.timestamps(true, true);

            // Indexes
            table.index(['classroom_id', 'academic_year', 'term']);
            table.index('student_id');
            table.unique(['classroom_id', 'student_id', 'subject_id', 'academic_year', 'term'], 'unique_student_result');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('student_results')
        .dropTableIfExists('grading_scales')
        .dropTableIfExists('subjects');
};
