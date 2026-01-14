/**
 * Conversation Repository
 * Handles database operations for chat sessions and messages
 */

const knex = require('../../../config/knex');

class ConversationRepository {
  /**
   * Get all chat sessions with pagination and filters
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, userId, search, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    // Build base query for filtering (without select)
    let baseQuery = knex('chat_sessions');

    if (userId) {
      baseQuery = baseQuery.where('chat_sessions.user_id', userId);
    }

    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('chat_sessions.session_id', 'ilike', `%${search}%`)
          .orWhere('chat_sessions.user_id', 'ilike', `%${search}%`)
          // Search in session_metadata JSONB for email
          .orWhereRaw("session_metadata::text ILIKE ?", [`%${search}%`]);
      });
    }

    if (startDate) {
      baseQuery = baseQuery.where('chat_sessions.created_at', '>=', startDate);
    }

    if (endDate) {
      baseQuery = baseQuery.where('chat_sessions.created_at', '<=', endDate);
    }

    // Get total count
    const totalResult = await baseQuery.clone().count('* as count').first();
    const total = parseInt(totalResult.count) || 0;

    // Parse session_metadata helper function
    const parseSessionMetadata = (metadata) => {
      if (!metadata) return {};
      if (typeof metadata === 'string') {
        try {
          return JSON.parse(metadata);
        } catch (e) {
          return {};
        }
      }
      return metadata || {};
    };

    // Get paginated sessions
    const sessions = await baseQuery
      .clone()
      .select('chat_sessions.*')
      .orderBy('chat_sessions.last_activity', 'desc')
      .limit(limit)
      .offset(offset);

    // Get message counts for each session
    const sessionIds = sessions.map(s => s.session_id);
    const messageCounts = await knex('chat_messages')
      .select('session_id')
      .count('* as count')
      .whereIn('session_id', sessionIds)
      .groupBy('session_id');

    const countMap = messageCounts.reduce((acc, item) => {
      acc[item.session_id] = parseInt(item.count);
      return acc;
    }, {});

    const sessionsWithCounts = sessions.map(session => {
      const metadata = parseSessionMetadata(session.session_metadata);
      return {
        ...session,
        message_count: countMap[session.session_id] || 0,
        session_metadata: metadata
      };
    });

    return {
      sessions: sessionsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find session by session_id
   */
  async findBySessionId(sessionId) {
    return await knex('chat_sessions')
      .where('session_id', sessionId)
      .first();
  }

  /**
   * Get full conversation with all messages
   */
  async getConversationWithMessages(sessionId) {
    const session = await this.findBySessionId(sessionId);
    if (!session) return null;

    const messages = await knex('chat_messages')
      .select('id', 'session_id', 'message_type', 'content', 'message_metadata', 'timestamp')
      .where('session_id', sessionId)
      .orderBy('timestamp', 'asc');

    // Parse message_metadata if it's a JSON string
    const parseMetadata = (metadata) => {
      if (!metadata) return {};
      if (typeof metadata === 'string') {
        try {
          return JSON.parse(metadata);
        } catch (e) {
          return {};
        }
      }
      return metadata || {};
    };

    // Parse session_metadata if needed
    const parseSessionMetadata = (metadata) => {
      if (!metadata) return {};
      if (typeof metadata === 'string') {
        try {
          return JSON.parse(metadata);
        } catch (e) {
          return {};
        }
      }
      return metadata || {};
    };

    // Map messages, ensuring we preserve the message_type as stored
    const mappedMessages = messages.map(msg => {
      const metadata = parseMetadata(msg.message_metadata);
      // Preserve original message_type, normalize to lowercase for comparison
      const msgType = (msg.message_type || '').toLowerCase();
      
      return {
        id: msg.id,
        session_id: msg.session_id,
        type: msgType || 'ai', // Use normalized lowercase version
        content: msg.content || '',
        metadata: metadata,
        timestamp: msg.timestamp,
        images: metadata.images || []
      };
    });

    return {
      ...session,
      session_metadata: parseSessionMetadata(session.session_metadata),
      messages: mappedMessages
    };
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteBySessionId(sessionId) {
    return await knex('chat_sessions')
      .where('session_id', sessionId)
      .del();
  }

  /**
   * Get conversation analytics
   */
  async getAnalytics(options = {}) {
    const { startDate, endDate } = options;
    
    // Build base query for filtering
    let baseQuery = knex('chat_sessions');

    if (startDate) {
      baseQuery = baseQuery.where('created_at', '>=', startDate);
    }
    if (endDate) {
      baseQuery = baseQuery.where('created_at', '<=', endDate);
    }

    // Build messages query
    let messagesQuery = knex('chat_messages');
    if (startDate) {
      messagesQuery = messagesQuery.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      messagesQuery = messagesQuery.where('timestamp', '<=', endDate);
    }

    const [
      totalSessions,
      totalMessages,
      uniqueUsers,
      recentSessions
    ] = await Promise.all([
      baseQuery.clone().count('* as count').first(),
      messagesQuery.clone().count('* as count').first(),
      baseQuery.clone().countDistinct('user_id as count').first(),
      knex('chat_sessions')
        .where('created_at', '>=', knex.raw("NOW() - INTERVAL '7 days'"))
        .count('* as count')
        .first()
    ]);

    return {
      total_sessions: parseInt(totalSessions.count) || 0,
      total_messages: parseInt(totalMessages.count) || 0,
      unique_users: parseInt(uniqueUsers.count) || 0,
      sessions_last_7_days: parseInt(recentSessions.count) || 0
    };
  }
}

module.exports = new ConversationRepository();
