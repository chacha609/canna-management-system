import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Calendar,
  Download,
  Plus,
  Filter,
  Search,
  Clock,
  TrendingUp,
  Shield,
  Activity,
  Target,
  Monitor,
  Database,
  Bookmark,
  Play,
  Pause,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { LineChart, BarChart, PieChart, ChartContainer } from '../components/charts';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsRes, templatesRes, schedulesRes, analyticsRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/reports/templates'),
        fetch('/api/reports/schedules'),
        fetch('/api/reports/analytics')
      ]);

      const [reportsData, templatesData, schedulesData, analyticsData] = await Promise.all([
        reportsRes.json(),
        templatesRes.json(),
        schedulesRes.json(),
        analyticsRes.json()
      ]);

      setReports(reportsData.data || []);
      setTemplates(templatesData.data || []);
      setSchedules(schedulesData.data || []);
      setAnalytics(analyticsData.data || {});
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'production': return TrendingUp;
      case 'inventory': return Database;
      case 'financial': return BarChart3;
      case 'compliance': return Shield;
      case 'environmental': return Activity;
      default: return FileText;
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'production': return 'text-green-600 bg-green-100';
      case 'inventory': return 'text-blue-600 bg-blue-100';
      case 'financial': return 'text-purple-600 bg-purple-100';
      case 'compliance': return 'text-red-600 bg-red-100';
      case 'environmental': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.report_type === filterType;
    return matchesSearch && matchesType;
  });

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary?.total_reports || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Period</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary?.reports_this_period || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Generation Time</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary?.avg_generation_time || 0}min</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Popular</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{analytics.summary?.most_popular_type || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Type */}
        <ChartContainer title="Reports by Type" className="bg-white">
          <BarChart
            data={analytics?.by_type || []}
            xKey="report_type"
            yKey="count"
            color="#3B82F6"
          />
        </ChartContainer>

        {/* Generation Times */}
        <ChartContainer title="Generation Times" className="bg-white">
          <LineChart
            data={analytics?.generation_times || []}
            xKey="date"
            yKey="avg_time"
            color="#10B981"
          />
        </ChartContainer>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/create-report"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Create Report</p>
              <p className="text-sm text-gray-500">Generate new report</p>
            </div>
          </Link>

          <Link
            to="/production-reports"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Production Reports</p>
              <p className="text-sm text-gray-500">Yield & batch analytics</p>
            </div>
          </Link>

          <Link
            to="/financial-reports"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Financial Reports</p>
              <p className="text-sm text-gray-500">Revenue & costs</p>
            </div>
          </Link>

          <Link
            to="/compliance-reports"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Compliance Reports</p>
              <p className="text-sm text-gray-500">Regulatory status</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="production">Production</option>
              <option value="inventory">Inventory</option>
              <option value="financial">Financial</option>
              <option value="compliance">Compliance</option>
              <option value="environmental">Environmental</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredReports.map((report) => {
            const IconComponent = getReportTypeIcon(report.report_type);
            const colorClass = getReportTypeColor(report.report_type);
            
            return (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{report.name}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {report.template_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'completed' ? 'bg-green-100 text-green-800' :
                          report.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Report Templates</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const IconComponent = getReportTypeIcon(template.report_type);
            const colorClass = getReportTypeColor(template.report_type);
            
            return (
              <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                    <span className="text-sm text-gray-500 capitalize">{template.report_type}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.is_system_template ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_system_template ? 'System' : 'Custom'}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Play className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSchedules = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Scheduled Reports</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Schedule
          </button>
        </div>
        
        <div className="divide-y divide-gray-200">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{schedule.name}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">{schedule.template_name}</span>
                    <span className="text-sm text-gray-500 capitalize">{schedule.frequency}</span>
                    <span className="text-sm text-gray-500">
                      Next: {new Date(schedule.next_run).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {schedule.is_active ? 'Active' : 'Inactive'}
                </span>
                
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Generate, schedule, and manage comprehensive reports
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <Link
                to="/create-report"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Report
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Monitor },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'templates', label: 'Templates', icon: Target },
              { id: 'schedules', label: 'Schedules', icon: Calendar }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'templates' && renderTemplates()}
      {activeTab === 'schedules' && renderSchedules()}
    </div>
  );
};

export default Reports;