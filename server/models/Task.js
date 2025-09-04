const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * Task Model
 * Handles task creation, assignment, tracking, and workflow management
 */
class Task extends BaseModel {
  constructor() {
    super('tasks');
  }

  /**
   * Create a new task with validation
   */
  async create(taskData) {
    try {
      this.validateRequired(taskData, [
        'facility_id', 'title', 'category', 'created_by_user_id'
      ]);

      const task = await super.create({
        ...taskData,
        status: 'pending',
        priority: taskData.priority || 'medium',
        requires_approval: taskData.requires_approval || false
      });

      logger.info(`Created new task: ${task.title} (ID: ${task.id})`);
      return task;
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Get task with related data
   */
  async findByIdWithRelations(id) {
    try {
      const task = await this.db(this.tableName)
        .select(
          'tasks.*',
          'template.name as template_name',
          'created_by.username as created_by_username',
          'assigned_to.username as assigned_to_username',
          'assigned_role.display_name as assigned_role_name',
          'approved_by.username as approved_by_username',
          'plants.plant_tag',
          'batches.batch_number',
          'rooms.name as room_name'
        )
        .leftJoin('task_templates as template', 'tasks.template_id', 'template.id')
        .leftJoin('users as created_by', 'tasks.created_by_user_id', 'created_by.id')
        .leftJoin('users as assigned_to', 'tasks.assigned_to_user_id', 'assigned_to.id')
        .leftJoin('roles as assigned_role', 'tasks.assigned_to_role_id', 'assigned_role.id')
        .leftJoin('users as approved_by', 'tasks.approved_by_user_id', 'approved_by.id')
        .leftJoin('plants', 'tasks.plant_id', 'plants.id')
        .leftJoin('batches', 'tasks.batch_id', 'batches.id')
        .leftJoin('rooms', 'tasks.room_id', 'rooms.id')
        .where('tasks.id', id)
        .first();

      if (task) {
        // Parse JSON fields
        task.instructions = task.instructions ? JSON.parse(task.instructions) : [];
        task.completion_data = task.completion_data ? JSON.parse(task.completion_data) : {};
        task.tags = task.tags ? JSON.parse(task.tags) : [];
        task.calendar_settings = task.calendar_settings ? JSON.parse(task.calendar_settings) : {};
      }

      return task;
    } catch (error) {
      logger.error(`Error finding task with relations by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all tasks with related data
   */
  async findAllWithRelations(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName)
        .select(
          'tasks.*',
          'template.name as template_name',
          'created_by.username as created_by_username',
          'assigned_to.username as assigned_to_username',
          'assigned_role.display_name as assigned_role_name',
          'plants.plant_tag',
          'batches.batch_number',
          'rooms.name as room_name'
        )
        .leftJoin('task_templates as template', 'tasks.template_id', 'template.id')
        .leftJoin('users as created_by', 'tasks.created_by_user_id', 'created_by.id')
        .leftJoin('users as assigned_to', 'tasks.assigned_to_user_id', 'assigned_to.id')
        .leftJoin('roles as assigned_role', 'tasks.assigned_to_role_id', 'assigned_role.id')
        .leftJoin('plants', 'tasks.plant_id', 'plants.id')
        .leftJoin('batches', 'tasks.batch_id', 'batches.id')
        .leftJoin('rooms', 'tasks.room_id', 'rooms.id');

      // Apply filters
      if (filters.facility_id) {
        query = query.where('tasks.facility_id', filters.facility_id);
      }
      
      if (filters.assigned_to_user_id) {
        query = query.where('tasks.assigned_to_user_id', filters.assigned_to_user_id);
      }
      
      if (filters.assigned_to_role_id) {
        query = query.where('tasks.assigned_to_role_id', filters.assigned_to_role_id);
      }
      
      if (filters.status) {
        query = query.where('tasks.status', filters.status);
      }
      
      if (filters.category) {
        query = query.where('tasks.category', filters.category);
      }
      
      if (filters.priority) {
        query = query.where('tasks.priority', filters.priority);
      }
      
      if (filters.batch_id) {
        query = query.where('tasks.batch_id', filters.batch_id);
      }
      
      if (filters.plant_id) {
        query = query.where('tasks.plant_id', filters.plant_id);
      }
      
      if (filters.room_id) {
        query = query.where('tasks.room_id', filters.room_id);
      }

      // Date filters
      if (filters.due_date_from) {
        query = query.where('tasks.due_date', '>=', filters.due_date_from);
      }
      
      if (filters.due_date_to) {
        query = query.where('tasks.due_date', '<=', filters.due_date_to);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
      } else {
        query = query.orderBy('tasks.created_at', 'desc');
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const tasks = await query;

      // Parse JSON fields for each task
      return tasks.map(task => ({
        ...task,
        instructions: task.instructions ? JSON.parse(task.instructions) : [],
        completion_data: task.completion_data ? JSON.parse(task.completion_data) : {},
        tags: task.tags ? JSON.parse(task.tags) : [],
        calendar_settings: task.calendar_settings ? JSON.parse(task.calendar_settings) : {}
      }));
    } catch (error) {
      logger.error('Error finding tasks with relations:', error);
      throw error;
    }
  }

  /**
   * Assign task to user or role
   */
  async assignTask(id, assignmentData, assignedByUserId) {
    try {
      const task = await this.findById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }

      const updateData = {
        assigned_to_user_id: assignmentData.user_id || null,
        assigned_to_role_id: assignmentData.role_id || null,
        updated_at: new Date()
      };

      // If assigning to specific user, also create assignment record
      if (assignmentData.user_id) {
        await this.db('task_assignments').insert({
          task_id: id,
          user_id: assignmentData.user_id,
          assignment_type: 'assignee',
          assigned_by_user_id: assignedByUserId
        });
      }

      const updatedTask = await this.update(id, updateData);
      logger.info(`Assigned task ${id} to ${assignmentData.user_id ? 'user' : 'role'}`);
      
      return updatedTask;
    } catch (error) {
      logger.error(`Error assigning task ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Start task execution
   */
  async startTask(id, userId) {
    try {
      const task = await this.findById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }

      if (task.status !== 'pending') {
        throw new Error(`Task ${id} cannot be started. Current status: ${task.status}`);
      }

      // Start time tracking
      await this.db('task_time_logs').insert({
        task_id: id,
        user_id: userId,
        start_time: new Date()
      });

      const updatedTask = await this.update(id, {
        status: 'in_progress',
        started_at: new Date()
      });

      logger.info(`Started task ${id} by user ${userId}`);
      return updatedTask;
    } catch (error) {
      logger.error(`Error starting task ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Complete task
   */
  async completeTask(id, completionData, userId) {
    try {
      const task = await this.findById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }

      if (task.status !== 'in_progress') {
        throw new Error(`Task ${id} cannot be completed. Current status: ${task.status}`);
      }

      // End time tracking
      const activeTimeLog = await this.db('task_time_logs')
        .where('task_id', id)
        .where('user_id', userId)
        .whereNull('end_time')
        .first();

      if (activeTimeLog) {
        const endTime = new Date();
        const durationMinutes = Math.round((endTime - new Date(activeTimeLog.start_time)) / (1000 * 60));
        
        await this.db('task_time_logs')
          .where('id', activeTimeLog.id)
          .update({
            end_time: endTime,
            duration_minutes: durationMinutes
          });
      }

      const updateData = {
        status: task.requires_approval ? 'completed' : 'completed',
        completed_at: new Date(),
        completion_data: JSON.stringify(completionData || {}),
        actual_duration_minutes: completionData.duration_minutes
      };

      const updatedTask = await this.update(id, updateData);
      logger.info(`Completed task ${id} by user ${userId}`);
      
      return updatedTask;
    } catch (error) {
      logger.error(`Error completing task ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Approve task completion
   */
  async approveTask(id, approvalData, approvedByUserId) {
    try {
      const task = await this.findById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }

      if (!task.requires_approval) {
        throw new Error(`Task ${id} does not require approval`);
      }

      if (task.status !== 'completed') {
        throw new Error(`Task ${id} cannot be approved. Current status: ${task.status}`);
      }

      const updatedTask = await this.update(id, {
        approved_by_user_id: approvedByUserId,
        approved_at: new Date(),
        approval_notes: approvalData.notes
      });

      logger.info(`Approved task ${id} by user ${approvedByUserId}`);
      return updatedTask;
    } catch (error) {
      logger.error(`Error approving task ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add comment to task
   */
  async addComment(taskId, commentData, userId) {
    try {
      const task = await this.findById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      const comment = await this.db('task_comments').insert({
        task_id: taskId,
        user_id: userId,
        comment: commentData.comment,
        attachments: JSON.stringify(commentData.attachments || []),
        parent_comment_id: commentData.parent_comment_id || null,
        is_internal: commentData.is_internal || false
      }).returning('*');

      logger.info(`Added comment to task ${taskId} by user ${userId}`);
      return comment[0];
    } catch (error) {
      logger.error(`Error adding comment to task ID ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get task comments
   */
  async getComments(taskId) {
    try {
      const comments = await this.db('task_comments')
        .select(
          'task_comments.*',
          'users.username',
          'users.first_name',
          'users.last_name'
        )
        .join('users', 'task_comments.user_id', 'users.id')
        .where('task_id', taskId)
        .orderBy('created_at', 'asc');

      return comments.map(comment => ({
        ...comment,
        attachments: comment.attachments ? JSON.parse(comment.attachments) : []
      }));
    } catch (error) {
      logger.error(`Error getting comments for task ID ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get task time logs
   */
  async getTimeLogs(taskId) {
    try {
      const timeLogs = await this.db('task_time_logs')
        .select(
          'task_time_logs.*',
          'users.username'
        )
        .join('users', 'task_time_logs.user_id', 'users.id')
        .where('task_id', taskId)
        .orderBy('start_time', 'desc');

      return timeLogs;
    } catch (error) {
      logger.error(`Error getting time logs for task ID ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get tasks assigned to user
   */
  async findByAssignedUser(userId, filters = {}, options = {}) {
    try {
      return await this.findAllWithRelations({
        ...filters,
        assigned_to_user_id: userId
      }, options);
    } catch (error) {
      logger.error(`Error finding tasks by assigned user ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get tasks by batch
   */
  async findByBatch(batchId, options = {}) {
    try {
      return await this.findAllWithRelations({ batch_id: batchId }, options);
    } catch (error) {
      logger.error(`Error finding tasks by batch ID ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async findOverdue(facilityId, options = {}) {
    try {
      const now = new Date();
      return await this.findAllWithRelations({
        facility_id: facilityId,
        due_date_to: now,
        status: ['pending', 'in_progress']
      }, options);
    } catch (error) {
      logger.error(`Error finding overdue tasks for facility ID ${facilityId}:`, error);
      throw error;
    }
  }

  /**
   * Create task from template
   */
  async createFromTemplate(templateId, taskData, createdByUserId) {
    try {
      const template = await this.db('task_templates').where('id', templateId).first();
      if (!template) {
        throw new Error(`Task template with ID ${templateId} not found`);
      }

      const newTaskData = {
        facility_id: taskData.facility_id,
        template_id: templateId,
        created_by_user_id: createdByUserId,
        title: taskData.title || template.name,
        description: taskData.description || template.description,
        instructions: template.instructions,
        category: template.category,
        priority: taskData.priority || template.priority,
        estimated_duration_minutes: template.estimated_duration_minutes,
        requires_approval: template.requires_approval,
        due_date: taskData.due_date,
        assigned_to_user_id: taskData.assigned_to_user_id,
        assigned_to_role_id: taskData.assigned_to_role_id,
        plant_id: taskData.plant_id,
        batch_id: taskData.batch_id,
        room_id: taskData.room_id,
        tags: template.tags
      };

      const task = await this.create(newTaskData);
      logger.info(`Created task from template ${templateId}: ${task.title}`);
      
      return task;
    } catch (error) {
      logger.error(`Error creating task from template ID ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get task statistics for dashboard
   */
  async getTaskStats(facilityId, filters = {}) {
    try {
      const baseQuery = this.db(this.tableName).where('facility_id', facilityId);

      // Apply additional filters
      if (filters.assigned_to_user_id) {
        baseQuery.where('assigned_to_user_id', filters.assigned_to_user_id);
      }

      // Get counts by status
      const statusStats = await baseQuery.clone()
        .select('status')
        .count('* as count')
        .groupBy('status');

      // Get counts by priority
      const priorityStats = await baseQuery.clone()
        .select('priority')
        .count('* as count')
        .groupBy('priority');

      // Get overdue count
      const overdueCount = await baseQuery.clone()
        .where('due_date', '<', new Date())
        .whereIn('status', ['pending', 'in_progress'])
        .count('* as count')
        .first();

      // Get completion rate for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedLast30Days = await baseQuery.clone()
        .where('completed_at', '>=', thirtyDaysAgo)
        .count('* as count')
        .first();

      const totalLast30Days = await baseQuery.clone()
        .where('created_at', '>=', thirtyDaysAgo)
        .count('* as count')
        .first();

      const completionRate = totalLast30Days.count > 0 
        ? (completedLast30Days.count / totalLast30Days.count * 100).toFixed(1)
        : 0;

      return {
        status_stats: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        priority_stats: priorityStats.reduce((acc, stat) => {
          acc[stat.priority] = parseInt(stat.count);
          return acc;
        }, {}),
        overdue_count: parseInt(overdueCount.count),
        completion_rate: parseFloat(completionRate),
        completed_last_30_days: parseInt(completedLast30Days.count),
        total_last_30_days: parseInt(totalLast30Days.count)
      };
    } catch (error) {
      logger.error(`Error getting task stats for facility ID ${facilityId}:`, error);
      throw error;
    }
  }
}

module.exports = new Task();