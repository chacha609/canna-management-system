import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Leaf,
  Package,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { LineChart, BarChart, PieChart, ChartContainer } from '../components/charts';

const ProductionReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedStrains, setSelectedStrains] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);

  useEffect(() => {
    fetchProductionData();
  }, [dateRange, selectedStrains, selectedRooms]);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      // Simulate API call with mock data
      const mockData = {
        summary: {
          totalYield: 125.5,
          totalBatches: 8,
          avgYieldPerPlant: 2.1,
          avgCycleTime: 14.2,
          topStrain: 'Blue Dream',
          efficiency: 87.3
        },
        yieldByStrain: [
          { strain: 'Blue Dream', yield: 45.2, batches: 3, efficiency: 92.1 },
          { strain: 'OG Kush', yield: 38.7, batches: 2, efficiency: 85.4 },
          { strain: 'White Widow', yield: 41.6, batches: 3, efficiency: 89.2 },
          { strain: 'Purple Haze', yield: 28.3, batches: 2, efficiency: 78.9 },
          { strain: 'Sour Diesel', yield: 35.1, batches: 2, efficiency: 83.7 }
        ],
        yieldOverTime: [
          { date: '2025-01-01', yield: 12.5, batches: 1 },
          { date: '2025-01-08', yield: 18.3, batches: 2 },
          { date: '2025-01-15', yield: 22.1, batches: 2 },
          { date: '2025-01-22', yield: 28.4, batches: 3 },
          { date: '2025-01-29', yield: 44.2, batches: 4 }
        ],
        batchStatus: [
          { status: 'Completed', count: 5, percentage: 62.5 },
          { status: 'Flowering', count: 2, percentage: 25.0 },
          { status: 'Vegetative', count: 1, percentage: 12.5 }
        ],
        roomPerformance: [
          { room: 'Flower Room 1', yield: 52.3, batches: 4, utilization: 95.2 },
          { room: 'Flower Room 2', yield: 43.8, batches: 3, utilization: 87.6 },
          { room: 'Flower Room 3', yield: 29.4, batches: 2, utilization: 78.3 }
        ],
        cycleTimeAnalysis: [
          { stage: 'Seedling', avgDays: 14, minDays: 10, maxDays: 18 },
          { stage: 'Vegetative', avgDays: 28, minDays: 21, maxDays: 35 },
          { stage: 'Flowering', avgDays: 63, minDays: 56, maxDays: 70 },
          { stage: 'Drying', avgDays: 7, minDays: 5, maxDays: 10 },
          { stage: 'Curing', avgDays: 14, minDays: 10, maxDays: 21 }
        ],
        qualityMetrics: [
          { metric: 'THC Content', value: 22.3, target: 20.0, unit: '%' },
          { metric: 'CBD Content', value: 1.8, target: 2.0, unit: '%' },
          { metric: 'Moisture Content', value: 11.2, target: 12.0, unit: '%' },
          { metric: 'Terpene Profile', value: 2.1, target: 2.5, unit: '%' }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching production data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchProductionData();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting production report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Production Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive yield analytics and production performance metrics
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">All Strains</option>
                <option value="blue-dream">Blue Dream</option>
                <option value="og-kush">OG Kush</option>
                <option value="white-widow">White Widow</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">All Rooms</option>
                <option value="flower-1">Flower Room 1</option>
                <option value="flower-2">Flower Room 2</option>
                <option value="flower-3">Flower Room 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Yield</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalYield} kg</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalBatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Leaf className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Yield/Plant</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.avgYieldPerPlant} kg</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Cycle Time</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.avgCycleTime} weeks</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Strain</p>
                <p className="text-lg font-bold text-gray-900">{data.summary.topStrain}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Zap className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.efficiency}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yield Over Time */}
          <ChartContainer title="Yield Over Time" className="bg-white">
            <LineChart
              data={data.yieldOverTime}
              xKey="date"
              yKey="yield"
              color="#10B981"
              formatXAxis={(value) => new Date(value).toLocaleDateString()}
              formatYAxis={(value) => `${value} kg`}
            />
          </ChartContainer>

          {/* Yield by Strain */}
          <ChartContainer title="Yield by Strain" className="bg-white">
            <BarChart
              data={data.yieldByStrain}
              xKey="strain"
              yKey="yield"
              color="#3B82F6"
              formatYAxis={(value) => `${value} kg`}
            />
          </ChartContainer>

          {/* Batch Status Distribution */}
          <ChartContainer title="Batch Status Distribution" className="bg-white">
            <PieChart
              data={data.batchStatus}
              dataKey="count"
              nameKey="status"
              colors={['#10B981', '#F59E0B', '#EF4444']}
            />
          </ChartContainer>

          {/* Room Performance */}
          <ChartContainer title="Room Performance" className="bg-white">
            <BarChart
              data={data.roomPerformance}
              xKey="room"
              yKey="yield"
              color="#8B5CF6"
              formatYAxis={(value) => `${value} kg`}
            />
          </ChartContainer>
        </div>
      )}

      {/* Detailed Tables */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cycle Time Analysis */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Cycle Time Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.cycleTimeAnalysis.map((stage, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stage.stage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stage.avgDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stage.minDays}-{stage.maxDays} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quality Metrics</h3>
            </div>
            <div className="p-6 space-y-4">
              {data.qualityMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                    <p className="text-xs text-gray-500">Target: {metric.target}{metric.unit}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.value >= metric.target ? 'bg-green-600' : 'bg-yellow-600'
                        }`}
                        style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {metric.value}{metric.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strain Performance Details */}
      {data && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Strain Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Yield (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Yield/Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.yieldByStrain.map((strain, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {strain.strain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {strain.yield}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {strain.batches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(strain.yield / strain.batches).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        strain.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                        strain.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {strain.efficiency}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionReports;