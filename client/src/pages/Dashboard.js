import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, endpoints } from '../services/api';

const Dashboard = () => {
  const { user, facility } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPlants: 0,
      activeBatches: 0,
      pendingTasks: 0,
      lowInventory: 0
    },
    recentActivity: [],
    upcomingTasks: [],
    alerts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(endpoints.reports.dashboard);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link }) => (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {link && (
          <Link
            to={link}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{activity.description}</p>
        <p className="text-xs text-gray-500">{activity.timestamp}</p>
      </div>
    </div>
  );

  const TaskItem = ({ task }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{task.title}</p>
        <p className="text-xs text-gray-500">Due: {task.due_date}</p>
      </div>
      <span className={`status-badge ${
        task.priority === 'high' ? 'status-error' : 
        task.priority === 'medium' ? 'status-warning' : 
        'status-active'
      }`}>
        {task.priority}
      </span>
    </div>
  );

  const AlertItem = ({ alert }) => (
    <div className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
      <div className={`w-3 h-3 rounded-full mr-3 ${
        alert.severity === 'critical' ? 'bg-red-500' :
        alert.severity === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
      }`}></div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{alert.message}</p>
        <p className="text-xs text-gray-500">{alert.timestamp}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600">
            {facility?.name || 'Cannabis Management System'} • {new Date().toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-secondary"
          disabled={isLoading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error loading dashboard: {error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Plants"
          value={dashboardData.stats.totalPlants}
          icon="🌱"
          color="bg-green-100"
          link="/plants"
        />
        <StatCard
          title="Active Batches"
          value={dashboardData.stats.activeBatches}
          icon="📦"
          color="bg-blue-100"
          link="/batches"
        />
        <StatCard
          title="Pending Tasks"
          value={dashboardData.stats.pendingTasks}
          icon="✅"
          color="bg-yellow-100"
          link="/tasks"
        />
        <StatCard
          title="Low Inventory"
          value={dashboardData.stats.lowInventory}
          icon="⚠️"
          color="bg-red-100"
          link="/inventory"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link to="/audit-trails" className="text-green-600 hover:text-green-700 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-1">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))
            ) : (
              <p className="text-gray-500 text-sm py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
            <Link to="/tasks" className="text-green-600 hover:text-green-700 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-1">
            {dashboardData.upcomingTasks.length > 0 ? (
              dashboardData.upcomingTasks.map((task, index) => (
                <TaskItem key={index} task={task} />
              ))
            ) : (
              <p className="text-gray-500 text-sm py-4">No upcoming tasks</p>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <Link to="/alerts" className="text-green-600 hover:text-green-700 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-1">
            {dashboardData.alerts.length > 0 ? (
              dashboardData.alerts.map((alert, index) => (
                <AlertItem key={index} alert={alert} />
              ))
            ) : (
              <p className="text-gray-500 text-sm py-4">No active alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link
            to="/plants"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
          >
            <span className="text-2xl mb-2">🌱</span>
            <span className="text-sm font-medium text-gray-700">Add Plant</span>
          </Link>
          <Link
            to="/batches"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
          >
            <span className="text-2xl mb-2">📦</span>
            <span className="text-sm font-medium text-gray-700">New Batch</span>
          </Link>
          <Link
            to="/tasks"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
          >
            <span className="text-2xl mb-2">✅</span>
            <span className="text-sm font-medium text-gray-700">Create Task</span>
          </Link>
          <Link
            to="/inventory"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
          >
            <span className="text-2xl mb-2">📦</span>
            <span className="text-sm font-medium text-gray-700">Inventory</span>
          </Link>
          <Link
            to="/reports"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
          >
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700">Reports</span>
          </Link>
          <Link
            to="/settings"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
          >
            <span className="text-2xl mb-2">⚙️</span>
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;