const knex = require('../../../config/knex');

class FolderRepository {
  /**
   * Create a new folder
   */
  async create(folderData) {
    const [folder] = await knex('document_folders')
      .insert(folderData)
      .returning('*');
    return folder;
  }

  /**
   * Get folder by ID
   */
  async findById(folderId) {
    const folder = await knex('document_folders')
      .where({ id: folderId })
      .first();
    return folder;
  }

  /**
   * Get all folders for a user
   */
  async findByUserId(userId, options = {}) {
    const { page, limit, parentFolderId } = options;
    
    let query = knex('document_folders')
      .where({ user_id: userId });

    // Filter by parent folder if specified
    if (parentFolderId !== undefined) {
      query = query.where({ parent_folder_id: parentFolderId });
    }

    // If pagination is requested
    if (page && limit) {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countQuery = query.clone();
      const [{ count }] = await countQuery.count('* as count');
      const total = parseInt(count);

      // Apply pagination
      query = query.orderBy('name', 'asc').limit(limit).offset(offset);
      
      const folders = await query;
      
      return {
        folders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    }

    // No pagination - return all folders
    query = query.orderBy('name', 'asc');
    const folders = await query;
    return folders;
  }

  /**
   * Get folder tree for a user
   */
  async getFolderTree(userId) {
    const folders = await knex('document_folders')
      .where({ user_id: userId })
      .orderBy('name', 'asc');

    // Build tree structure
    const folderMap = new Map();
    const rootFolders = [];

    // First pass: create map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Second pass: build tree
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id);
      if (folder.parent_folder_id) {
        const parent = folderMap.get(folder.parent_folder_id);
        if (parent) {
          parent.children.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders;
  }

  /**
   * Update folder
   */
  async update(folderId, updates) {
    const [folder] = await knex('document_folders')
      .where({ id: folderId })
      .update(updates)
      .returning('*');
    return folder;
  }

  /**
   * Delete folder
   */
  async delete(folderId) {
    await knex('document_folders')
      .where({ id: folderId })
      .del();
  }

  /**
   * Check if folder name exists for user in same parent
   */
  async nameExists(userId, name, parentFolderId, excludeFolderId = null) {
    let query = knex('document_folders')
      .where({ 
        user_id: userId, 
        name: name,
        parent_folder_id: parentFolderId 
      });

    if (excludeFolderId) {
      query = query.whereNot({ id: excludeFolderId });
    }

    const folder = await query.first();
    return !!folder;
  }

  /**
   * Get folder path (breadcrumb)
   */
  async getFolderPath(folderId) {
    const path = [];
    let currentFolderId = folderId;

    while (currentFolderId) {
      const folder = await this.findById(currentFolderId);
      if (!folder) break;

      path.unshift({
        id: folder.id,
        name: folder.name
      });

      currentFolderId = folder.parent_folder_id;
    }

    return path;
  }

  /**
   * Get subfolder count
   */
  async getSubfolderCount(folderId) {
    const result = await knex('document_folders')
      .where({ parent_folder_id: folderId })
      .count('* as count')
      .first();
    return parseInt(result.count);
  }

  /**
   * Get document count in folder (excluding deleted)
   */
  async getDocumentCount(folderId) {
    const result = await knex('documents')
      .where({ folder_id: folderId })
      .whereNull('deleted_at')
      .count('* as count')
      .first();
    return parseInt(result.count);
  }
}

module.exports = new FolderRepository();
