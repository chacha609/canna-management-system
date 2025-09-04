import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService, endpoints } from '../services/api';

const Plants = () => {
  const [plants, setPlants] = useState([]);
  const [batches, setBatches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    batch_id: searchParams.get('batch_id') || '',
    stage: '',
    room_id: '',
    health_status: ''
  });
  const [formData, setFormData] = useState({
    plant_tag: '',
    batch_id: '',
    room_id: '',
    stage: 'seedling',
    health_status: 'healthy',
    planted_date: '',
    notes: ''
  });

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

      const [plantsRes, batchesRes, roomsRes] = await Promise.all([
        apiService.get(`${endpoints.plants.list}?${queryParams}`),
        apiService.get(endpoints.batches.list),
        apiService.get(endpoints.rooms.list)
      ]);
      
      setPlants(plantsRes.plants || []);
      setBatches(batchesRes.batches || []);
      setRooms(roomsRes.rooms || []);
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
      if (editingPlant) {
        await apiService.put(endpoints.plants.update(editingPlant.id), formData);
      } else {
        await apiService.post(endpoints.plants.create, formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save plant:', error);
      setError(error.message);
    }
  };

  const handleEdit = (plant) => {
    setEditingPlant(plant);
    setFormData({
      plant_tag: plant.plant_tag || '',
      batch_id: plant.batch_id || '',
      room_id: plant.room_id || '',
      stage: plant.stage || 'seedling',
      health_status: plant.health_status || 'healthy',
      planted_date: plant.planted_date ? plant.planted_date.split('T')[0] : '',
      notes: plant.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plant?')) {
      try {
        await apiService.delete(endpoints.plants.delete(id));
        await fetchData();
      } catch (error) {
        console.error('Failed to delete plant:', error);
        setError(error.message);
      }
    }
  };

  const handleHarvest = async (id) => {
    if (window.confirm('Are you sure you want to harvest this plant?')) {
      try {
        await apiService.post(endpoints.plants.harvest(id));
        await fetchData();
      } catch (error) {
        console.error('Failed to harvest plant:', error);
        setError(error.message);
      }
    }
  };

  const handleMove = async (plantId, newRoomId) => {
    try {
      await apiService.post(endpoints.plants.move(plantId), { room_id: newRoomId });
      await fetchData();
    } catch (error) {
      console.error('Failed to move plant:', error);
      setError(error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlant(null);
    setFormData({
      plant_tag: '',
      batch_id: '',
      room_id: '',
      stage: 'seedling',
      health_status: 'healthy',
      planted_date: '',
      notes: ''
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

  const getStageColor = (stage) => {
    const colors = {
      seedling: 'bg-green-100 text-green-800',
      vegetative: 'bg-blue-100 text-blue-800',
      flowering: 'bg-purple-100 text-purple-800',
      harvested: 'bg-gray-100 text-gray-800',
      destroyed: 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getHealthColor = (status) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      sick: 'bg-yellow-100 text-yellow-800',
      pest_issues: 'bg-orange-100 text-orange-800',
      nutrient_deficiency: 'bg-red-100 text-red-800',
      dead: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDaysInStage = (plantedDate) => {
    if (!plantedDate) return 0;
    const planted = new Date(plantedDate);
    const now = new Date();
    return Math.floor((now - planted) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plant Management</h1>
          <p className="text-gray-600">Track individual plants throughout their lifecycle</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Add Plant
        </button>
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
            <label className="label">Batch</label>
            <select
              name="batch_id"
              value={filters.batch_id}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All batches</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Stage</label>
            <select
              name="stage"
              value={filters.stage}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All stages</option>
              <option value="seedling">Seedling</option>
              <option value="vegetative">Vegetative</option>
              <option value="flowering">Flowering</option>
              <option value="harvested">Harvested</option>
            </select>
          </div>

          <div>
            <label className="label">Room</label>
            <select
              name="room_id"
              value={filters.room_id}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All rooms</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Health Status</label>
            <select
              name="health_status"
              value={filters.health_status}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All statuses</option>
              <option value="healthy">Healthy</option>
              <option value="sick">Sick</option>
              <option value="pest_issues">Pest Issues</option>
              <option value="nutrient_deficiency">Nutrient Deficiency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plants.map((plant) => (
          <div key={plant.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{plant.plant_tag}</h3>
                <p className="text-sm text-gray-600">{plant.batch?.batch_number || 'No batch'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(plant)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Edit"
                >
                  ✏️
                </button>
                {plant.stage !== 'harvested' && plant.stage !== 'destroyed' && (
                  <button
                    onClick={() => handleHarvest(plant.id)}
                    className="text-green-600 hover:text-green-700"
                    title="Harvest"
                  >
                    🌾
                  </button>
                )}
                <button
                  onClick={() => handleDelete(plant.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`status-badge ${getStageColor(plant.stage)}`}>
                  {plant.stage}
                </span>
                <span className={`status-badge ${getHealthColor(plant.health_status)}`}>
                  {plant.health_status?.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room:</span>
                  <span className="font-medium">{plant.room?.name || 'Not assigned'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Days old:</span>
                  <span className="font-medium">{getDaysInStage(plant.planted_date)}</span>
                </div>

                {plant.planted_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Planted:</span>
                    <span className="font-medium">
                      {new Date(plant.planted_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {plant.strain && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strain:</span>
                    <span className="font-medium">{plant.strain.name}</span>
                  </div>
                )}
              </div>

              {plant.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{plant.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex space-x-2">
                  <select
                    onChange={(e) => handleMove(plant.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                    defaultValue=""
                  >
                    <option value="">Move to room...</option>
                    {rooms.filter(room => room.id !== plant.room_id).map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plants.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No plants found</h3>
          <p className="text-gray-600 mb-4">Add your first plant to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Your First Plant
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
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
                  <label className="label">Plant Tag *</label>
                  <input
                    type="text"
                    name="plant_tag"
                    value={formData.plant_tag}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., P2024-001"
                  />
                </div>

                <div>
                  <label className="label">Batch *</label>
                  <select
                    name="batch_id"
                    value={formData.batch_id}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select a batch</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Room</label>
                  <select
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select a room</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Stage *</label>
                  <select
                    name="stage"
                    value={formData.stage}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="seedling">Seedling</option>
                    <option value="vegetative">Vegetative</option>
                    <option value="flowering">Flowering</option>
                    <option value="harvested">Harvested</option>
                  </select>
                </div>

                <div>
                  <label className="label">Health Status *</label>
                  <select
                    name="health_status"
                    value={formData.health_status}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="pest_issues">Pest Issues</option>
                    <option value="nutrient_deficiency">Nutrient Deficiency</option>
                    <option value="dead">Dead</option>
                  </select>
                </div>

                <div>
                  <label className="label">Planted Date</label>
                  <input
                    type="date"
                    name="planted_date"
                    value={formData.planted_date}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input-field"
                  rows="3"
                  placeholder="Add any notes about this plant..."
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
                  {editingPlant ? 'Update Plant' : 'Add Plant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plants;