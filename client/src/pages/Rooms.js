import React, { useState, useEffect } from 'react';
import { apiService, endpoints } from '../services/api';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    room_type: 'vegetative',
    capacity: '',
    length: '',
    width: '',
    height: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(endpoints.rooms.list);
      setRooms(response.rooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await apiService.put(endpoints.rooms.update(editingRoom.id), formData);
      } else {
        await apiService.post(endpoints.rooms.create, formData);
      }
      await fetchRooms();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save room:', error);
      setError(error.message);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name || '',
      room_type: room.room_type || 'vegetative',
      capacity: room.capacity || '',
      length: room.length || '',
      width: room.width || '',
      height: room.height || '',
      description: room.description || '',
      is_active: room.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await apiService.delete(endpoints.rooms.delete(id));
        await fetchRooms();
      } catch (error) {
        console.error('Failed to delete room:', error);
        setError(error.message);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      name: '',
      room_type: 'vegetative',
      capacity: '',
      length: '',
      width: '',
      height: '',
      description: '',
      is_active: true
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      seedling: 'bg-green-100 text-green-800',
      vegetative: 'bg-blue-100 text-blue-800',
      flowering: 'bg-purple-100 text-purple-800',
      drying: 'bg-yellow-100 text-yellow-800',
      curing: 'bg-orange-100 text-orange-800',
      storage: 'bg-gray-100 text-gray-800',
      processing: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const calculateVolume = (length, width, height) => {
    if (!length || !width || !height) return null;
    return (parseFloat(length) * parseFloat(width) * parseFloat(height)).toFixed(2);
  };

  const calculateArea = (length, width) => {
    if (!length || !width) return null;
    return (parseFloat(length) * parseFloat(width)).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600">Manage your cultivation facility rooms</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Add Room
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                <span className={`status-badge ${getRoomTypeColor(room.room_type)}`}>
                  {room.room_type}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${room.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {room.capacity && (
                  <div>
                    <span className="text-gray-600">Capacity:</span>
                    <p className="font-medium">{room.capacity} plants</p>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Current plants:</span>
                  <p className="font-medium">{room.current_plants || 0}</p>
                </div>

                {room.length && room.width && (
                  <div>
                    <span className="text-gray-600">Area:</span>
                    <p className="font-medium">{calculateArea(room.length, room.width)} ft²</p>
                  </div>
                )}

                {room.length && room.width && room.height && (
                  <div>
                    <span className="text-gray-600">Volume:</span>
                    <p className="font-medium">{calculateVolume(room.length, room.width, room.height)} ft³</p>
                  </div>
                )}
              </div>

              {(room.length || room.width || room.height) && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Dimensions: {room.length || '?'} × {room.width || '?'} × {room.height || '?'} ft
                  </div>
                </div>
              )}

              {room.description && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{room.description}</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Status: {room.is_active ? 'Active' : 'Inactive'}</span>
                  <span>Utilization: {room.capacity ? Math.round(((room.current_plants || 0) / room.capacity) * 100) : 0}%</span>
                </div>
              </div>

              {/* Environmental Data Preview */}
              {room.environmental_data && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-gray-600">Temp</div>
                      <div className="font-medium">{room.environmental_data.temperature || '--'}°F</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Humidity</div>
                      <div className="font-medium">{room.environmental_data.humidity || '--'}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">CO₂</div>
                      <div className="font-medium">{room.environmental_data.co2 || '--'} ppm</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
          <p className="text-gray-600 mb-4">Set up your first cultivation room</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Your First Room
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
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
                  <label className="label">Room Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., Veg Room 1"
                  />
                </div>

                <div>
                  <label className="label">Room Type *</label>
                  <select
                    name="room_type"
                    value={formData.room_type}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="seedling">Seedling</option>
                    <option value="vegetative">Vegetative</option>
                    <option value="flowering">Flowering</option>
                    <option value="drying">Drying</option>
                    <option value="curing">Curing</option>
                    <option value="storage">Storage</option>
                    <option value="processing">Processing</option>
                  </select>
                </div>

                <div>
                  <label className="label">Capacity (plants)</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    placeholder="e.g., 100"
                  />
                </div>

                <div>
                  <label className="label">Length (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 20"
                  />
                </div>

                <div>
                  <label className="label">Width (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 15"
                  />
                </div>

                <div>
                  <label className="label">Height (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 10"
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
                  placeholder="Describe the room setup, equipment, etc..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Room is active
                </label>
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
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;