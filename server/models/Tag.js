/**
 * Tag Model
 * Handles comprehensive tagging and classification system operations
 */

const BaseModel = require('./BaseModel');
const db = require('../config/database');

class Tag extends BaseModel {
  static get tableName() {
    return 'system_tags';
  }

  /**
   * Get all tags with optional filtering
   */
  static async getAllTags(facilityId, filters = {}) {
    try {
      let query = db('system_tags')
        .where('facility_id', facilityId)
        .where('is_active', true);

      // Apply filters
      if (filters.category) {
        query = query.where('category', filters.category);
      }

      if (filters.is_system_tag !== undefined) {
        query = query.where('is_system_tag', filters.is_system_tag);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('name', 'ilike', `%${filters.search}%`)
              .orWhere('description', 'ilike', `%${filters.search}%`);
        });
      }

      if (filters.parent_tag_id) {
        query = query.where('parent_tag_id', filters.parent_tag_id);
      }

      // Include parent tag information
      const tags = await query
        .leftJoin('system_tags as parent_tags', 'system_tags.parent_tag_id', 'parent_tags.id')
        .select(
          'system_tags.*',
          'parent_tags.name as parent_tag_name',
          'parent_tags.color as parent_tag_color'
        )
        .orderBy('system_tags.category')
        .orderBy('system_tags.name');

      // Get usage counts for each tag
      const tagIds = tags.map(tag => tag.id);
      const usageCounts = await db('entity_tags')
        .whereIn('tag_id', tagIds)
        .groupBy('tag_id')
        .select('tag_id', db.raw('COUNT(*) as usage_count'));

      const usageMap = usageCounts.reduce((acc, item) => {
        acc[item.tag_id] = parseInt(item.usage_count);
        return acc;
      }, {});

      return tags.map(tag => ({
        ...tag,
        usage_count: usageMap[tag.id] || 0
      }));
    } catch (error) {
      console.error('Error getting all tags:', error);
      throw error;
    }
  }

  /**
   * Get tag by ID with usage statistics
   */
  static async getTagById(id, facilityId) {
    try {
      const tag = await db('system_tags')
        .where({ id, facility_id: facilityId })
        .leftJoin('system_tags as parent_tags', 'system_tags.parent_tag_id', 'parent_tags.id')
        .select(
          'system_tags.*',
          'parent_tags.name as parent_tag_name',
          'parent_tags.color as parent_tag_color'
        )
        .first();

      if (!tag) {
        return null;
      }

      // Get usage statistics
      const usageStats = await db('entity_tags')
        .where('tag_id', id)
        .groupBy('entity_type')
        .select('entity_type', db.raw('COUNT(*) as count'));

      const totalUsage = await db('entity_tags')
        .where('tag_id', id)
        .count('* as count')
        .first();

      // Get child tags
      const childTags = await db('system_tags')
        .where('parent_tag_id', id)
        .where('is_active', true)
        .select('id', 'name', 'color', 'description');

      return {
        ...tag,
        usage_stats: usageStats,
        total_usage: parseInt(totalUsage.count),
        child_tags: childTags
      };
    } catch (error) {
      console.error('Error getting tag by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new tag
   */
  static async createTag(tagData, facilityId, userId) {
    try {
      const newTag = await db('system_tags')
        .insert({
          ...tagData,
          facility_id: facilityId,
          is_system_tag: false, // User-created tags are not system tags
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      await this.logActivity(userId, 'tag_created', 'system_tags', newTag[0].id, {
        tag_name: newTag[0].name,
        category: newTag[0].category
      });

      return newTag[0];
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  /**
   * Update a tag
   */
  static async updateTag(id, tagData, facilityId, userId) {
    try {
      const existingTag = await db('system_tags')
        .where({ id, facility_id: facilityId })
        .first();

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Prevent updating system tags
      if (existingTag.is_system_tag) {
        throw new Error('Cannot modify system tags');
      }

      const updatedTag = await db('system_tags')
        .where({ id, facility_id: facilityId })
        .update({
          ...tagData,
          updated_at: new Date()
        })
        .returning('*');

      await this.logActivity(userId, 'tag_updated', 'system_tags', id, {
        tag_name: updatedTag[0].name,
        changes: tagData
      });

      return updatedTag[0];
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  /**
   * Delete a tag (soft delete)
   */
  static async deleteTag(id, facilityId, userId) {
    try {
      const existingTag = await db('system_tags')
        .where({ id, facility_id: facilityId })
        .first();

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Prevent deleting system tags
      if (existingTag.is_system_tag) {
        throw new Error('Cannot delete system tags');
      }

      // Check if tag is in use
      const usageCount = await db('entity_tags')
        .where('tag_id', id)
        .count('* as count')
        .first();

      if (parseInt(usageCount.count) > 0) {
        throw new Error('Cannot delete tag that is currently in use');
      }

      await db('system_tags')
        .where({ id, facility_id: facilityId })
        .update({
          is_active: false,
          updated_at: new Date()
        });

      await this.logActivity(userId, 'tag_deleted', 'system_tags', id, {
        tag_name: existingTag.name
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  /**
   * Get tags by category
   */
  static async getTagsByCategory(facilityId, category) {
    try {
      return await db('system_tags')
        .where({ facility_id: facilityId, category, is_active: true })
        .orderBy('name');
    } catch (error) {
      console.error('Error getting tags by category:', error);
      throw error;
    }
  }

  /**
   * Apply tag to entity
   */
  static async applyTagToEntity(tagId, entityType, entityId, facilityId, userId) {
    try {
      // Verify tag exists and belongs to facility
      const tag = await db('system_tags')
        .where({ id: tagId, facility_id: facilityId, is_active: true })
        .first();

      if (!tag) {
        throw new Error('Tag not found');
      }

      // Check if tag is already applied
      const existingTag = await db('entity_tags')
        .where({ tag_id: tagId, entity_type: entityType, entity_id: entityId })
        .first();

      if (existingTag) {
        throw new Error('Tag already applied to this entity');
      }

      const entityTag = await db('entity_tags')
        .insert({
          tag_id: tagId,
          entity_type: entityType,
          entity_id: entityId,
          tagged_by_user_id: userId,
          tagged_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      await this.logActivity(userId, 'tag_applied', entityType, entityId, {
        tag_name: tag.name,
        tag_category: tag.category
      });

      return entityTag[0];
    } catch (error) {
      console.error('Error applying tag to entity:', error);
      throw error;
    }
  }

  /**
   * Remove tag from entity
   */
  static async removeTagFromEntity(tagId, entityType, entityId, facilityId, userId) {
    try {
      // Verify tag exists and belongs to facility
      const tag = await db('system_tags')
        .where({ id: tagId, facility_id: facilityId })
        .first();

      if (!tag) {
        throw new Error('Tag not found');
      }

      const deleted = await db('entity_tags')
        .where({ tag_id: tagId, entity_type: entityType, entity_id: entityId })
        .del();

      if (deleted === 0) {
        throw new Error('Tag not found on entity');
      }

      await this.logActivity(userId, 'tag_removed', entityType, entityId, {
        tag_name: tag.name,
        tag_category: tag.category
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing tag from entity:', error);
      throw error;
    }
  }

  /**
   * Get tags for entity
   */
  static async getEntityTags(entityType, entityId) {
    try {
      return await db('entity_tags')
        .join('system_tags', 'entity_tags.tag_id', 'system_tags.id')
        .join('users', 'entity_tags.tagged_by_user_id', 'users.id')
        .where({
          'entity_tags.entity_type': entityType,
          'entity_tags.entity_id': entityId
        })
        .where('system_tags.is_active', true)
        .select(
          'system_tags.*',
          'entity_tags.tagged_at',
          'users.username as tagged_by_username'
        )
        .orderBy('system_tags.category')
        .orderBy('system_tags.name');
    } catch (error) {
      console.error('Error getting entity tags:', error);
      throw error;
    }
  }

  /**
   * Get entities by tag
   */
  static async getEntitiesByTag(tagId, facilityId, entityType = null) {
    try {
      let query = db('entity_tags')
        .join('system_tags', 'entity_tags.tag_id', 'system_tags.id')
        .where({
          'entity_tags.tag_id': tagId,
          'system_tags.facility_id': facilityId
        });

      if (entityType) {
        query = query.where('entity_tags.entity_type', entityType);
      }

      return await query
        .select(
          'entity_tags.*',
          'system_tags.name as tag_name',
          'system_tags.category as tag_category',
          'system_tags.color as tag_color'
        )
        .orderBy('entity_tags.tagged_at', 'desc');
    } catch (error) {
      console.error('Error getting entities by tag:', error);
      throw error;
    }
  }

  /**
   * Bulk apply tags to entities
   */
  static async bulkApplyTags(tagIds, entityType, entityIds, facilityId, userId) {
    try {
      const results = [];
      
      for (const tagId of tagIds) {
        for (const entityId of entityIds) {
          try {
            const result = await this.applyTagToEntity(tagId, entityType, entityId, facilityId, userId);
            results.push({ success: true, tagId, entityId, result });
          } catch (error) {
            results.push({ success: false, tagId, entityId, error: error.message });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error bulk applying tags:', error);
      throw error;
    }
  }

  /**
   * Get tag analytics
   */
  static async getTagAnalytics(facilityId, timeframe = '30d') {
    try {
      const timeframeDays = parseInt(timeframe.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays);

      // Tag usage by category
      const categoryStats = await db('entity_tags')
        .join('system_tags', 'entity_tags.tag_id', 'system_tags.id')
        .where('system_tags.facility_id', facilityId)
        .where('entity_tags.tagged_at', '>=', startDate)
        .groupBy('system_tags.category')
        .select('system_tags.category', db.raw('COUNT(*) as usage_count'))
        .orderBy('usage_count', 'desc');

      // Most used tags
      const topTags = await db('entity_tags')
        .join('system_tags', 'entity_tags.tag_id', 'system_tags.id')
        .where('system_tags.facility_id', facilityId)
        .where('entity_tags.tagged_at', '>=', startDate)
        .groupBy('system_tags.id', 'system_tags.name', 'system_tags.color', 'system_tags.category')
        .select(
          'system_tags.id',
          'system_tags.name',
          'system_tags.color',
          'system_tags.category',
          db.raw('COUNT(*) as usage_count')
        )
        .orderBy('usage_count', 'desc')
        .limit(10);

      // Tag usage by entity type
      const entityTypeStats = await db('entity_tags')
        .join('system_tags', 'entity_tags.tag_id', 'system_tags.id')
        .where('system_tags.facility_id', facilityId)
        .where('entity_tags.tagged_at', '>=', startDate)
        .groupBy('entity_tags.entity_type')
        .select('entity_tags.entity_type', db.raw('COUNT(*) as usage_count'))
        .orderBy('usage_count', 'desc');

      // Tag usage over time
      const usageOverTime = await db('entity_tags')
        .join('system_tags', 'entity_tags.tag_id', 'system_tags.id')
        .where('system_tags.facility_id', facilityId)
        .where('entity_tags.tagged_at', '>=', startDate)
        .select(
          db.raw('DATE(entity_tags.tagged_at) as date'),
          db.raw('COUNT(*) as usage_count')
        )
        .groupBy(db.raw('DATE(entity_tags.tagged_at)'))
        .orderBy('date');

      return {
        category_stats: categoryStats,
        top_tags: topTags,
        entity_type_stats: entityTypeStats,
        usage_over_time: usageOverTime,
        timeframe: timeframe
      };
    } catch (error) {
      console.error('Error getting tag analytics:', error);
      throw error;
    }
  }

  /**
   * Search entities by tags
   */
  static async searchEntitiesByTags(tagIds, facilityId, entityType = null, operator = 'AND') {
    try {
      let query = db('entity_tags')
        .join('system_tags', 'entity_tags.tag_id', 'system_tags.id')
        .where('system_tags.facility_id', facilityId)
        .whereIn('entity_tags.tag_id', tagIds);

      if (entityType) {
        query = query.where('entity_tags.entity_type', entityType);
      }

      if (operator === 'AND') {
        // Entities must have ALL specified tags
        query = query
          .groupBy('entity_tags.entity_type', 'entity_tags.entity_id')
          .having(db.raw('COUNT(DISTINCT entity_tags.tag_id) = ?', [tagIds.length]));
      }

      return await query
        .select(
          'entity_tags.entity_type',
          'entity_tags.entity_id',
          db.raw('array_agg(system_tags.name) as tag_names'),
          db.raw('array_agg(system_tags.color) as tag_colors')
        )
        .groupBy('entity_tags.entity_type', 'entity_tags.entity_id');
    } catch (error) {
      console.error('Error searching entities by tags:', error);
      throw error;
    }
  }
}

module.exports = Tag;