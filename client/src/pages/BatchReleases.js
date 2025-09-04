
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus,
  Filter,
  Eye,
  Edit,
  Play,
  Pause,
  CheckSquare,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Package,
  FlaskConical,
  Weight,
  Camera,
  Download,
  Upload,
  X
} from 'lucide-react';
import api from '../services/api';

const BatchReleases = () => {
  const [releases, setReleases] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  // Get user's facility ID (assuming it's stored in localStorage)
  const facilityId = localStorage.getItem('facilityId') || '1';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReleases();
  }, [selectedStatus, selectedProductType]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStatusOptions(),
        loadTemplates(),
        loadAvailableBatches(),
        loadReleases(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusOptions = async () => {
    try {
      const response = await api.get('/batch-releases/status-options');
      setStatusOptions(response.data.data || []);
    } catch (error) {
      console.error('Error loading status options:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get(`/batch-releases/facilities/${facilityId}/templates`);
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadAvailableBatches = async () => {
    try {
      const response = await api.get(`/batch-releases/facilities/${facilityId}/available-batches`);
      setAvailableBatches(response.data.data || []);
    } catch (error) {
      console.error('Error loading available batches:', error);
    }
  };

  const loadReleases = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedProductType) params.append('product_type', selectedProductType);
      
      const response = await api.get(`/batch-releases/facilities/${facilityId}/releases?${params}`);
      setReleases(response.data.data || []);
    } catch (error) {
      console.error('Error loading releases:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/batch-releases/facilities/${facilityId}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'released':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'approved':
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'on_hold':
        return <Pause className="w-4 h-4 text-red-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-900';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCheckpointIcon = (checkpointType) => {
    switch (checkpointType) {
      case 'visual_inspection':
        return <Eye className="w-4 h-4" />;
      case 'weight_verification':
        return <Weight className="w-4 h-4" />;
      case 'lab_testing':
        return <FlaskConical className="w-4 h-4" />;
      case 'moisture_testing':
        return <Package className="w-4 h-4" />;
      case 'documentation_review':
        return <FileText className="w-4 h-4" />;
      default:
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const calculateProgress = (checkpointProgress) => {
    if (!checkpointProgress || checkpointProgress.total_checkpoints === 0) return 0;
    return Math.round((checkpointProgress.completed_checkpoints / checkpointProgress.total_checkpoints) * 100);
  };

  const viewReleaseDetails = async (releaseId) => {
    try {
      const response = await api.get(`/batch-releases/${releaseId}`);
      setSelectedRelease(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading release details:', error);
    }
  };

  const openCheckpointModal = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setShowCheckpointModal(true);
  };

  const completeCheckpoint = async (checkpointData) => {
    try {
      await api.put(`/batch-releases/${selectedRelease.id}/checkpoints/${selectedCheckpoint.checkpoint_id}/complete`, checkpointData);
      setShowCheckpointModal(false);
      // Refresh release details
      await viewReleaseDetails(selectedRelease.id);
      await loadReleases();
    } catch (error) {
      console.error('Error completing checkpoint:', error);
    }
  };

  const createRelease = async (releaseData) => {
    try {
      await api.post('/batch-releases', releaseData);
      setShowCreateModal(false);
      await loadReleases();
      await loadAvailableBatches();
    } catch (error) {
      console.error('Error creating release:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Batch Release Management</h1>
          <p className="text-gray-600">Quality assurance and batch release workflows</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Release Workflow
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Releases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_releases}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.by_status?.find(s => s.status === 'in_progress')?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Released</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.by_status?.find(s => s.status === 'released')?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.by_status?.find(s => s.status === 'released')?.avg_duration_hours?.toFixed(1) || '0'}h
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
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

          <select
            value={selectedProductType}
            onChange={(e) => setSelectedProductType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Product Types</option>
            <option value="flower">Flower</option>
            <option value="concentrate">Concentrate</option>
            <option value="edible">Edible</option>
            <option value="topical">Topical</option>
          </select>

          {(selectedStatus || selectedProductType) && (
            <button
              onClick={() => {
                setSelectedStatus('');
                setSelectedProductType('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Releases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Batch Releases</h2>
        </div>
        
        {releases.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No batch releases found</p>
            <p className="text-sm">Create your first batch release workflow to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Release
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processing Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {releases.map((release) => (
                  <tr key={release.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {release.release_number}
                        </div>
                        <div className="text-sm text-gray-500">{release.template_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(release.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(release.status)}`}>
                          {statusOptions.find(s => s.status === release.status)?.name || release.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {release.processing_batch_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {release.strain_name} • {release.processing_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                        {release.product_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${calculateProgress(release.checkpoint_progress)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {release.checkpoint_progress?.completed_checkpoints || 0}/
                          {release.checkpoint_progress?.total_checkpoints || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">Started: {formatDate(release.initiated_at)}</div>
                        <div className="text-gray-500">
                          {release.actual_completion_date 
                            ? `Completed: ${formatDate(release.actual_completion_date)}`
                            : `Target: ${formatDate(release.target_completion_date)}`
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewReleaseDetails(release.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(release.status === 'in_progress' || release.status === 'pending') && (
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

      {/* Create Release Modal */}
      {showCreateModal && (
        <CreateReleaseModal
          templates={templates}
          availableBatches={availableBatches}
          facilityId={facilityId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={createRelease}
        />
      )}

      {/* Release Details Modal */}
      {showDetailsModal && selectedRelease && (
        <ReleaseDetailsModal
          release={selectedRelease}
          onClose={() => setShowDetailsModal(false)}
          onCheckpointClick={openCheckpointModal}
        />
      )}

      {/* Checkpoint Modal */}
      {showCheckpointModal && selectedCheckpoint && (
        <CheckpointModal
          checkpoint={selectedCheckpoint}
          onClose={() => setShowCheckpointModal(false)}
          onSubmit={completeCheckpoint}
        />
      )}
    </div>
  );
};

// Create Release Modal Component
const CreateReleaseModal = ({ templates, availableBatches, facilityId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    facility_id: facilityId,
    processing_batch_id: '',
    template_id: '',
    target_completion_date: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create Batch Release Workflow</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processing Batch
            </label>
            <select
              value={formData.processing_batch_id}
              onChange={(e) => setFormData({...formData, processing_batch_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select processing batch...</option>
              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.processing_batch_number} - {batch.strain_name} ({batch.processing_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Template
            </label>
            <select
              value={formData.template_id}
              onChange={(e) => setFormData({...formData, template_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.product_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Completion Date
            </label>
            <input
              type="datetime-local"
              value={formData.target_completion_date}
              onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Optional notes about this release workflow..."
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
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              Create Release Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Release Details Modal Component
const ReleaseDetailsModal = ({ release, onClose, onCheckpointClick }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Release Details - {release.release_number}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basic Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{release.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Batch:</span>
                <span className="font-medium">{release.processing_batch?.processing_batch_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Strain:</span>
                <span className="font-medium">{release.processing_batch?.strain_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Template:</span>
                <span className="font-medium">{release.template?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Initiated:</span>
                <span className="font-medium">{new Date(release.initiated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Processing Batch Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Processing Batch Details</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{release.processing_batch?.processing_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Output Weight:</span>
                <span className="font-medium">{release.processing_batch?.output_weight}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room:</span>
                <span className="font-medium">{release.processing_batch?.room_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Source Batch:</span>
                <span className="font-medium">{release.processing_batch?.source_batch_number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Control Checkpoints */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Quality Control Checkpoints</h4>
          <div className="space-y-3">
            {release.checkpoint_results?.map((checkpoint) => (
              <div key={checkpoint.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCheckpointIcon(checkpoint.checkpoint_type)}
                    <div>
                      <h5 className="font-medium text-gray-900">{checkpoint.checkpoint_name}</h5>
                      <p className="text-sm text-gray-600 capitalize">{checkpoint.checkpoint_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      checkpoint.status === 'passed' ? 'bg-green-100 text-green-800' :
                      checkpoint.status === 'failed' ? 'bg-red-100 text-red-800' :
                      checkpoint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {checkpoint.status}
                    </span>
                    {checkpoint.status === 'pending' && (
                      <button
                        onClick={() => onCheckpointClick(checkpoint)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
                {checkpoint.inspector_notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {checkpoint.inspector_notes}
                  </div>
                )}
                {checkpoint.completed_at && (
                  <div className="mt-2 text-xs text-gray-500">
                    Completed by {checkpoint.inspector_name} on {new Date(checkpoint.completed_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Approvals */}
        {release.approvals && release.approvals.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-4">Approval Chain</h4>
            <div className="space-y-3">
              {release.approvals.map((approval) => (
                <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4" />
                      <div>
                        <h5 className="font-medium text-gray-900">{approval.role_name}</h5>
                        <p className="text-sm text-gray-600">
                          {approval.approver_name || 'Pending assignment'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                      approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {approval.status}
                    </span>
                  </div>
                  {approval.approval_notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Notes:</strong> {approval.approval_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log */}
        {release.audit_log && release.audit_log.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-4">Activity Log</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {release.audit_log.map((log) => (
                <div key={log.id} className="text-sm border-l-2 border-gray-200 pl-3 py-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{log.action.replace('_', ' ')}</span>
                    <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-600">by {log.user_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {release.status === 'approved' && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
              Release to Inventory
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Checkpoint Modal Component
const CheckpointModal = ({ checkpoint, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    passed: true,
    data: {},
    photos: [],
    notes: '',
    failure_reason: '',
    corrective_actions: [],
    requires_retest: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Complete Checkpoint: {checkpoint.checkpoint_name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Result
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="passed"
                  checked={formData.passed === true}
                  onChange={() => setFormData({...formData, passed: true})}
                  className="mr-2"
                />
                <span className="text-green-600">Pass</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="passed"
                  checked={formData.passed === false}
                  onChange={() => setFormData({...formData, passed: false})}
                  className="mr-2"
                />
                <span className="text-red-600">Fail</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inspector Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter inspection notes..."
            />
          </div>

          {!formData.passed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Failure Reason
              </label>
              <textarea
                value={formData.failure_reason}
                onChange={(e) => setFormData({...formData, failure_reason: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe the reason for failure..."
                required={!formData.passed}
              />
            </div>
          )}

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
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                formData.passed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {formData.passed ? 'Mark as Passed' : 'Mark as Failed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to get checkpoint icon (moved outside component to avoid redefinition)
const getCheckpointIcon = (checkpointType) => {
  switch (checkpointType) {
    case 'visual_inspection':
      return <Eye className="w-4 h-4" />;
    case 'weight_verification':
      return <Weight className="w-4 h-4" />;
    case 'lab_testing':
      return <FlaskConical className="w-4 h-4" />;
    case 'moisture_testing':
      return <Package className="w-4 h-4" />;
    case 'documentation_review':
      return <FileText className="w-4 h-4" />;
    default:
      return <CheckSquare className="w-4 h-4" />;
  }
};

export default BatchReleases;