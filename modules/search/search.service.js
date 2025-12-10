const db = require('../../config/database');

class SearchService {
  /**
   * Unified search across multiple modules
   * @param {string} query - Search query
   * @param {Array<string>} modules - Modules to search in (users, courses, documents, etc.)
   * @param {number} limit - Maximum results per module
   * @returns {Promise<Object>} Search results grouped by module
   */
  async unifiedSearch(query, modules = [], limit = 5) {
    const results = {};
    const searchTerm = `%${query}%`;

    // Search in Users
    if (modules.length === 0 || modules.includes('users')) {
      const users = await db('users')
        .select('id', 'first_name', 'last_name', 'email', 'role', 'avatar_url')
        .where(function() {
          this.where('first_name', 'like', searchTerm)
            .orWhere('last_name', 'like', searchTerm)
            .orWhere('email', 'like', searchTerm)
            .orWhere('role', 'like', searchTerm)
        })
        .limit(limit);
      
      results.users = users.map(user => ({
        id: user.id,
        title: `${user.first_name} ${user.last_name}`.trim() || user.email,
        subtitle: user.role,
        email: user.email,
        avatar: user.avatar_url,
        path: `/users/${user.id}`,
        type: 'user'
      }));
    }

    // Search in Courses
    if (modules.length === 0 || modules.includes('courses')) {
      const courses = await db('courses')
        .select('id', 'title', 'description', 'level', 'status', 'thumbnail_url')
        .where(function() {
          this.where('title', 'like', searchTerm)
            .orWhere('description', 'like', searchTerm)
            .orWhere('level', 'like', searchTerm)
        })
        .where('status', 'published')
        .limit(limit);
      
      results.courses = courses.map(course => ({
        id: course.id,
        title: course.title,
        subtitle: course.level,
        description: course.description?.substring(0, 100),
        thumbnail: course.thumbnail_url,
        path: `/courses/${course.id}`,
        type: 'course'
      }));
    }

    // Search in Library
    if (modules.length === 0 || modules.includes('library')) {
      const libraryItems = await db('library_items')
        .select('id', 'title', 'type', 'author', 'thumbnail_url')
        .where(function() {
          this.where('title', 'like', searchTerm)
            .orWhere('author', 'like', searchTerm)
            .orWhere('type', 'like', searchTerm)
        })
        .limit(limit);
      
      results.library = libraryItems.map(item => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.type}${item.author ? ` by ${item.author}` : ''}`,
        thumbnail: item.thumbnail_url,
        path: `/library/${item.id}`,
        type: 'library'
      }));
    }

    // Search in Documents
    if (modules.length === 0 || modules.includes('documents')) {
      const documents = await db('documents')
        .select('id', 'title', 'description', 'file_type', 'file_url')
        .where(function() {
          this.where('title', 'like', searchTerm)
            .orWhere('description', 'like', searchTerm)
            .orWhere('file_type', 'like', searchTerm)
        })
        .limit(limit);
      
      results.documents = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        subtitle: doc.file_type?.toUpperCase(),
        description: doc.description?.substring(0, 100),
        path: `/documents/${doc.id}`,
        type: 'document'
      }));
    }

    // Search in Jobs
    if (modules.length === 0 || modules.includes('jobs')) {
      const jobs = await db('jobs')
        .select('id', 'title', 'company', 'location', 'employment_type', 'status')
        .where(function() {
          this.where('title', 'like', searchTerm)
            .orWhere('company', 'like', searchTerm)
            .orWhere('location', 'like', searchTerm)
        })
        .where('status', 'active')
        .limit(limit);
      
      results.jobs = jobs.map(job => ({
        id: job.id,
        title: job.title,
        subtitle: `${job.company} - ${job.location}`,
        description: job.employment_type,
        path: `/jobs/${job.id}`,
        type: 'job'
      }));
    }

    // Search in Announcements
    if (modules.length === 0 || modules.includes('announcements')) {
      const announcements = await db('announcements')
        .select('id', 'title', 'content', 'status')
        .where(function() {
          this.where('title', 'like', searchTerm)
            .orWhere('content', 'like', searchTerm)
        })
        .where('status', 'published')
        .limit(limit);
      
      results.announcements = announcements.map(ann => ({
        id: ann.id,
        title: ann.title,
        description: ann.content?.substring(0, 100),
        path: `/announcements/${ann.id}`,
        type: 'announcement'
      }));
    }

    // Search in Pathways
    if (modules.length === 0 || modules.includes('pathways')) {
      const pathways = await db('pathways')
        .select('id', 'title', 'description', 'status')
        .where(function() {
          this.where('title', 'like', searchTerm)
            .orWhere('description', 'like', searchTerm)
        })
        .where('status', 'published')
        .limit(limit);
      
      results.pathways = pathways.map(pathway => ({
        id: pathway.id,
        title: pathway.title,
        description: pathway.description?.substring(0, 100),
        path: `/pathways/${pathway.id}`,
        type: 'pathway'
      }));
    }

    // Search in Classrooms
    if (modules.length === 0 || modules.includes('classrooms')) {
      const classrooms = await db('classrooms')
        .select('id', 'name', 'code', 'level')
        .where(function() {
          this.where('name', 'like', searchTerm)
            .orWhere('code', 'like', searchTerm)
            .orWhere('level', 'like', searchTerm)
        })
        .limit(limit);
      
      results.classrooms = classrooms.map(classroom => ({
        id: classroom.id,
        title: classroom.name,
        subtitle: `${classroom.code} - ${classroom.level}`,
        path: `/classrooms/${classroom.id}`,
        type: 'classroom'
      }));
    }

    return results;
  }

  /**
   * Tag-based search across modules
   * @param {string} tag - Tag to search for
   * @param {Array<string>} modules - Modules to search in
   * @param {number} limit - Maximum results per module
   * @returns {Promise<Object>} Search results grouped by module
   */
  async tagSearch(tag, modules = [], limit = 10) {
    const results = {};
    
    // Check if tags table exists and search using it
    const hasTagsTable = await db.schema.hasTable('tags');
    
    if (hasTagsTable) {
      // Use tags table for more precise tagging
      const taggedItems = await db('tags')
        .select('tags.*', 'taggables.taggable_type', 'taggables.taggable_id')
        .join('taggables', 'tags.id', 'taggables.tag_id')
        .where('tags.name', 'like', `%${tag}%`)
        .limit(limit * 5); // Get more results since we'll filter by module
      
      // Group by taggable type
      const grouped = {};
      taggedItems.forEach(item => {
        const type = item.taggable_type.toLowerCase();
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(item.taggable_id);
      });

      // Fetch actual records for each type
      for (const [type, ids] of Object.entries(grouped)) {
        if (modules.length > 0 && !modules.includes(type)) continue;
        
        if (type === 'course' && ids.length > 0) {
          const courses = await db('courses')
            .select('id', 'title', 'description', 'level', 'thumbnail_url')
            .whereIn('id', ids)
            .limit(limit);
          
          results.courses = courses.map(course => ({
            id: course.id,
            title: course.title,
            subtitle: course.level,
            description: course.description?.substring(0, 100),
            thumbnail: course.thumbnail_url,
            path: `/courses/${course.id}`,
            type: 'course',
            hasTag: true
          }));
        }
        
        if (type === 'user' && ids.length > 0) {
          const users = await db('users')
            .select('id', 'first_name', 'last_name', 'email', 'role', 'avatar_url')
            .whereIn('id', ids)
            .limit(limit);
          
          results.users = users.map(user => ({
            id: user.id,
            title: `${user.first_name} ${user.last_name}`.trim() || user.email,
            subtitle: user.role,
            email: user.email,
            avatar: user.avatar_url,
            path: `/users/${user.id}`,
            type: 'user',
            hasTag: true
          }));
        }
        
        // Add more types as needed
      }
    } else {
      // Fallback to regular search if tags table doesn't exist
      return this.unifiedSearch(tag, modules, limit);
    }

    return results;
  }
}

module.exports = new SearchService();
