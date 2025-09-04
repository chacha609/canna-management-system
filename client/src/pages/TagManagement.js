import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Tag, Edit, Trash2, Eye, BarChart3, FolderPlus } from 'lucide-react';
import api from '../services/api';

const TagManagement = () => {
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSystemTags, setShowSystemTags] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);

  useEffect(() => {
    fetchTags();
    fetchCategories();
    fetchCustomCategories();
  }, [selectedCategory, showSystemTags, searchTerm]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (showSystemTags !== undefined) params.append('is_system_tag', showSystemTags);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/tags?${params.toString()}`);
      setTags(response.data.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/tags/categories');
      setCategories(response.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchCustomCategories = async () => {
    try {
      // This would be a real API call in production
      // For now, we'll use mock data
      setCustomCategories([
        { id: 1, name: 'Special Projects', value: 'special_projects', description: 'Tags for special cultivation projects' },
        { id: 2, name: 'Research', value: 'research', description: 'Research and development tags' }
      ]);
    } catch (err) {
      console.error('Error fetching custom categories:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/tags/analytics');
      setAnalytics(response.data.data);
      setShowAnalyticsModal(true);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleCreateTag = async (tagData) => {
    try {
      await api.post('/tags', tagData);
      setShowCreateModal(false);
      fetchTags();
    } catch (err) {
      console.error('Error creating tag:', err);
    }
  };

  const handleUpdateTag = async (tagData) => {
    try {
      await api.put(`/tags/${selectedTag.id}`, tagData);
      setShowEditModal(false);
      setSelectedTag(null);
      fetchTags();
    } catch (err) {
      console.error('Error updating tag:', err);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        await api.delete(`/tags/${tagId}`);
        fetchTags();
      } catch (err) {
        console.error('Error deleting tag:', err);
      }
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      growth_stage: 'bg-green-100 text-green-800',
      processing_stage: 'bg-blue-100 text-blue-800',
      location: 'bg-purple-100 text-purple-800',
      quality: 'bg-yellow-100 text-yellow-800',
      treatment: 'bg-red-100 text-red-800',
      compliance: 'bg-indigo-100 text-indigo-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-gray-600">Manage system and custom tags for classification</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Manage Categories
          </button>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tags..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              <optgroup label="System Categories">
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </optgroup>
              {customCategories.length > 0 && (
                <optgroup label="Custom Categories">
                  {customCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Type</label>
            <select
              value={showSystemTags}
              onChange={(e) => setShowSystemTags(e.target.value === 'true')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Tags</option>
              <option value="true">System Tags</option>
              <option value="false">Custom Tags</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchTags}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tags.map(tag => (
          <div key={tag.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                ></div>
                <h3 className="font-medium text-gray-900 truncate">{tag.name}</h3>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setSelectedTag(tag);
                    setShowEditModal(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  disabled={tag.is_system_tag}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  disabled={tag.is_system_tag}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(tag.category)}`}>
                {categories.find(c => c.value === tag.category)?.label || tag.category}
              </span>
              
              {tag.is_system_tag && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                  System
                </span>
              )}

              <p className="text-sm text-gray-600 line-clamp-2">{tag.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Usage: {tag.usage_count}</span>
                <button
                  onClick={() => {
                    setSelectedTag(tag);
                    // Could open a modal to show entities with this tag
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tags.length === 0 && !loading && (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tags found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new tag.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </button>
          </div>
        </div>
      )}

      {/* Create Tag Modal */}
      {showCreateModal && (
        <CreateTagModal
          categories={categories}
          customCategories={customCategories}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTag}
        />
      )}

      {/* Edit Tag Modal */}
      {showEditModal && selectedTag && (
        <EditTagModal
          tag={selectedTag}
          categories={categories}
          customCategories={customCategories}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTag(null);
          }}
          onSubmit={handleUpdateTag}
        />
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && analytics && (
        <AnalyticsModal
          analytics={analytics}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryManagementModal
          categories={categories}
          customCategories={customCategories}
          onClose={() => setShowCategoryModal(false)}
          onRefresh={fetchCustomCategories}
        />
      )}
    </div>
  );
};

// Category Management Modal Component
const CategoryManagementModal = ({ categories, customCategories, onClose, onRefresh }) => {
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      // In a real app, this would be an API call
      console.log('Creating category:', newCategory);
      setShowCreateCategory(false);
      setNewCategory({ name: '', description: '' });
      onRefresh();
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        // In a real app, this would be an API call
        console.log('Deleting category:', categoryId);
        onRefresh();
      } catch (err) {
        console.error('Error deleting category:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Category Management</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Categories */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">System Categories</h4>
                <span className="text-sm text-gray-500">Read-only</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map(category => (
                  <div key={category.value} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{category.label}</h5>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        System
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Categories */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Custom Categories</h4>
                <button
                  onClick={() => setShowCreateCategory(true)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </button>
              </div>
              
              {showCreateCategory && (
                <form onSubmit={handleCreateCategory} className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Category name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="Category description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        rows={2}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateCategory(false)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FolderPlus className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">No custom categories yet</p>
                    <p className="text-xs">Create your first custom category</p>
                  </div>
                ) : (
                  customCategories.map(category => (
                    <div key={category.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{category.name}</h5>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Tag Modal Component
const CreateTagModal = ({ categories, customCategories, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    color: '#6B7280',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Tag</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Category</option>
                <optgroup label="System Categories">
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </optgroup>
                {customCategories && customCategories.length > 0 && (
                  <optgroup label="Custom Categories">
                    {customCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Create Tag
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Tag Modal Component
const EditTagModal = ({ tag, categories, customCategories, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: tag.name,
    category: tag.category,
    color: tag.color,
    description: tag.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Tag</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <optgroup label="System Categories">
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </optgroup>
                {customCategories && customCategories.length > 0 && (
                  <optgroup label="Custom Categories">
                    {customCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Update Tag
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Analytics Modal Component
const AnalyticsModal = ({ analytics, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Tag Analytics</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Stats */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Usage by Category</h4>
              <div className="space-y-2">
                {analytics.category_stats.map(stat => (
                  <div key={stat.category} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {stat.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{stat.usage_count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tags */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Most Used Tags</h4>
              <div className="space-y-2">
                {analytics.top_tags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{tag.name}</span>
                    </div>
                    <span className="text-sm font-medium">{tag.usage_count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity Type Stats */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Usage by Entity Type</h4>
              <div className="space-y-2">
                {analytics.entity_type_stats.map(stat => (
                  <div key={stat.entity_type} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {stat.entity_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{stat.usage_count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Over Time */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Usage Over Time</h4>
              <div className="space-y-2">
                {analytics.usage_over_time.slice(-5).map(stat => (
                  <div key={stat.date} className="flex justify-between">
                    <span className="text-sm text-gray-600">{stat.date}</span>
                    <span className="text-sm font-medium">{stat.usage_count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManagement;