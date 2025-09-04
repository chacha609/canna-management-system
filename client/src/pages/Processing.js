import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Thermometer, 
  Timer, 
  Scissors, 
  FlaskConical,
  Plus,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Weight,
  Droplets,
  BarChart3,
  Eye,
  Edit,
  Play,
  Pause,
  CheckSquare
} from 'lucide-react';
import api from '../services/api';

const Processing = () => {
  const [processingBatches, setProcessingBatches] = useState([]);
  const [processingTypes, setProcessingTypes] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Get user's facility ID (assuming it's stored in localStorage)
  const facilityId = localStorage.getItem('facilityId') || '1';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProcessingBatches();
  }, [selectedType, selectedStatus]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProcessingTypes(),
        loadStatusOptions(),
        loadProcessingBatches(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcessingTypes = async () => {
    try {
      const response = await api.get('/processing/types');
      setProcessingTypes(response.data.data || []);
    } catch (error) {
      console.error('Error loading processing types:', error);
    }
  };

  const loadStatusOptions = async () => {
    try {
      const response = await api.get('/processing/status-options');
      setStatusOptions(response.data.data || []);
    } catch (error) {
      console.error('Error loading status options:', error);
    }
  };

  const loadProcessingBatches = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType) params.append('processing_type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      
      const response = await api.get(`/processing/facilities/${facilityId}/batches?${params}`);
      setProcessingBatches(response.data.data || []);
    } catch (error) {
      console.error('Error loading processing batches:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/processing/facilities/${facilityId}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading processing stats:', error);
    }
  };

  const getProcessingIcon = (type) => {
    switch (type) {
      case 'drying':
        return <Thermometer className="w-5 h-5" />;
      case 'curing':
        return <Timer className="w-5 h-5" />;
      case 'trimming':
        return <Scissors className="w-5 h-5" />;
      case 'extraction':
        return <FlaskConical className="w-5 h-5" />;
      case 'packaging':
        return <Package className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'on_hold':
        return <Pause className="w-4 h-4 text-red-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateYieldPercentage = (batch) => {
    if (batch.output_weight && batch.input_weight) {
      return ((batch.output_weight / batch.input_weight) * 100).toFixed(1);
    }
    if (batch.current_weight && batch.input_weight) {
      return ((batch.current_weight / batch.input_weight) * 100).toFixed(1);
    }
    return 'N/A';
  };

  const formatWeight = (weight) => {
    if (!weight) return 'N/A';
    return `${parseFloat(weight).toLocaleString()}g`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const viewBatchDetails = async (batchId) => {
    try {
      const response = await api.get(`/processing/batches/${batchId}`);
      setSelectedBatch(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading batch details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processing Management</h1>
          <p className="text-gray-600">Manage post-harvest processing operations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Processing Batch
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Batches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_batches}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.by_type?.reduce((sum, type) => sum + type.batch_count, 0) || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Input Weight</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatWeight(stats.by_type?.reduce((sum, type) => sum + parseFloat(type.total_input_weight || 0), 0) || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Weight className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Yield</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.by_type?.length > 0
                    ? (stats.by_type.reduce((sum, type) => sum + parseFloat(type.avg_yield_percentage || 0), 0) / stats.by_type.length).toFixed(1)
                    : '0'}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Type Statistics */}
      {stats && stats.by_type && stats.by_type.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Statistics by Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.by_type.map((typeStats) => (
              <div key={typeStats.processing_type} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getProcessingIcon(typeStats.processing_type)}
                    <span className="font-medium capitalize">{typeStats.processing_type}</span>
                  </div>
                  <span className="text-sm text-gray-600">{typeStats.batch_count} batches</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Input:</span>
                    <span>{formatWeight(typeStats.total_input_weight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output:</span>
                    <span>{formatWeight(typeStats.total_output_weight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Yield:</span>
                    <span className="font-medium">{typeStats.avg_yield_percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Types</option>
            {processingTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {type.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status.status} value={status.status}>
                {status.name}
              </option>
            ))}
          </select>

          {(selectedType || selectedStatus) && (
            <button
              onClick={() => {
                setSelectedType('');
                setSelectedStatus('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Processing Batches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Processing Batches</h2>
        </div>
        
        {processingBatches.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No processing batches found</p>
            <p className="text-sm">Create your first processing batch to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moisture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processingBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {batch.processing_batch_number}
                        </div>
                        {batch.room && (
                          <div className="text-sm text-gray-500">{batch.room.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getProcessingIcon(batch.processing_type)}
                        <span className="text-sm text-gray-900 capitalize">
                          {batch.processing_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(batch.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                          {statusOptions.find(s => s.status === batch.status)?.name || batch.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {batch.source_batch?.batch_number || 'N/A'}
                      </div>
                      {batch.source_batch?.strain_name && (
                        <div className="text-sm text-gray-500">{batch.source_batch.strain_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatWeight(batch.current_weight || batch.output_weight)} / {formatWeight(batch.input_weight)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Yield: {calculateYieldPercentage(batch)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {batch.moisture_content_current ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{batch.moisture_content_current}%</div>
                          <div className="text-gray-500">Target: {batch.moisture_content_target}%</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">Started: {formatDate(batch.start_date)}</div>
                        <div className="text-gray-500">
                          {batch.actual_completion_date 
                            ? `Completed: ${formatDate(batch.actual_completion_date)}`
                            : `Expected: ${formatDate(batch.expected_completion_date)}`
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewBatchDetails(batch.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {batch.status === 'in_progress' && (
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Details Modal */}
      {showDetailsModal && selectedBatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Processing Batch Details - {selectedBatch.processing_batch_number}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Type:</span>
                    <span className="font-medium capitalize">{selectedBatch.processing_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBatch.status)}`}>
                      {statusOptions.find(s => s.status === selectedBatch.status)?.name || selectedBatch.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">{selectedBatch.room?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source Batch:</span>
                    <span className="font-medium">{selectedBatch.source_batch?.batch_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strain:</span>
                    <span className="font-medium">{selectedBatch.source_batch?.strain_name}</span>
                  </div>
                </div>
              </div>

              {/* Weight Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Weight Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Input Weight:</span>
                    <span className="font-medium">{formatWeight(selectedBatch.input_weight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Weight:</span>
                    <span className="font-medium">{formatWeight(selectedBatch.current_weight)}</span>
                  </div>
                  {selectedBatch.output_weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Output Weight:</span>
                      <span className="font-medium">{formatWeight(selectedBatch.output_weight)}</span>
                    </div>
                  )}
                  {selectedBatch.waste_weight > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waste Weight:</span>
                      <span className="font-medium">{formatWeight(selectedBatch.waste_weight)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Yield:</span>
                    <span className="font-medium">{calculateYieldPercentage(selectedBatch)}%</span>
                  </div>
                </div>
              </div>

              {/* Moisture Content */}
              {(selectedBatch.moisture_content_start || selectedBatch.moisture_content_current) && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Moisture Content</h4>
                  <div className="space-y-2 text-sm">
                    {selectedBatch.moisture_content_start && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start:</span>
                        <span className="font-medium">{selectedBatch.moisture_content_start}%</span>
                      </div>
                    )}
                    {selectedBatch.moisture_content_current && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current:</span>
                        <span className="font-medium">{selectedBatch.moisture_content_current}%</span>
                      </div>
                    )}
                    {selectedBatch.moisture_content_target && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium">{selectedBatch.moisture_content_target}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(selectedBatch.start_date)}</span>
                  </div>
                  {selectedBatch.expected_completion_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Completion:</span>
                      <span className="font-medium">{formatDate(selectedBatch.expected_completion_date)}</span>
                    </div>
                  )}
                  {selectedBatch.actual_completion_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Completion:</span>
                      <span className="font-medium">{formatDate(selectedBatch.actual_completion_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Processing Parameters */}
            {selectedBatch.processing_parameters && Object.keys(selectedBatch.processing_parameters).length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Processing Parameters</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {Object.entries(selectedBatch.processing_parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedBatch.notes && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedBatch.notes}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedBatch.status === 'in_progress' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                  Update Progress
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Processing;