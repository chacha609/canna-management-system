import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Home, Leaf, Package, Shield, Archive, CheckSquare, MapPin, Users, Settings, BarChart3, HelpCircle, Calendar, Bell, Tags, Eye, Thermometer, Droplets, Zap, Database, FileText, AlertTriangle, Clock, Target, FlaskConical, TestTube, Beaker, Clipboard, Truck, ShoppingCart, UserCheck, Monitor, Wifi, Globe, GitBranch, Timer, TrendingUp, Activity } from 'lucide-react';

const NavigationMenu = () => {
  const [expandedSections, setExpandedSections] = useState({
    'growing-hub': true,
    'post-harvest': false,
    'quality-assurance': false,
    'inventory': false,
    'tasks': false,
    'facilities': false,
    'integrations': false,
    'admin': false,
    'reports': false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'growing-hub',
      label: 'Growing Hub',
      icon: Leaf,
      expandable: true,
      children: [
        { label: 'Strains', icon: GitBranch, path: '/strains' },
        { label: 'Batches', icon: Archive, path: '/batches' },
        { label: 'Plants', icon: Leaf, path: '/plants' },
        { label: 'Mother Plants', icon: Target, path: '/mother-plants' },
        { label: 'Clones', icon: GitBranch, path: '/clones' },
        { label: 'Room Views', icon: Monitor, path: '/room-views' },
        { label: 'Environmental Data', icon: Thermometer, path: '/environmental' },
        { label: 'Waste Tracking', icon: AlertTriangle, path: '/waste' },
        { label: 'Nutrient Recipes', icon: FlaskConical, path: '/nutrients' }
      ]
    },
    {
      id: 'post-harvest',
      label: 'Post Harvest',
      icon: Package,
      expandable: true,
      children: [
        { label: 'Harvest Management', icon: Package, path: '/harvest' },
        { label: 'Drying Rooms', icon: Thermometer, path: '/drying' },
        { label: 'Curing Process', icon: Timer, path: '/curing' },
        { label: 'Trimming', icon: Target, path: '/trimming' },
        { label: 'Processing Tasks', icon: CheckSquare, path: '/processing-tasks' },
        { label: 'Packaging', icon: Package, path: '/packaging' },
        { label: 'Yield Analytics', icon: TrendingUp, path: '/yield-analytics' }
      ]
    },
    {
      id: 'quality-assurance',
      label: 'Quality Assurance',
      icon: Shield,
      expandable: true,
      children: [
        { label: 'QA Dashboard', icon: Monitor, path: '/qa-dashboard' },
        { label: 'Labs', icon: FlaskConical, path: '/labs' },
        { label: 'Samples', icon: TestTube, path: '/samples' },
        { label: 'Retention Samples', icon: Archive, path: '/retention-samples' },
        { label: 'Test Templates', icon: FileText, path: '/test-templates' },
        { label: 'Batch Release Templates', icon: Clipboard, path: '/batch-release-templates' },
        { label: 'Batch Releases', icon: CheckSquare, path: '/batch-releases' },
        { label: 'Quality Control', icon: Shield, path: '/quality-control' },
        { label: 'Inspection Logs', icon: Eye, path: '/inspections' }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Archive,
      expandable: true,
      children: [
        { label: 'Inventory Overview', icon: Monitor, path: '/inventory-overview' },
        { label: 'Items', icon: Archive, path: '/items' },
        { label: 'Finished Products', icon: Package, path: '/finished-products' },
        { label: 'Raw Materials', icon: Database, path: '/raw-materials' },
        { label: 'Equipment', icon: Settings, path: '/equipment' },
        { label: 'Suppliers', icon: Truck, path: '/suppliers' },
        { label: 'Inbound Orders', icon: ShoppingCart, path: '/inbound-orders' },
        { label: 'Outbound Orders', icon: Truck, path: '/outbound-orders' },
        { label: 'Clients', icon: Users, path: '/clients' },
        { label: 'Label Generation', icon: Tags, path: '/labels' }
      ]
    },

    {
      id: 'facilities',
      label: 'Facilities',
      icon: MapPin,
      expandable: true,
      children: [
        { label: 'Room Management', icon: MapPin, path: '/rooms' },
        { label: 'Interactive Room Views', icon: Monitor, path: '/interactive-rooms' },
        { label: 'Environmental Monitoring', icon: Activity, path: '/environmental-monitoring' },
        { label: 'Equipment Status', icon: Settings, path: '/equipment-status' },
        { label: 'Maintenance Schedules', icon: Clock, path: '/maintenance' },
        { label: 'Capacity Planning', icon: TrendingUp, path: '/capacity-planning' }
      ]
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Wifi,
      expandable: true,
      children: [
        { label: 'Integration Dashboard', icon: Monitor, path: '/integrations-dashboard' },
        { label: 'METRC Compliance', icon: Globe, path: '/metrc' },
        { label: 'Growlink Monitoring', icon: Leaf, path: '/growlink' },
        { label: 'Altequa HVAC', icon: Thermometer, path: '/altequa' },
        { label: 'Dositron Irrigation', icon: Droplets, path: '/dositron' },
        { label: 'Google Workspace', icon: Calendar, path: '/google-workspace' },
        { label: 'Hardware Devices', icon: Zap, path: '/hardware' },
        { label: 'API Management', icon: Settings, path: '/api-management' }
      ]
    },
    {
      id: 'compliance',
      label: 'Compliance & Alerts',
      icon: Bell,
      expandable: true,
      children: [
        { label: 'Alert Dashboard', icon: Bell, path: '/alerts' },
        { label: 'Compliance Status', icon: Shield, path: '/compliance-status' },
        { label: 'Audit Trails', icon: FileText, path: '/audit-trails' },
        { label: 'Event Explorer', icon: Eye, path: '/events' },
        { label: 'Regulatory Reports', icon: BarChart3, path: '/regulatory-reports' },
        { label: 'Notification Settings', icon: Settings, path: '/notifications' },
        { label: 'Alert Rules', icon: Target, path: '/alert-rules' }
      ]
    },
    {
      id: 'tagging',
      label: 'Tags & Classification',
      icon: Tags,
      expandable: true,
      children: [
        { label: 'Tag Management', icon: Tags, path: '/tag-management' },
        { label: 'Custom Tags', icon: Target, path: '/custom-tags' },
        { label: 'Tag Analytics', icon: TrendingUp, path: '/tag-analytics' },
        { label: 'Batch Classification', icon: Archive, path: '/batch-classification' },
        { label: 'Plant Status Tags', icon: Leaf, path: '/plant-tags' },
        { label: 'Task Tags', icon: CheckSquare, path: '/task-tags' }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      expandable: true,
      children: [
        { label: 'Users', icon: Users, path: '/users' },
        { label: 'Roles & Permissions', icon: UserCheck, path: '/roles' },
        { label: 'Team Management', icon: Users, path: '/teams' },
        { label: 'System Settings', icon: Settings, path: '/system-settings' },
        { label: 'Facility Configuration', icon: MapPin, path: '/facility-config' },
        { label: 'Integration Settings', icon: Wifi, path: '/integration-settings' },
        { label: 'Backup & Recovery', icon: Archive, path: '/backup' },
        { label: 'Security Settings', icon: Shield, path: '/security' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      expandable: true,
      children: [
        { label: 'Executive Dashboard', icon: Monitor, path: '/executive-dashboard' },
        { label: 'Production Reports', icon: TrendingUp, path: '/production-reports' },
        { label: 'Quality Reports', icon: Shield, path: '/quality-reports' },
        { label: 'Financial Reports', icon: BarChart3, path: '/financial-reports' },
        { label: 'Compliance Reports', icon: FileText, path: '/compliance-reports' },
        { label: 'Environmental Reports', icon: Activity, path: '/environmental-reports' },
        { label: 'Custom Reports', icon: Target, path: '/custom-reports' },
        { label: 'Create Report', icon: FileText, path: '/create-report' },
        { label: 'Batch Record Templates', icon: Clipboard, path: '/batch-records' },
        { label: 'Data Export', icon: Database, path: '/data-export' }
      ]
    },
    {
      id: 'help',
      label: 'Help Desk',
      icon: HelpCircle,
      path: '/help'
    }
  ];

  const renderMenuItem = (item, level = 0) => {
    const IconComponent = item.icon;
    const isExpanded = expandedSections[item.id];
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="mb-1">
        <div
          className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 ${
            item.id === 'batches' || item.id === 'batch-releases' || item.id === 'items' || item.id === 'calendars' || item.id === 'events'
              ? 'bg-green-500 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => hasChildren ? toggleSection(item.id) : null}
        >
          <IconComponent size={18} className="mr-3 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {hasChildren && (
            <div className="ml-2">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 h-screen bg-gray-900 text-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-center mb-4">
          <Leaf className="h-8 w-8 text-green-500 mr-2" />
          <span className="text-lg font-bold">Cannabis Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="text-xs text-gray-400 text-center">
          System Status: Online<br />
          Last Sync: 2 minutes ago
        </div>
      </div>
    </div>
  );
};

export default NavigationMenu;