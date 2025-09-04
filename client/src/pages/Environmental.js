import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Settings,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import api from '../services/api';

const Environmental = () => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [rooms, setRooms] = useState([]);
  const [facilityOverview, setFacilityOverview] = useState({});
  const [roomData, setRoomData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [sensorTypes, setSensorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [trends, setTrends] = useState({});

  // Get user's facility ID (assuming it's stored in user context or localStorage)
  const facilityId = localStorage.getItem('facilityId') || '1';

  useEffect(() => {
    loadInitialData();
    loadSensorTypes();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadRoomData();
      loadRoomTrends();
    }
  }, [selectedRoom, selectedTimeRange]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRooms(),
        loadFacilityOverview(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get(`/rooms?facility_id=${facilityId}`);
      setRooms(response.data.data || []);
      if (response.data.data.length > 0 && !selectedRoom) {
        setSelectedRoom(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadFacilityOverview = async () => {
    try {
      const response = await api.get(`/environmental/facilities/${facilityId}/overview`);
      setFacilityOverview(response.data.data || {});
    } catch (error) {
      console.error('Error loading facility overview:', error);
    }
  };

  const loadRoomData = async () => {
    if (!selectedRoom) return;
    
    try {
      const response = await api.get(`/environmental/rooms/${selectedRoom}/latest`);
      setRoomData(response.data.data || []);
    } catch (error) {
      console.error('Error loading room data:', error);
    }
  };

  const loadRoomTrends = async () => {
    if (!selectedRoom) return;

    try {
      const days = selectedTimeRange === '24h' ? 1 : selectedTimeRange === '7d' ? 7 : 30;
      const sensorTypesToLoad = ['temperature', 'humidity', 'co2'];
      
      const trendPromises = sensorTypesToLoad.map(async (sensorType) => {
        try {
          const response = await api.get(`/environmental/rooms/${selectedRoom}/trends?sensor_type=${sensorType}&days=${days}`);
          return { sensorType, data: response.data.data || [] };
        } catch (error) {
          console.error(`Error loading trends for ${sensorType}:`, error);
          return { sensorType, data: [] };
        }
      });

      const trendResults = await Promise.all(trendPromises);
      const trendsData = {};
      trendResults.forEach(({ sensorType, data }) => {
        trendsData[sensorType] = data;
      });
      
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading room trends:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await api.get(`/environmental/alerts?facility_id=${facilityId}`);
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadSensorTypes = async () => {
    try {
      const response = await api.get('/environmental/sensor-types');
      setSensorTypes(response.data.data || []);
    } catch (error) {
      console.error('Error loading sensor types:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadFacilityOverview(),
        loadRoomData(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await api.put(`/environmental/alerts/${alertId}/acknowledge`);
      loadAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await api.put(`/environmental/alerts/${alertId}/resolve`);
      loadAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSensorIcon = (sensorType) => {
    switch (sensorType) {
      case 'temperature':
      case 'water_temperature':
        return <Thermometer className="w-5 h-5" />;
      case 'humidity':
        return <Droplets className="w-5 h-5" />;
      case 'co2':
      case 'air_flow':
        return <Wind className="w-5 h-5" />;
      case 'light_intensity':
        return <Zap className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getSensorColor = (sensorType, value) => {
    // This would typically be based on configured thresholds
    // For now, using basic color coding
    switch (sensorType) {
      case 'temperature':
        if (value < 65 || value > 85) return 'text-red-500';
        if (value < 70 || value > 80) return 'text-yellow-500';
        return 'text-green-500';
      case 'humidity':
        if (value < 40 || value > 70) return 'text-red-500';
        if (value < 45 || value > 65) return 'text-yellow-500';
        return 'text-green-500';
      case 'co2':
        if (value < 800 || value > 1500) return 'text-red-500';
        if (value < 1000 || value > 1300) return 'text-yellow-500';
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatValue = (value, unit) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}${unit}`;
    }
    return `${value}${unit}`;
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Environmental Monitoring</h1>
          <p className="text-gray-600">Real-time environmental data and alerts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.severity)}
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.triggered_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {alert.status === 'active' && (
                    <>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Room Selection</h2>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedRoom === room.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{room.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{room.room_type}</p>
              {facilityOverview[room.id] && (
                <div className="mt-2 space-y-1">
                  {Object.entries(facilityOverview[room.id].sensors || {}).slice(0, 2).map(([sensorType, data]) => (
                    <div key={sensorType} className="flex items-center justify-between text-xs">
                      <span className="capitalize">{sensorType}:</span>
                      <span className={getSensorColor(sensorType, data.value)}>
                        {formatValue(data.value, data.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Readings */}
      {roomData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current Readings - {rooms.find(r => r.id === parseInt(selectedRoom))?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {roomData.map((reading, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getSensorIcon(reading.sensor_type)}
                    <span className="font-medium text-gray-900 capitalize">
                      {reading.sensor_type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {reading.integration_source}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getSensorColor(reading.sensor_type, reading.value)}`}>
                    {formatValue(reading.value, reading.unit)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(reading.recorded_at).toLocaleTimeString()}
                  </span>
                </div>
                {reading.sensor_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sensor: {reading.sensor_id}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Charts Placeholder */}
      {Object.keys(trends).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(trends).map(([sensorType, data]) => (
              <div key={sensorType} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 capitalize mb-3">
                  {sensorType.replace('_', ' ')} Trend
                </h3>
                {data.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg: {data[data.length - 1]?.avg_value?.toFixed(1) || 'N/A'}</span>
                      <span>Min: {Math.min(...data.map(d => d.min_value)).toFixed(1)}</span>
                      <span>Max: {Math.max(...data.map(d => d.max_value)).toFixed(1)}</span>
                    </div>
                    <div className="h-20 bg-gray-200 rounded flex items-end justify-center">
                      <p className="text-gray-500 text-sm">Chart visualization would go here</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No trend data available</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facility Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Facility Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(facilityOverview).map(([roomId, roomInfo]) => (
            <div key={roomId} className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                {roomInfo.room_info?.name || `Room ${roomId}`}
              </h3>
              <p className="text-sm text-gray-600 mb-3 capitalize">
                {roomInfo.room_info?.room_type || 'Unknown'}
              </p>
              <div className="space-y-2">
                {Object.entries(roomInfo.sensors || {}).map(([sensorType, data]) => (
                  <div key={sensorType} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getSensorIcon(sensorType)}
                      <span className="text-sm capitalize">{sensorType.replace('_', ' ')}</span>
                    </div>
                    <span className={`text-sm font-medium ${getSensorColor(sensorType, data.value)}`}>
                      {formatValue(data.value, data.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Environmental;