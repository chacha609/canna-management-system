import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, endpoints } from '../services/api';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [strains, setStrains] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    batch_number: '',
    strain_id: '',
    room_id: '',
    plant_count: '',
    stage: 'seedling',
    planted_date: '',
    expected_harvest_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [batchesRes, strainsRes, roomsRes] = await Promise.all([
        apiService.get(endpoints.batches.list),
        apiService.get(endpoints.strains.list),
        apiService.get(endpoints.rooms.list)
      ]);
      
      setBatches(batchesRes.batches || []);
      setStrains(strainsRes.strains || []);
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
      if (editingBatch) {
        await apiService.put(endpoints.batches.update(editingBatch.id), formData);
      } else {
        await apiService.post(endpoints.batches.create, formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save batch:', error);
      setError(error.message);
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batch_number: batch.batch_number || '',
      strain_id: batch.strain_id || '',
      room_id: batch.room_id || '',
      plant_count: batch.plant_count || '',
      stage: batch.stage || 'seedling',
      planted_date: batch.planted_date ? batch.planted_date.split('T')[0] : '',
      expected_harvest_date: batch.expected_harvest_date ? batch.expected_harvest_date.split('T')[0] : '',
      notes: batch.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await apiService.delete(endpoints.batches.delete(id));
        await fetchData();
      } catch (error) {
        console.error('Failed to delete batch:', error);
        setError(error.message);
      }
    }
  };

  const handleHarvest = async (id) => {
    if (window.confirm('Are you sure you want to harvest this batch?')) {
      try {
        await apiService.post(endpoints.batches.harvest(id));
        await fetchData();
      } catch (error) {
        console.error('Failed to harvest batch:', error);
        setError(error.message);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBatch(null);
    setFormData({
      batch_number: '',
      strain_id: '',
      room_id: '',
      plant_count: '',
      stage: 'seedling',
      planted_date: '',
      expected_harvest_date: '',
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

  const getDaysInStage = (plantedDate, stage) => {
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
          <p className="text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600">Track and manage your cultivation batches</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + New Batch
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => (
          <div key={batch.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{batch.batch_number}</h3>
                <p className="text-sm text-gray-600">{batch.strain?.name || 'Unknown Strain'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(batch)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Edit"
                >
                  ✏️
                </button>
                {batch.stage !== 'harvested' && batch.stage !== 'destroyed' && (
                  <button
                    onClick={() => handleHarvest(batch.id)}
                    className="text-green-600 hover:text-green-700"
                    title="Harvest"
                  >
                    🌾
                  </button>
                )}
                <button
                  onClick={() => handleDelete(batch.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`status-badge ${getStageColor(batch.stage)}`}>
                  {batch.stage}
                </span>
                <span className="text-sm text-gray-600">
                  {batch.plant_count} plants
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room:</span>
                  <span className="font-medium">{batch.room?.name || 'Not assigned'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Days in stage:</span>
                  <span className="font-medium">{getDaysInStage(batch.planted_date, batch.stage)}</span>
                </div>

                {batch.planted_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Planted:</span>
                    <span className="font-medium">
                      {new Date(batch.planted_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {batch.expected_harvest_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected harvest:</span>
                    <span className="font-medium">
                      {new Date(batch.expected_harvest_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {batch.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{batch.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <Link
                  to={`/plants?batch_id=${batch.id}`}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View Plants ({batch.plants_count || 0}) →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {batches.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
          <p className="text-gray-600 mb-4">Create your first cultivation batch</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Create Your First Batch
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBatch ? 'Edit Batch' : 'Create New Batch'}
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
                  <label className="label">Batch Number *</label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., B2024-001"
                  />
                </div>

                <div>
                  <label className="label">Strain *</label>
                  <select
                    name="strain_id"
                    value={formData.strain_id}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select a strain</option>
                    {strains.map(strain => (
                      <option key={strain.id} value={strain.id}>
                        {strain.name}
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
                  <label className="label">Plant Count *</label>
                  <input
                    type="number"
                    name="plant_count"
                    value={formData.plant_count}
                    onChange={handleChange}
                    className="input-field"
                    required
                    min="1"
                  />
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
                  <label className="label">Planted Date</label>
                  <input
                    type="date"
                    name="planted_date"
                    value={formData.planted_date}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Expected Harvest Date</label>
                  <input
                    type="date"
                    name="expected_harvest_date"
                    value={formData.expected_harvest_date}
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
                  placeholder="Add any notes about this batch..."
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
                  {editingBatch ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;