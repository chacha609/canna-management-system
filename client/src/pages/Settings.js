import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user, hasPermission } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={user?.first_name || ''}
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={user?.last_name || ''}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input-field"
                  defaultValue={user?.email || ''}
                />
              </div>
              <div className="flex justify-end">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input-field" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input-field" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input-field" />
              </div>
              <div className="flex justify-end">
                <button className="btn-primary">Update Password</button>
              </div>
            </div>
          </div>

          {hasPermission('admin') && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive email alerts for important events</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    defaultChecked
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Auto Backup</h4>
                    <p className="text-sm text-gray-600">Automatically backup data daily</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    defaultChecked
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">METRC Integration</h4>
                    <p className="text-sm text-gray-600">Enable automatic METRC synchronization</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Facility:</span>
                <span className="font-medium">{user?.facility?.name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last login:</span>
                <span className="font-medium">
                  {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                📊 Export My Data
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                🔔 Notification Preferences
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                🔐 Two-Factor Authentication
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                📱 Mobile App Setup
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Support</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                📚 Documentation
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                💬 Contact Support
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                🐛 Report Bug
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                💡 Feature Request
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;