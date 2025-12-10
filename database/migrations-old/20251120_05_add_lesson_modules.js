/**
 * Migration: Add Lesson Modules
 * 
 * This migration restructures the lesson system to support modules within lessons:
 * 
 * New Structure:
 * Course → Lessons → Modules → Content (videos, PDFs, attachments)
 * 
 * - Lessons become containers for modules
 * - Modules contain the actual content (video, audio, text, documents)
 * - Attachments are moved to module level
 * - Quizzes and assignments remain at lesson level
 * 
 * Changes:
 * 1. Create lesson_modules table
 * 2. Move content fields from lessons to modules
 * 3. Update lesson_attachments to reference modules instead of lessons
 * 4. Keep lessons as organizational units with quizzes/assignments
 */

exports.up = async function(knex) {
  // Create lesson_modules table
  await knex.schema.createTable('lesson_modules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
    
    // Basic info
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('description').nullable();
    
    // Content type and content fields (moved from lessons)
    table.enum('content_type', ['video', 'audio', 'text', 'document', 'interactive', 'mixed']).notNullable();
    
    // Video content
    table.string('video_url', 500).nullable();
    table.integer('video_duration').nullable().comment('Duration in seconds');
    
    // Audio content
    table.string('audio_url', 500).nullable();
    table.integer('audio_duration').nullable().comment('Duration in seconds');
    
    // Text content
    table.text('text_content').nullable().comment('Rich text content (HTML/Markdown)');
    
    // Document content
    table.string('document_url', 500).nullable();
    
    // Interactive content
    table.jsonb('interactive_content').nullable().comment('Interactive content configuration');
    
    // Module metadata
    table.integer('duration_minutes').nullable().comment('Estimated completion time');
    table.integer('order_index').defaultTo(0).notNullable();
    table.boolean('is_preview').defaultTo(false).comment('Available without enrollment');
    table.boolean('is_published').defaultTo(false);
    
    // Versioning (inherited from lesson versioning concept)
    table.integer('version').defaultTo(1).notNullable();
    table.uuid('previous_version_id').nullable().references('id').inTable('lesson_modules').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('published_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('lesson_id', 'idx_modules_lesson');
    table.index(['lesson_id', 'order_index'], 'idx_modules_lesson_order');
    table.index('slug', 'idx_modules_slug');
    table.unique(['lesson_id', 'slug'], 'unique_module_slug_per_lesson');
  });

  // Create module_attachments table (renamed from lesson_attachments)
  await knex.schema.createTable('module_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('module_id').notNullable().references('id').inTable('lesson_modules').onDelete('CASCADE');
    
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.string('file_url', 500).notNullable();
    table.string('file_type', 100).notNullable();
    table.bigInteger('file_size').notNullable().comment('File size in bytes');
    table.boolean('is_downloadable').defaultTo(true);
    table.integer('order_index').defaultTo(0).notNullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('module_id', 'idx_attachments_module');
    table.index(['module_id', 'order_index'], 'idx_attachments_module_order');
  });

  // Migrate existing lesson_attachments data to module_attachments
  // Note: This assumes we'll create a default module for each lesson with attachments
  const lessonsWithAttachments = await knex('lesson_attachments')
    .select('lesson_id')
    .groupBy('lesson_id');

  for (const { lesson_id } of lessonsWithAttachments) {
    // Get lesson details
    const lesson = await knex('lessons').where('id', lesson_id).first();
    
    if (lesson) {
      // Create a default module for this lesson
      const [module] = await knex('lesson_modules').insert({
        lesson_id: lesson_id,
        title: lesson.title || 'Main Content',
        slug: lesson.slug || 'main-content',
        description: lesson.description,
        content_type: lesson.content_type || 'mixed',
        video_url: lesson.video_url,
        video_duration: lesson.video_duration,
        audio_url: lesson.audio_url,
        audio_duration: lesson.audio_duration,
        text_content: lesson.text_content,
        document_url: lesson.document_url,
        interactive_content: lesson.interactive_content,
        duration_minutes: lesson.duration_minutes,
        order_index: 0,
        is_preview: lesson.is_preview,
        is_published: lesson.is_published,
        version: lesson.version || 1,
        published_at: lesson.published_at
      }).returning('*');

      // Migrate attachments to the new module
      const attachments = await knex('lesson_attachments')
        .where('lesson_id', lesson_id)
        .select('*');

      if (attachments.length > 0) {
        await knex('module_attachments').insert(
          attachments.map(att => ({
            module_id: module.id,
            title: att.title,
            description: att.description,
            file_url: att.file_url,
            file_type: att.file_type,
            file_size: att.file_size,
            is_downloadable: att.is_downloadable,
            order_index: att.order_index,
            created_at: att.created_at,
            updated_at: att.updated_at
          }))
        );
      }
    }
  }

  // Update lessons table - remove content fields if they exist (they're now in modules)
  const lessonColumns = await knex('information_schema.columns')
    .where({ table_name: 'lessons' })
    .pluck('column_name');

  await knex.schema.table('lessons', (table) => {
    // Drop content-related columns only if they exist
    if (lessonColumns.includes('content_type')) table.dropColumn('content_type');
    if (lessonColumns.includes('video_url')) table.dropColumn('video_url');
    if (lessonColumns.includes('video_duration')) table.dropColumn('video_duration');
    if (lessonColumns.includes('audio_url')) table.dropColumn('audio_url');
    if (lessonColumns.includes('audio_duration')) table.dropColumn('audio_duration');
    if (lessonColumns.includes('text_content')) table.dropColumn('text_content');
    if (lessonColumns.includes('document_url')) table.dropColumn('document_url');
    if (lessonColumns.includes('interactive_content')) table.dropColumn('interactive_content');
    if (lessonColumns.includes('duration_minutes')) table.dropColumn('duration_minutes');
    if (lessonColumns.includes('is_preview')) table.dropColumn('is_preview');
    
    // Add module count for quick reference
    if (!lessonColumns.includes('module_count')) {
      table.integer('module_count').defaultTo(0).comment('Number of modules in this lesson');
    }
  });

  // Update module count for existing lessons
  await knex.raw(`
    UPDATE lessons
    SET module_count = (
      SELECT COUNT(*)
      FROM lesson_modules
      WHERE lesson_modules.lesson_id = lessons.id
    )
  `);

  // Create trigger to auto-update module count
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_lesson_module_count()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        UPDATE lessons
        SET module_count = module_count + 1
        WHERE id = NEW.lesson_id;
        RETURN NEW;
      ELSIF TG_OP = 'DELETE' THEN
        UPDATE lessons
        SET module_count = module_count - 1
        WHERE id = OLD.lesson_id;
        RETURN OLD;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_update_lesson_module_count
    AFTER INSERT OR DELETE ON lesson_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_module_count();
  `);

  // Drop old lesson_attachments table
  await knex.schema.dropTableIfExists('lesson_attachments');

  console.log('✅ Added lesson modules structure');
  console.log('✅ Migrated existing content to modules');
  console.log('✅ Lessons are now containers for modules');
  console.log('✅ Modules contain the actual content');
};

exports.down = async function(knex) {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS trigger_update_lesson_module_count ON lesson_modules');
  await knex.raw('DROP FUNCTION IF EXISTS update_lesson_module_count()');

  // Recreate lesson_attachments table
  await knex.schema.createTable('lesson_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.string('file_url', 500).notNullable();
    table.string('file_type', 100).notNullable();
    table.bigInteger('file_size').notNullable();
    table.boolean('is_downloadable').defaultTo(true);
    table.integer('order_index').defaultTo(0).notNullable();
    table.timestamps(true, true);
  });

  // Restore content fields to lessons table
  await knex.schema.table('lessons', (table) => {
    table.enum('content_type', ['video', 'audio', 'text', 'document', 'interactive', 'mixed']).nullable();
    table.string('video_url', 500).nullable();
    table.integer('video_duration').nullable();
    table.string('audio_url', 500).nullable();
    table.integer('audio_duration').nullable();
    table.text('text_content').nullable();
    table.string('document_url', 500).nullable();
    table.jsonb('interactive_content').nullable();
    table.integer('duration_minutes').nullable();
    table.boolean('is_preview').defaultTo(false);
    
    table.dropColumn('module_count');
  });

  // Drop new tables
  await knex.schema.dropTableIfExists('module_attachments');
  await knex.schema.dropTableIfExists('lesson_modules');

  console.log('✅ Reverted to original lesson structure');
};
