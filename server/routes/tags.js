/**
 * Tags Routes
 * Handles comprehensive tagging and classification system operations
 */

const express = require('express');
const router = express.Router();
const { Tag } = require('../models');
const { authenticate, requirePermission, authorizeFacility } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/tags
 * Get all tags with optional filtering
 */
router.get('/', requirePermission('tag.view'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const filters = {
      category: req.query.category,
      is_system_tag: req.query.is_system_tag ? req.query.is_system_tag === 'true' : undefined,
      search: req.query.search,
      parent_tag_id: req.query.parent_tag_id
    };

    const tags = await Tag.getAllTags(facilityId, filters);

    res.json({
      success: true,
      data: tags,
      count: tags.length
    });
  } catch (error) {
    logger.error('Error getting tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tags',
      error: error.message
    });
  }
});

/**
 * GET /api/tags/categories
 * Get all available tag categories
 */
router.get('/categories', requirePermission('tag.view'), async (req, res) => {
  try {
    const categories = [
      { value: 'growth_stage', label: 'Growth Stage', description: 'Plant growth phases' },
      { value: 'processing_stage', label: 'Processing Stage', description: 'Post-harvest processing phases' },
      { value: 'location', label: 'Location', description: 'Room and zone identifiers' },
      { value: 'quality', label: 'Quality', description: 'Quality grades and classifications' },
      { value: 'treatment', label: 'Treatment', description: 'Treatment and care protocols' },
      { value: 'compliance', label: 'Compliance', description: 'Regulatory compliance status' },
      { value: 'custom', label: 'Custom', description: 'User-defined categories' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error getting tag categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tag categories',
      error: error.message
    });
  }
});

/**
 * GET /api/tags/analytics
 * Get tag usage analytics
 */
router.get('/analytics', requirePermission('tag.view'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const timeframe = req.query.timeframe || '30d';

    const analytics = await Tag.getTagAnalytics(facilityId, timeframe);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting tag analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tag analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/tags/category/:category
 * Get tags by category
 */
router.get('/category/:category', requirePermission('tag.view'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const { category } = req.params;

    const tags = await Tag.getTagsByCategory(facilityId, category);

    res.json({
      success: true,
      data: tags,
      count: tags.length
    });
  } catch (error) {
    logger.error('Error getting tags by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tags by category',
      error: error.message
    });
  }
});

/**
 * GET /api/tags/:id
 * Get tag by ID with usage statistics
 */
router.get('/:id', requirePermission('tag.view'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const { id } = req.params;

    const tag = await Tag.getTagById(id, facilityId);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    logger.error('Error getting tag by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tag',
      error: error.message
    });
  }
});

/**
 * POST /api/tags
 * Create a new tag
 */
router.post('/', requirePermission('tag.manage'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const userId = req.user.id;
    const tagData = req.body;

    // Validate required fields
    if (!tagData.name || !tagData.category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    // Validate color format
    if (tagData.color && !/^#[0-9A-F]{6}$/i.test(tagData.color)) {
      return res.status(400).json({
        success: false,
        message: 'Color must be a valid hex color code'
      });
    }

    const newTag = await Tag.createTag(tagData, facilityId, userId);

    logger.info(`Tag created: ${newTag.name} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: newTag
    });
  } catch (error) {
    logger.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag',
      error: error.message
    });
  }
});

/**
 * PUT /api/tags/:id
 * Update a tag
 */
router.put('/:id', requirePermission('tag.manage'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const userId = req.user.id;
    const { id } = req.params;
    const tagData = req.body;

    // Validate color format if provided
    if (tagData.color && !/^#[0-9A-F]{6}$/i.test(tagData.color)) {
      return res.status(400).json({
        success: false,
        message: 'Color must be a valid hex color code'
      });
    }

    const updatedTag = await Tag.updateTag(id, tagData, facilityId, userId);

    logger.info(`Tag updated: ${updatedTag.name} by user ${userId}`);

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data: updatedTag
    });
  } catch (error) {
    logger.error('Error updating tag:', error);
    
    if (error.message === 'Tag not found') {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (error.message === 'Cannot modify system tags') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system tags'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update tag',
      error: error.message
    });
  }
});

/**
 * DELETE /api/tags/:id
 * Delete a tag (soft delete)
 */
router.delete('/:id', requirePermission('tag.manage'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const userId = req.user.id;
    const { id } = req.params;

    await Tag.deleteTag(id, facilityId, userId);

    logger.info(`Tag deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting tag:', error);
    
    if (error.message === 'Tag not found') {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (error.message === 'Cannot delete system tags') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system tags'
      });
    }

    if (error.message === 'Cannot delete tag that is currently in use') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete tag that is currently in use'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete tag',
      error: error.message
    });
  }
});

/**
 * POST /api/tags/:id/apply
 * Apply tag to entity
 */
router.post('/:id/apply', requirePermission('tag.apply'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const userId = req.user.id;
    const { id: tagId } = req.params;
    const { entity_type, entity_id } = req.body;

    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'Entity type and entity ID are required'
      });
    }

    const result = await Tag.applyTagToEntity(tagId, entity_type, entity_id, facilityId, userId);

    logger.info(`Tag ${tagId} applied to ${entity_type}:${entity_id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Tag applied successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error applying tag:', error);
    
    if (error.message === 'Tag not found') {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (error.message === 'Tag already applied to this entity') {
      return res.status(409).json({
        success: false,
        message: 'Tag already applied to this entity'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to apply tag',
      error: error.message
    });
  }
});

/**
 * DELETE /api/tags/:id/remove
 * Remove tag from entity
 */
router.delete('/:id/remove', requirePermission('tag.apply'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const userId = req.user.id;
    const { id: tagId } = req.params;
    const { entity_type, entity_id } = req.body;

    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'Entity type and entity ID are required'
      });
    }

    await Tag.removeTagFromEntity(tagId, entity_type, entity_id, facilityId, userId);

    logger.info(`Tag ${tagId} removed from ${entity_type}:${entity_id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Tag removed successfully'
    });
  } catch (error) {
    logger.error('Error removing tag:', error);
    
    if (error.message === 'Tag not found') {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (error.message === 'Tag not found on entity') {
      return res.status(404).json({
        success: false,
        message: 'Tag not found on entity'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to remove tag',
      error: error.message
    });
  }
});

/**
 * GET /api/tags/entity/:entityType/:entityId
 * Get tags for a specific entity
 */
router.get('/entity/:entityType/:entityId', requirePermission('tag.view'), async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const tags = await Tag.getEntityTags(entityType, entityId);

    res.json({
      success: true,
      data: tags,
      count: tags.length
    });
  } catch (error) {
    logger.error('Error getting entity tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve entity tags',
      error: error.message
    });
  }
});

/**
 * GET /api/tags/:id/entities
 * Get entities that have a specific tag
 */
router.get('/:id/entities', requirePermission('tag.view'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const { id: tagId } = req.params;
    const { entity_type } = req.query;

    const entities = await Tag.getEntitiesByTag(tagId, facilityId, entity_type);

    res.json({
      success: true,
      data: entities,
      count: entities.length
    });
  } catch (error) {
    logger.error('Error getting entities by tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve entities by tag',
      error: error.message
    });
  }
});

/**
 * POST /api/tags/bulk-apply
 * Bulk apply tags to multiple entities
 */
router.post('/bulk-apply', requirePermission('tag.apply'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const userId = req.user.id;
    const { tag_ids, entity_type, entity_ids } = req.body;

    if (!tag_ids || !entity_type || !entity_ids) {
      return res.status(400).json({
        success: false,
        message: 'Tag IDs, entity type, and entity IDs are required'
      });
    }

    if (!Array.isArray(tag_ids) || !Array.isArray(entity_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Tag IDs and entity IDs must be arrays'
      });
    }

    const results = await Tag.bulkApplyTags(tag_ids, entity_type, entity_ids, facilityId, userId);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info(`Bulk tag application: ${successCount} successful, ${failureCount} failed by user ${userId}`);

    res.json({
      success: true,
      message: `Bulk tag application completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    logger.error('Error bulk applying tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk apply tags',
      error: error.message
    });
  }
});

/**
 * POST /api/tags/search
 * Search entities by tags
 */
router.post('/search', requirePermission('tag.view'), async (req, res) => {
  try {
    const facilityId = req.user.facility_id;
    const { tag_ids, entity_type, operator = 'AND' } = req.body;

    if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag IDs array is required'
      });
    }

    if (operator !== 'AND' && operator !== 'OR') {
      return res.status(400).json({
        success: false,
        message: 'Operator must be either AND or OR'
      });
    }

    const entities = await Tag.searchEntitiesByTags(tag_ids, facilityId, entity_type, operator);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      search_criteria: {
        tag_ids,
        entity_type,
        operator
      }
    });
  } catch (error) {
    logger.error('Error searching entities by tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search entities by tags',
      error: error.message
    });
  }
});

module.exports = router;