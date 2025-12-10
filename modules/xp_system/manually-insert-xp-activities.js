/**
 * Manual script to insert XP activities if they don't exist
 * Run with: node manually-insert-xp-activities.js from lms-api directory
 */

const knex = require('../config/knex');

async function insertXPActivities() {
  try {
    console.log('Checking XP activities...');

    // Check if activities exist
    const existing = await knex('xp_activities').select('*');
    console.log('Existing XP activities:', existing.length);

    if (existing.length > 0) {
      console.log('XP activities already exist:', existing);
      return;
    }

    console.log('Inserting default XP activities...');

    const activities = [
      {
        activity_type: 'video_complete',
        xp_value: 10,
        description: 'Complete a video module',
        is_active: true
      },
      {
        activity_type: 'quiz_pass',
        xp_value: 20,
        description: 'Pass a quiz',
        is_active: true
      },
      {
        activity_type: 'quiz_fail',
        xp_value: -5,
        description: 'Fail a quiz (XP deduction)',
        is_active: true
      },
      {
        activity_type: 'lesson_complete',
        xp_value: 50,
        description: 'Complete an entire lesson',
        is_active: true
      },
      {
        activity_type: 'course_complete',
        xp_value: 100,
        description: 'Complete an entire course',
        is_active: true
      }
    ];

    const result = await knex('xp_activities').insert(activities);

    console.log('Inserted XP activities:', result);
    console.log('🎉 XP activities setup complete!');

  } catch (error) {
    console.error('Error setting up XP activities:', error);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

insertXPActivities();
