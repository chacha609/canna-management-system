import React, { useState, useEffect } from 'react';
import { apiService, endpoints } from '../services/api';

const Compliance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrcData, setMetrcData] = useState({
    facilities: [],
    plants: [],
    harvests: [],
    packages: [],
    syncHistory: [],
    syncStats: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userApiKey, setUserApiKey] = useState('');
  const [facilityLicense, setFacilityLicense] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Test METRC connection
  const testConnection = async () => {
    if (!userApiKey) {
      setError('Please enter your METRC User API Key');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.post(endpoints.compliance.metrc.test, {
        user_api_key: userApiKey
      });

      setConnectionStatus(response.data);
      
      if (response.data.success) {
        // Fetch facilities if connection is successful
        await fetchFacilities();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError(error.message);
      setConnectionStatus({ success: false, message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch METRC facilities
  const fetchFacilities = async () => {
    if (!userApiKey) return;

    try {
      const response = await apiService.get(`${endpoints.compliance.metrc.facilities}?user_api_key=${userApiKey}`);
      setMetrcData(prev => ({ ...prev, facilities: response.data || [] }));
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
      setError(error.message);
    }
  };

  // Sync data from METRC
  const syncData = async (syncOptions = {}) => {
    if (!userApiKey || !facilityLicense) {
      setError('Please enter both User API Key and Facility License');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.post(endpoints.compliance.metrc.sync, {
        user_api_key: userApiKey,
        facility_license: facilityLicense,
        sync_options: {
          storePlants: true,
          storeHarvests: true,
          storePackages: true,
          ...syncOptions
        }
      });

      console.log('Sync completed:', response.data);
      
      // Refresh data after sync
      await Promise.all([
        fetchSyncHistory(),
        fetchSyncStats(),
        fetchStoredPlants(),
        fetchStoredHarvests(),
        fetchStoredPackages()
      ]);

    } catch (error) {
      console.error('Sync failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sync history
  const fetchSyncHistory = async () => {
    try {
      const response = await apiService.get(endpoints.compliance.metrc.syncHistory);
      setMetrcData(prev => ({ ...prev, syncHistory: response.data || [] }));
    } catch (error) {
      console.error('Failed to fetch sync history:', error);
    }
  };

  // Fetch sync statistics
  const fetchSyncStats = async () => {
    try {
      const response = await apiService.get(endpoints.compliance.metrc.syncStats);
      setMetrcData(prev => ({ ...prev, syncStats: response.data }));
    } catch (error) {
      console.error('Failed to fetch sync stats:', error);
    }
  };

  // Fetch stored plants
  const fetchStoredPlants = async () => {
    try {
      const response = await apiService.get(endpoints.compliance.metrc.storedPlants);
      setMetrcData(prev => ({ ...prev, plants: response.data || [] }));
    } catch (error) {
      console.error('Failed to fetch stored plants:', error);
    }
  };

  // Fetch stored harvests
  const fetchStoredHarvests = async () => {
    try {
      const response = await apiService.get(endpoints.compliance.metrc.storedHarvests);
      setMetrcData(prev => ({ ...prev, harvests: response.data || [] }));
    } catch (error) {
      console.error('Failed to fetch stored harvests:', error);
    }
  };

  // Fetch stored packages
  const fetchStoredPackages = async () => {
    try {
      const response = await apiService.get(endpoints.compliance.metrc.storedPackages);
      setMetrcData(prev => ({ ...prev, packages: response.data || [] }));
    } catch (error) {
      console.error('Failed to fetch stored packages:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSyncHistory();
      fetchSyncStats();
    } else if (activeTab === 'plants') {
      fetchStoredPlants();
    } else if (activeTab === 'harvests') {
      fetchStoredHarvests();
    } else if (activeTab === 'packages') {
      fetchStoredPackages();
    }
  }, [activeTab]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">METRC Compliance</h1>
          <p className="text-gray-600">Manage state compliance and METRC integration</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Connection Setup */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">METRC Connection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">METRC User API Key</label>
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              className="input-field"
              placeholder="Enter your METRC User API Key"
            />
          </div>
          <div>
            <label className="label">Facility License</label>
            <input
              type="text"
              value={facilityLicense}
              onChange={(e) => setFacilityLicense(e.target.value)}
              className="input-field"
              placeholder="Enter facility license number"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="btn-secondary"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={() => syncData()}
            disabled={isLoading || !connectionStatus?.success}
            className="btn-primary"
          >
            {isLoading ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

        {connectionStatus && (
          <div className={`mt-4 p-3 rounded-lg ${connectionStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p>{connectionStatus.message}</p>
            {connectionStatus.facilitiesCount !== undefined && (
              <p className="text-sm mt-1">Found {connectionStatus.facilitiesCount} facilities</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'plants', label: 'Plants' },
            { id: 'harvests', label: 'Harvests' },
            { id: 'packages', label: 'Packages' },
            { id: 'history', label: 'Sync History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Sync Statistics */}
          {metrcData.syncStats && metrcData.syncStats.totals ? (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Statistics (Last 30 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{metrcData.syncStats.totals.total_syncs || 0}</div>
                  <div className="text-sm text-gray-600">Total Syncs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrcData.syncStats.totals.total_success || 0}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrcData.syncStats.totals.total_errors || 0}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              {metrcData.syncStats.by_type && metrcData.syncStats.by_type.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">By Sync Type</h4>
                  <div className="space-y-2">
                    {metrcData.syncStats.by_type.map((stat) => (
                      <div key={stat.sync_type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium capitalize">{stat.sync_type.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">Total: {stat.total}</span>
                          <span className="text-green-600">Success: {stat.success}</span>
                          <span className="text-red-600">Errors: {stat.errors}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Statistics</h3>
              <p className="text-gray-500 text-center py-8">No sync statistics available. Connect to METRC and perform a sync to see statistics.</p>
            </div>
          )}

          {/* Recent Sync History */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Activity</h3>
            {metrcData.syncHistory.length > 0 ? (
              <div className="space-y-3">
                {metrcData.syncHistory.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{log.sync_type.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-600">by {log.user_name} • {formatDateTime(log.synced_at)}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sync history available</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'plants' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">METRC Plants</h3>
          {metrcData.plants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth Phase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planted Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrcData.plants.map((plant) => (
                    <tr key={plant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plant.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.state}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.growth_phase}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.strain_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.location_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(plant.planted_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No plants data available</p>
          )}
        </div>
      )}

      {activeTab === 'harvests' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">METRC Harvests</h3>
          {metrcData.harvests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrcData.harvests.map((harvest) => (
                    <tr key={harvest.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{harvest.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{harvest.harvest_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(harvest.actual_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {harvest.gross_weight} {harvest.gross_unit_of_weight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          harvest.is_finished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {harvest.is_finished ? 'Finished' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No harvests data available</p>
          )}
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">METRC Packages</h3>
          {metrcData.packages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packaged Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrcData.packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pkg.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pkg.package_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pkg.item_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkg.quantity} {pkg.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(pkg.packaged_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {pkg.is_finished && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Finished
                            </span>
                          )}
                          {pkg.is_in_transit && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              In Transit
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No packages data available</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h3>
          {metrcData.syncHistory.length > 0 ? (
            <div className="space-y-4">
              {metrcData.syncHistory.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium capitalize">{log.sync_type.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-600">by {log.user_name} • {formatDateTime(log.synced_at)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  
                  {log.sync_data && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log.sync_data, null, 2)}</pre>
                    </div>
                  )}
                  
                  {log.error_message && (
                    <div className="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm">
                      <strong>Error:</strong> {log.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No sync history available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Compliance;