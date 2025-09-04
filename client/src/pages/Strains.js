import React, { useState, useEffect } from 'react';
import { apiService, endpoints } from '../services/api';

const Strains = () => {
  const [strains, setStrains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStrain, setEditingStrain] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'hybrid',
    genetics: '',
    thc_min: '',
    thc_max: '',
    cbd_min: '',
    cbd_max: '',
    flowering_time: '',
    yield_indoor: '',
    yield_outdoor: '',
    description: '',
    effects: '',
    flavors: '',
    medical_uses: ''
  });

  useEffect(() => {
    fetchStrains();
  }, []);

  const fetchStrains = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(endpoints.strains.list);
      setStrains(response.strains || []);
    } catch (error) {
      console.error('Failed to fetch strains:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStrain) {
        await apiService.put(endpoints.strains.update(editingStrain.id), formData);
      } else {
        await apiService.post(endpoints.strains.create, formData);
      }
      await fetchStrains();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save strain:', error);
      setError(error.message);
    }
  };

  const handleEdit = (strain) => {
    setEditingStrain(strain);
    setFormData({
      name: strain.name || '',
      type: strain.type || 'hybrid',
      genetics: strain.genetics || '',
      thc_min: strain.thc_min || '',
      thc_max: strain.thc_max || '',
      cbd_min: strain.cbd_min || '',
      cbd_max: strain.cbd_max || '',
      flowering_time: strain.flowering_time || '',
      yield_indoor: strain.yield_indoor || '',
      yield_outdoor: strain.yield_outdoor || '',
      description: strain.description || '',
      effects: strain.effects || '',
      flavors: strain.flavors || '',
      medical_uses: strain.medical_uses || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this strain?')) {
      try {
        await apiService.delete(endpoints.strains.delete(id));
        await fetchStrains();
      } catch (error) {
        console.error('Failed to delete strain:', error);
        setError(error.message);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStrain(null);
    setFormData({
      name: '',
      type: 'hybrid',
      genetics: '',
      thc_min: '',
      thc_max: '',
      cbd_min: '',
      cbd_max: '',
      flowering_time: '',
      yield_indoor: '',
      yield_outdoor: '',
      description: '',
      effects: '',
      flavors: '',
      medical_uses: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading strains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strain Management</h1>
          <p className="text-gray-600">Manage your cannabis strain library</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Add Strain
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Strains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strains.map((strain) => (
          <div key={strain.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{strain.name}</h3>
                <span className={`status-badge ${
                  strain.type === 'indica' ? 'bg-purple-100 text-purple-800' :
                  strain.type === 'sativa' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {strain.type}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(strain)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(strain.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {strain.genetics && (
                <p><span className="font-medium">Genetics:</span> {strain.genetics}</p>
              )}
              {(strain.thc_min || strain.thc_max) && (
                <p><span className="font-medium">THC:</span> {strain.thc_min}% - {strain.thc_max}%</p>
              )}
              {(strain.cbd_min || strain.cbd_max) && (
                <p><span className="font-medium">CBD:</span> {strain.cbd_min}% - {strain.cbd_max}%</p>
              )}
              {strain.flowering_time && (
                <p><span className="font-medium">Flowering:</span> {strain.flowering_time} days</p>
              )}
              {strain.description && (
                <p className="text-gray-600 mt-2">{strain.description}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {new Date(strain.created_at).toLocaleDateString()}</span>
                <span>{strain.batches_count || 0} batches</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {strains.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No strains found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first strain</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Your First Strain
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStrain ? 'Edit Strain' : 'Add New Strain'}
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
                  <label className="label">Strain Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="indica">Indica</option>
                    <option value="sativa">Sativa</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="label">Genetics</label>
                  <input
                    type="text"
                    name="genetics"
                    value={formData.genetics}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., OG Kush x Durban Poison"
                  />
                </div>

                <div>
                  <label className="label">Flowering Time (days)</label>
                  <input
                    type="number"
                    name="flowering_time"
                    value={formData.flowering_time}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 60"
                  />
                </div>

                <div>
                  <label className="label">THC Min %</label>
                  <input
                    type="number"
                    step="0.1"
                    name="thc_min"
                    value={formData.thc_min}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">THC Max %</label>
                  <input
                    type="number"
                    step="0.1"
                    name="thc_max"
                    value={formData.thc_max}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">CBD Min %</label>
                  <input
                    type="number"
                    step="0.1"
                    name="cbd_min"
                    value={formData.cbd_min}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">CBD Max %</label>
                  <input
                    type="number"
                    step="0.1"
                    name="cbd_max"
                    value={formData.cbd_max}
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
                  placeholder="Describe the strain characteristics..."
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
                  {editingStrain ? 'Update Strain' : 'Add Strain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Strains;