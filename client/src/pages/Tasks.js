import React, { useState, useEffect } from 'react';
import { apiService, endpoints } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    category: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'cultivation',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    plant_id: '',
    batch_id: '',
    room_id: '',
    template_id: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const [tasksRes, templatesRes, usersRes] = await Promise.all([
        apiService.get(`${endpoints.tasks.list}?${queryParams}`),
        apiService.get(endpoints.tasks.templates),
        apiService.get(endpoints.users.list)
      ]);
      
      setTasks(tasksRes.tasks || []);
      setTemplates(templatesRes.templates || []);
      setUsers(usersRes.users || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await apiService.put(endpoints.tasks.update(editingTask.id), formData);
      } else {
        await apiService.post(endpoints.tasks.create, formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save task:', error);
      setError(error.message);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await apiService.post(endpoints.tasks.complete(taskId));
      await fetchData();
    } catch (error) {
      console.error('Failed to complete task:', error);
      setError(error.message);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'cultivation',
      priority: task.priority || 'medium',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      plant_id: task.plant_id || '',
      batch_id: task.batch_id || '',
      room_id: task.room_id || '',
      template_id: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.delete(endpoints.tasks.delete(id));
        await fetchData();
      } catch (error) {
        console.error('Failed to delete task:', error);
        setError(error.message);
      }
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    try {
      await apiService.post(endpoints.tasks.create, { template_id: templateId });
      await fetchData();
      setShowTemplateModal(false);
    } catch (error) {
      console.error('Failed to create task from template:', error);
      setError(error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      category: 'cultivation',
      priority: 'medium',
      assigned_to: '',
      due_date: '',
      plant_id: '',
      batch_id: '',
      room_id: '',
      template_id: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      cultivation: '🌱',
      maintenance: '🔧',
      quality_control: '🛡️',
      compliance: '📋',
      harvest: '🌾',
      processing: '⚙️',
      inventory: '📦',
      cleaning: '🧽'
    };
    return icons[category] || '📝';
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !tasks.find(t => t.due_date === dueDate && t.status === 'completed');
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Organize and track cultivation tasks</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="btn-secondary"
          >
            📋 From Template
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            + New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="label">Assigned To</label>
            <select
              name="assigned_to"
              value={filters.assigned_to}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All categories</option>
              <option value="cultivation">Cultivation</option>
              <option value="maintenance">Maintenance</option>
              <option value="quality_control">Quality Control</option>
              <option value="compliance">Compliance</option>
              <option value="harvest">Harvest</option>
              <option value="processing">Processing</option>
              <option value="inventory">Inventory</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getCategoryIcon(task.category)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-600 capitalize">{task.category?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(task)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Edit"
                >
                  ✏️
                </button>
                {task.status !== 'completed' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="text-green-600 hover:text-green-700"
                    title="Complete"
                  >
                    ✅
                  </button>
                )}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`status-badge ${getStatusColor(task.status)}`}>
                  {task.status?.replace('_', ' ')}
                </span>
                <span className={`status-badge ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600">{task.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {task.assigned_user && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium">
                      {task.assigned_user.first_name} {task.assigned_user.last_name}
                    </span>
                  </div>
                )}

                {task.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due date:</span>
                    <span className={`font-medium ${isOverdue(task.due_date) ? 'text-red-600' : ''}`}>
                      {new Date(task.due_date).toLocaleDateString()}
                      {getDaysUntilDue(task.due_date) !== null && (
                        <span className="ml-1 text-xs">
                          ({getDaysUntilDue(task.due_date) > 0 ? `${getDaysUntilDue(task.due_date)} days` : 'overdue'})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {task.plant && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plant:</span>
                    <span className="font-medium">{task.plant.plant_tag}</span>
                  </div>
                )}

                {task.batch && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Batch:</span>
                    <span className="font-medium">{task.batch.batch_number}</span>
                  </div>
                )}

                {task.room && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">{task.room.name}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                  {task.completed_at && (
                    <span>Completed: {new Date(task.completed_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Create your first task to get started</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="btn-secondary"
            >
              Use Template
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Create Task
            </button>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Task Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., Water plants in Veg Room 1"
                  />
                </div>

                <div>
                  <label className="label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="cultivation">Cultivation</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="quality_control">Quality Control</option>
                    <option value="compliance">Compliance</option>
                    <option value="harvest">Harvest</option>
                    <option value="processing">Processing</option>
                    <option value="inventory">Inventory</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="label">Priority *</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="label">Assign To</label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select user</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  rows="3"
                  placeholder="Detailed task instructions..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Task from Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 cursor-pointer"
                     onClick={() => handleCreateFromTemplate(template.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.title}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`status-badge ${getPriorityColor(template.priority)}`}>
                          {template.priority}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {template.category?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <button className="btn-primary">
                      Use Template
                    </button>
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No task templates available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;