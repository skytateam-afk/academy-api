const searchService = require('./search.service');

/**
 * Unified search endpoint
 * GET /api/search?q=query&modules=users,courses&limit=5
 */
exports.search = async (req, res, next) => {
  try {
    const { q: query, modules, limit = 5 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Parse modules parameter (comma-separated string to array)
    const moduleList = modules 
      ? modules.split(',').map(m => m.trim()).filter(Boolean)
      : [];

    const results = await searchService.unifiedSearch(
      query.trim(),
      moduleList,
      parseInt(limit, 10)
    );

    // Calculate total results
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    res.json({
      success: true,
      query,
      totalResults,
      results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tag-based search endpoint
 * GET /api/search/tags?tag=programming&modules=courses&limit=10
 */
exports.searchByTag = async (req, res, next) => {
  try {
    const { tag, modules, limit = 10 } = req.query;

    if (!tag || tag.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag parameter is required'
      });
    }

    // Parse modules parameter
    const moduleList = modules 
      ? modules.split(',').map(m => m.trim()).filter(Boolean)
      : [];

    const results = await searchService.tagSearch(
      tag.trim(),
      moduleList,
      parseInt(limit, 10)
    );

    // Calculate total results
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    res.json({
      success: true,
      tag,
      totalResults,
      results
    });
  } catch (error) {
    next(error);
  }
};
