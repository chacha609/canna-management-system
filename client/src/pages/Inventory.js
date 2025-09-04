import React, { useState, useEffect } from 'react';
import { apiService, endpoints } from '../services/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    low_stock: false
  });
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    item_type: 'flower',
    current_quantity: '',
    unit_of_measure: 'grams',
    unit_cost: '',
    supplier_id: '',
    category_id: '',
    expiration_date: '',
    storage_location: '',
    description: '',
    reorder_point: ''
  });

  useEffect(() => {
    fetchInventory();
  }, [filters]);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await apiService.get(`${endpoints.inventory.list}?${queryParams}`);
      setInventory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiService.put(endpoints.inventory.update(editingItem.id), formData);
      } else {
        await apiService.post(endpoints.inventory.create, formData);
      }
      await fetchInventory();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      setError(error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      sku: item.sku || '',
      item_type: item.item_type || 'flower',
      current_quantity: item.current_quantity || '',
      unit_of_measure: item.unit_of_measure || 'grams',
      unit_cost: item.unit_cost || '',
      supplier_id: item.supplier_id || '',
      category_id: item.category_id || '',
      expiration_date: item.expiration_date ? item.expiration_date.split('T')[0] : '',
      storage_location: item.storage_location || '',
      description: item.description || '',
      reorder_point: item.reorder_point || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await apiService.delete(endpoints.inventory.delete(id));
        await fetchInventory();
      } catch (error) {
        console.error('Failed to delete inventory item:', error);
        setError(error.message);
      }
    }
  };

  const handleRecordMovement = async (id, movementData) => {
    try {
      await apiService.post(endpoints.inventory.recordMovement(id), movementData);
      await fetchInventory();
    } catch (error) {
      console.error('Failed to record movement:', error);
      setError(error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      item_type: 'flower',
      current_quantity: '',
      unit_of_measure: 'grams',
      unit_cost: '',
      supplier_id: '',
      category_id: '',
      expiration_date: '',
      storage_location: '',
      description: '',
      reorder_point: ''
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getCategoryColor = (itemType) => {
    const colors = {
      flower: 'bg-green-100 text-green-800',
      concentrate: 'bg-yellow-100 text-yellow-800',
      edible: 'bg-purple-100 text-purple-800',
      topical: 'bg-blue-100 text-blue-800',
      seed: 'bg-orange-100 text-orange-800',
      clone: 'bg-teal-100 text-teal-800',
      supply: 'bg-gray-100 text-gray-800',
      equipment: 'bg-indigo-100 text-indigo-800',
      raw_material: 'bg-brown-100 text-brown-800',
      finished_product: 'bg-blue-100 text-blue-800'
    };
    return colors[itemType] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (itemType) => {
    const icons = {
      flower: '🌸',
      concentrate: '🍯',
      edible: '🍪',
      topical: '🧴',
      seed: '🌰',
      clone: '🌱',
      supply: '📦',
      equipment: '⚙️',
      raw_material: '🧱',
      finished_product: '📦'
    };
    return icons[itemType] || '📦';
  };

  const isLowStock = (item) => {
    return item.current_quantity <= (item.reorder_point || 0);
  };

  const isExpiringSoon = (expirationDate) => {
    if (!expirationDate) return false;
    const expiry = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expirationDate) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const calculateTotalValue = () => {
    return inventory.reduce((total, item) => {
      return total + (item.current_quantity * (item.unit_cost || 0));
    }, 0).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your cannabis inventory</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${calculateTotalValue()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => isLowStock(item)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => isExpiringSoon(item.expiration_date)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All categories</option>
              <option value="flower">Flower</option>
              <option value="concentrate">Concentrate</option>
              <option value="edible">Edible</option>
              <option value="topical">Topical</option>
              <option value="seed">Seed</option>
              <option value="clone">Clone</option>
              <option value="supply">Supply</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="low_stock"
              checked={filters.low_stock}
              onChange={handleFilterChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Show only low stock items
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => (
          <div key={item.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getCategoryIcon(item.item_type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className={`status-badge ${getCategoryColor(item.item_type)}`}>
                    {item.item_type}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">
                    {item.current_quantity}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">{item.unit_of_measure}</span>
                </div>
                <div className="flex space-x-2">
                  {isLowStock(item) && (
                    <span className="status-badge bg-red-100 text-red-800">Low Stock</span>
                  )}
                  {isExpired(item.expiration_date) && (
                    <span className="status-badge bg-red-100 text-red-800">Expired</span>
                  )}
                  {isExpiringSoon(item.expiration_date) && !isExpired(item.expiration_date) && (
                    <span className="status-badge bg-yellow-100 text-yellow-800">Expiring Soon</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {item.unit_cost && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost per unit:</span>
                    <span className="font-medium">${item.unit_cost}</span>
                  </div>
                )}

                {item.sku && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium">{item.sku}</span>
                  </div>
                )}

                {item.supplier_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium">{item.supplier_name}</span>
                  </div>
                )}

                {item.storage_location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{item.storage_location}</span>
                  </div>
                )}

                {item.expiration_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className={`font-medium ${
                      isExpired(item.expiration_date) ? 'text-red-600' : 
                      isExpiringSoon(item.expiration_date) ? 'text-yellow-600' : ''
                    }`}>
                      {new Date(item.expiration_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {item.description && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Total value: ${(item.current_quantity * (item.unit_cost || 0)).toFixed(2)}</span>
                  <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {inventory.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
          <p className="text-gray-600 mb-4">Add your first inventory item to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Your First Item
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
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
                <div>
                  <label className="label">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., OG Kush Flower"
                  />
                </div>

                <div>
                  <label className="label">SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., SKU-001"
                  />
                </div>

                <div>
                  <label className="label">Item Type *</label>
                  <select
                    name="item_type"
                    value={formData.item_type}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="flower">Flower</option>
                    <option value="concentrate">Concentrate</option>
                    <option value="edible">Edible</option>
                    <option value="topical">Topical</option>
                    <option value="seed">Seed</option>
                    <option value="clone">Clone</option>
                    <option value="supply">Supply</option>
                    <option value="equipment">Equipment</option>
                    <option value="raw_material">Raw Material</option>
                    <option value="finished_product">Finished Product</option>
                  </select>
                </div>

                <div>
                  <label className="label">Current Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="current_quantity"
                    value={formData.current_quantity}
                    onChange={handleChange}
                    className="input-field"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="label">Unit of Measure *</label>
                  <select
                    name="unit_of_measure"
                    value={formData.unit_of_measure}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="grams">Grams</option>
                    <option value="ounces">Ounces</option>
                    <option value="pounds">Pounds</option>
                    <option value="pieces">Pieces</option>
                    <option value="liters">Liters</option>
                    <option value="milliliters">Milliliters</option>
                    <option value="kilograms">Kilograms</option>
                    <option value="units">Units</option>
                  </select>
                </div>

                <div>
                  <label className="label">Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    name="unit_cost"
                    value={formData.unit_cost}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="label">Reorder Point</label>
                  <input
                    type="number"
                    step="0.01"
                    name="reorder_point"
                    value={formData.reorder_point}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                    placeholder="Minimum quantity before reorder"
                  />
                </div>

                <div>
                  <label className="label">Expiration Date</label>
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Storage Location</label>
                  <input
                    type="text"
                    name="storage_location"
                    value={formData.storage_location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Storage location"
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
                  placeholder="Additional description about this item..."
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
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;