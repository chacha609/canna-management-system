import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Strains from './pages/Strains';
import Batches from './pages/Batches';
import Plants from './pages/Plants';
import Rooms from './pages/Rooms';
import Tasks from './pages/Tasks';
import Inventory from './pages/Inventory';
import Environmental from './pages/Environmental';
import Processing from './pages/Processing';
import Compliance from './pages/Compliance';
import BatchReleases from './pages/BatchReleases';
import Users from './pages/Users';
import Reports from './pages/Reports';
import ProductionReports from './pages/ProductionReports';
import Settings from './pages/Settings';
import TagManagement from './pages/TagManagement';
import NotFound from './pages/NotFound';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* Dashboard */}
                <Route index element={<Dashboard />} />
                
                {/* Growing Hub */}
                <Route path="strains" element={<Strains />} />
                <Route path="batches" element={<Batches />} />
                <Route path="plants" element={<Plants />} />
                <Route path="rooms" element={<Rooms />} />
                
                {/* Operations */}
                <Route path="tasks" element={<Tasks />} />
                <Route path="inventory" element={<Inventory />} />
                
                {/* Environmental Monitoring */}
                <Route path="environmental" element={<Environmental />} />
                
                {/* Post Harvest Processing */}
                <Route path="processing" element={<Processing />} />
                <Route path="harvest" element={<Processing />} />
                <Route path="drying" element={<Processing />} />
                <Route path="curing" element={<Processing />} />
                <Route path="trimming" element={<Processing />} />
                <Route path="processing-tasks" element={<Processing />} />
                <Route path="packaging" element={<Processing />} />
                
                {/* Compliance */}
                <Route path="compliance" element={<Compliance />} />
                <Route path="metrc" element={<Compliance />} />
                <Route path="compliance-status" element={<Compliance />} />
                <Route path="audit-trails" element={<Compliance />} />
                <Route path="events" element={<Compliance />} />
                <Route path="regulatory-reports" element={<Compliance />} />
                <Route path="notifications" element={<Settings />} />
                <Route path="alert-rules" element={<Settings />} />
                <Route path="alerts" element={<Compliance />} />
                
                {/* New Navigation Routes - Growing Hub */}
                <Route path="mother-plants" element={<Plants />} />
                <Route path="clones" element={<Plants />} />
                <Route path="room-views" element={<Rooms />} />
                <Route path="waste" element={<Environmental />} />
                <Route path="nutrients" element={<Inventory />} />
                
                {/* New Navigation Routes - Quality Assurance */}
                <Route path="qa-dashboard" element={<Reports />} />
                <Route path="labs" element={<Compliance />} />
                <Route path="samples" element={<Compliance />} />
                <Route path="retention-samples" element={<Compliance />} />
                <Route path="test-templates" element={<Settings />} />
                <Route path="batch-release-templates" element={<Settings />} />
                <Route path="batch-releases" element={<BatchReleases />} />
                <Route path="quality-control" element={<Compliance />} />
                <Route path="inspections" element={<Compliance />} />
                
                {/* New Navigation Routes - Inventory */}
                <Route path="inventory-overview" element={<Inventory />} />
                <Route path="items" element={<Inventory />} />
                <Route path="finished-products" element={<Inventory />} />
                <Route path="raw-materials" element={<Inventory />} />
                <Route path="equipment" element={<Inventory />} />
                <Route path="suppliers" element={<Inventory />} />
                <Route path="inbound-orders" element={<Inventory />} />
                <Route path="outbound-orders" element={<Inventory />} />
                <Route path="clients" element={<Users />} />
                <Route path="labels" element={<Inventory />} />
                
                {/* New Navigation Routes - Tasks & Scheduling */}
                <Route path="task-templates" element={<Tasks />} />
                <Route path="schedules" element={<Tasks />} />
                <Route path="calendar" element={<Tasks />} />
                <Route path="team-tasks" element={<Tasks />} />
                
                {/* New Navigation Routes - Facilities */}
                <Route path="interactive-rooms" element={<Rooms />} />
                <Route path="environmental-monitoring" element={<Environmental />} />
                <Route path="equipment-status" element={<Environmental />} />
                <Route path="maintenance" element={<Tasks />} />
                <Route path="capacity-planning" element={<Reports />} />
                
                {/* New Navigation Routes - Integrations */}
                <Route path="integrations-dashboard" element={<Settings />} />
                <Route path="growlink" element={<Environmental />} />
                <Route path="altequa" element={<Environmental />} />
                <Route path="dositron" element={<Environmental />} />
                <Route path="google-workspace" element={<Settings />} />
                <Route path="hardware" element={<Settings />} />
                <Route path="api-management" element={<Settings />} />
                
                {/* New Navigation Routes - Tags & Classification */}
                <Route path="tag-management" element={<TagManagement />} />
                <Route path="custom-tags" element={<TagManagement />} />
                <Route path="tag-analytics" element={<TagManagement />} />
                <Route path="batch-classification" element={<Batches />} />
                <Route path="plant-tags" element={<Plants />} />
                <Route path="task-tags" element={<Tasks />} />
                
                {/* New Navigation Routes - Admin */}
                <Route path="roles" element={<Users />} />
                <Route path="teams" element={<Users />} />
                <Route path="system-settings" element={<Settings />} />
                <Route path="facility-config" element={<Settings />} />
                <Route path="integration-settings" element={<Settings />} />
                <Route path="backup" element={<Settings />} />
                <Route path="security" element={<Settings />} />
                
                {/* New Navigation Routes - Reports & Analytics */}
                <Route path="executive-dashboard" element={<Reports />} />
                <Route path="production-reports" element={<ProductionReports />} />
                <Route path="quality-reports" element={<Reports />} />
                <Route path="financial-reports" element={<Reports />} />
                <Route path="compliance-reports" element={<Reports />} />
                <Route path="environmental-reports" element={<Reports />} />
                <Route path="custom-reports" element={<Reports />} />
                <Route path="create-report" element={<Reports />} />
                <Route path="batch-records" element={<Reports />} />
                <Route path="data-export" element={<Reports />} />
                
                {/* Help */}
                <Route path="help" element={<Settings />} />
                
                {/* Management */}
                <Route path="users" element={<Users />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
      
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;