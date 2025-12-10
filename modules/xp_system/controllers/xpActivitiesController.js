/**
 * XP Activities Controller
 * Handles management of XP activities for admin users
 */

const knex = require('../../../config/knex');

/**
 * Get all XP activities
 */
const getXPActivities = async (req, res) => {
  try {
    // Fetch activities with ordering
    const activities = await knex('xp_activities')
      .select('*')
      .orderBy('activity_type', 'asc');

    // Calculate stats separately using raw queries to avoid GROUP BY issues
    const [totalResult] = await knex.raw('SELECT COUNT(*) as count FROM xp_activities');
    const [activeResult] = await knex.raw('SELECT COUNT(*) as count FROM xp_activities WHERE is_active = true');
    const [inactiveResult] = await knex.raw('SELECT COUNT(*) as count FROM xp_activities WHERE is_active = false');
    const [avgResult] = await knex.raw('SELECT AVG(xp_value) as average FROM xp_activities');

    res.json({
      success: true,
      activities,
      stats: {
        total: parseInt(totalResult.rows[0].count) || 0,
        active: parseInt(activeResult.rows[0].count) || 0,
        inactive: parseInt(inactiveResult.rows[0].count) || 0,
        average: Math.round(parseFloat(avgResult.rows[0].average)) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching XP activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch XP activities'
    });
  }
};

/**
 * Create new XP activity
 */
const createXPActivity = async (req, res) => {
  try {
    const { activity_type, xp_value, description, is_active = true } = req.body;

    if (!activity_type || typeof xp_value !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Activity type and XP value are required'
      });
    }

    // Check if activity type already exists
    const existing = await knex('xp_activities')
      .where('activity_type', activity_type)
      .first();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Activity type already exists'
      });
    }

    const [newActivity] = await knex('xp_activities')
      .insert({
        activity_type,
        xp_value,
        description,
        is_active
      })
      .returning('*');

    res.status(201).json({
      success: true,
      activity: newActivity
    });
  } catch (error) {
    console.error('Error creating XP activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create XP activity'
    });
  }
};

/**
 * Update XP activity
 */
const updateXPActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_type, xp_value, description, is_active } = req.body;

    if (!activity_type || typeof xp_value !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Activity type and XP value are required'
      });
    }

    // Check if activity type conflicts with another activity
    const existing = await knex('xp_activities')
      .where('activity_type', activity_type)
      .whereNot('id', id)
      .first();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Activity type already exists'
      });
    }

    const [updatedActivity] = await knex('xp_activities')
      .where('id', id)
      .update({
        activity_type,
        xp_value,
        description,
        is_active,
        updated_at: knex.fn.now()
      })
      .returning('*');

    if (!updatedActivity) {
      return res.status(404).json({
        success: false,
        error: 'XP activity not found'
      });
    }

    res.json({
      success: true,
      activity: updatedActivity
    });
  } catch (error) {
    console.error('Error updating XP activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update XP activity'
    });
  }
};

/**
 * Delete XP activity
 */
const deleteXPActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCount = await knex('xp_activities')
      .where('id', id)
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'XP activity not found'
      });
    }

    res.json({
      success: true,
      message: 'XP activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting XP activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete XP activity'
    });
  }
};

/**
 * Toggle XP activity active/inactive status
 */
const toggleXPActivity = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current activity
    const activity = await knex('xp_activities')
      .where('id', id)
      .first();

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'XP activity not found'
      });
    }

    // Toggle status
    const [updatedActivity] = await knex('xp_activities')
      .where('id', id)
      .update({
        is_active: !activity.is_active,
        updated_at: knex.fn.now()
      })
      .returning('*');

    res.json({
      success: true,
      activity: updatedActivity
    });
  } catch (error) {
    console.error('Error toggling XP activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle XP activity'
    });
  }
};

module.exports = {
  getXPActivities,
  createXPActivity,
  updateXPActivity,
  deleteXPActivity,
  toggleXPActivity
};
