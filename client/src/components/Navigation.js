import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Leaf,
  Package,
  Shield,
  Archive,
  CheckSquare,
  MapPin,
  Users,
  Settings,
  BarChart3,
  HelpCircle,
  Calendar,
  Bell,
  Tags,
  Eye,
  Thermometer,
  Droplets,
  Zap,
  Database,
  FileText,
  AlertTriangle,
  Clock,
  Target,
  FlaskConical,
  TestTube,
  Clipboard,
  Truck,
  ShoppingCart,
  UserCheck,
  Monitor,
  Wifi,
  Globe,
  GitBranch,
  Timer,
  TrendingUp,
  Activity
} from 'lucide-react';

const Navigation = () => {
  const [expandedSections, setExpandedSections] = useState({
    'growing-hub': true,
    'post-harvest': false,
    'quality-assurance': false,
    'inventory': false,
    'tasks': false,
    'facilities': false,
    'integrations': false,
    'compliance': false,
    'tagging': false,
    'admin': false,
    'reports': false
  });

  const location = useLocation();
  const { hasPermission } = useAuth();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: Home,
      path: '/'
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
        { label: 'Inventory Overview', icon: Monitor, path: '/inventory' },
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
      id: 'tasks',
      label: 'Tasks & Scheduling',
      icon: CheckSquare,
      expandable: true,
      children: [
        { label: 'Task Dashboard', icon: Monitor, path: '/tasks' },
        { label: 'Task Templates', icon: FileText, path: '/task-templates' },
        { label: 'Schedules', icon: Calendar, path: '/schedules' },
        { label: 'Calendar View', icon: Calendar, path: '/calendar' },
        { label: 'Team Tasks', icon: Users, path: '/team-tasks' }
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
        { label: 'System Settings', icon: Settings, path: '/settings' },
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
    const isExpanded = expandedSections[item.id];
    const hasChildren = item.children && item.children.length > 0;
    
    // Check permissions
    if (item.requiredPermissions && !item.requiredPermissions.some(perm => hasPermission(perm))) {
      return null;
    }

    const itemClasses = `
      flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 text-sm
      ${isActive(item.path)
        ? 'bg-green-100 text-green-800 font-medium'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }
    `;

    const IconComponent = item.icon;

    return (
      <div key={item.id} className="mb-1">
        {hasChildren ? (
          <div
            className={itemClasses}
            style={{ paddingLeft: `${12 + level * 16}px` }}
            onClick={() => toggleSection(item.id)}
          >
            <IconComponent size={18} className="mr-3 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            <div className="ml-2">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>
        ) : (
          <Link
            to={item.path}
            className={itemClasses}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            <IconComponent size={18} className="mr-3 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children.map((child, index) => renderMenuItem({...child, id: `${item.id}-${index}`}, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      <div className="space-y-1">
        {menuItems.map(item => renderMenuItem(item))}
      </div>
    </nav>
  );
};

export default Navigation;