import { Image, Menu, Badge } from 'antd';
import {
  BarChart2,
  FileText,
  Home,
  AlertTriangle,
  Wrench,
  HelpCircle,
  ClipboardList,
  Package,
  Gauge ,
  Calendar,
  Activity,
  CheckSquare,
  Archive, Lock ,
  Files,
  Box,
  Bell,
  ScrollText 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import belLogo from '../../assets/cmti.png';
import useAuthStore from '../../store/auth-store';
import useNotificationStore from '../../store/notification';

function Sidebar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = useStore((state) => state.isSidebarCollapsed);
  const { unreadCount } = useNotificationStore();

  const operatorMenuItems = [
    {
      key: '/operator/dashboard',
      icon: <ClipboardList size={20} />,
      label: 'Dashboard',
    },
    // {
    //   key: '/operator/alerts',
    //   icon: <AlertTriangle size={20} />,
    //   label: 'Alert Screen',
    // },
    // {
    //   key: '/operator/maintenance',
    //   icon: <Wrench size={20} />,
    //   label: 'Maintenance',
    // },
    {
      key: '/operator/inspection',
      icon: <CheckSquare size={20} />,
      label: 'Inspection Results',
    },
    {
      key: '/operator/inventory',
      icon: <Archive size={20} />,
      label: 'Inventory Data',
    },
    {
      key: '/operator/help',
      icon: <HelpCircle size={20} />,
      label: 'Help and Support',
    },
  ];

  const supervisorMenuItems = [
    {
      key: '/supervisor/dashboard',
      icon: <Home size={20} />,
      label: 'Dashboard',
    },
    {
      key: '/supervisor/order-management',
      icon: <Package size={20} />,
      label: 'Order Management',
      children: [
        {
          key: '/supervisor/order-management/',
          label: 'Order Lists',
        },
        {
          key: '/supervisor/configuration',
          label: 'Work Center',
        },
      ]
    },
    {
      key: '/supervisor/maintenance',
      icon: <Wrench size={20} />,
      label: 'Maintenance',
    },
    {
      key: 'production-planning',
      icon: <Calendar size={20} />,
      label: 'Process Engineering',
      children: [
        {
          key: '/supervisor/production-planning/planning',
          label: 'Process Planning',
        },
        {
          key: '/supervisor/production-planning/capacity_planning',
          label: "Capacity Planning"
        },
        {
          key: '/supervisor/production-planning/scheduling',
          label: 'Machine Scheduling',
        },
      ],
    },
    {
      key: '/supervisor/production-monitoring',
      icon: <Activity size={20} />,
      label: 'Production Monitoring',
      children: [
        {
          key: '/supervisor/production-monitoring/dashboard',
          label: 'Live Monitoring',
        },
        {
          key: '/supervisor/production-monitoring/production-vs-actual',
          label: 'Production vs Actual',
        },
        // {
        //   key: '/supervisor/production-monitoring/order-analysis',
        //   label: 'Order Analysis',
        // },
        {
          key: '/supervisor/production-monitoring/oee-overview',
          label: 'OEE Overview',
        },
        {
          key: '/supervisor/production-monitoring/analytics',
          label: 'Analytics',
        },
        {
          key: '/supervisor/pokayoke',
          label: 'PokaYoke Checklists',
        },
      ],
    },
    // {
    //   key: '/supervisor/production-monitoring',
    //   icon: <Activity size={20} />,
    //   label: 'Production Monitoring',
    // },
    {
      key: '/supervisor/quality-management',
      icon: <CheckSquare size={20} />,
      label: 'Quality Management',
    },
    // {
    //   key: 'inventory_master',
    //   icon: <Archive size={20} />,
    //   label: 'Inventory Management Old',
    //   children: [
    //     {
    //       key: '/supervisor/inventory_master/inventory_usage_and_analytics',
    //       label: 'Master Data',
    //     },
    //     {
    //       key: '/supervisor/inventory_master/requests_calibration_history',
    //       label: 'Overview ',
    //     },
    //   ],
    // },
    {
      key: 'inventory_data_management',
      icon: <Archive size={20} />,
      label: 'Inventory Management',
      children: [
        // {
        //   key: '/supervisor/inventory_data_management/data_management',
        //   label: 'Data Management',
        // },
        {
          key: '/supervisor/inventory_data_management/inventory_all_data',
          label: 'Inventery Master ',
        },
        {
          key: '/supervisor/inventory_data_management/inventory_analytics',
          label: 'Overview Data',
        },
      ],
    },
    {
      key: '/supervisor/energy-monitoring',
      icon: <BarChart2 size={20} />,
      label: 'Energy Monitoring',
    },
    // {
    //   key: '/supervisor/energy-monitoring-bel',
    //   icon: <BarChart2 size={20} />,
    //   label: 'Energy Monitoring BEL',
    // },
    {
      key: '/supervisor/machine_availability',

      icon: <Gauge  size={20} />,
      label: 'Assets Availability',
    },
    {
      key: '/supervisor/documents',

      icon: <Files size={20} />,
      label: 'Document Management',
    },
    {
      key: '/supervisor/notifications',
      icon: unreadCount > 0 ? (
        <Badge count={unreadCount} size="small" offset={[5, 0]}>
          <Bell size={20} />
        </Badge>
      ) : <Bell size={20} />,
      label: 'Notifications',
    },
    {
      key: '/supervisor/logs',
      icon: <ScrollText  size={20} />,
      label: 'Logs',
    },
  ];


  const adminMenuItems = [
    {
      key: '/admin/dashboard',
      icon: <Home size={20} />,
      label: 'Dashboard',
    },
    {
      key: '/admin/order-management',
      icon: <Package size={20} />,
      label: 'Order Management',
      children: [
        {
          key: '/admin/order-management/',
          label: 'Order Lists',
        },
        {
          key: '/admin/configuration',
          label: 'Work Center',
        },
      ]
    },
    {
      key: '/admin/maintenance',
      icon: <Wrench size={20} />,
      label: 'Maintenance',
    },
    {
      key: 'production-planning',
      icon: <Calendar size={20} />,
      label: 'Process Engineering',
      children: [
        {
          key: '/admin/production-planning/planning',
          label: 'Process Planning',
        },
        {
          key: '/admin/production-planning/capacity_planning',
          label: "Capacity Planning"
        },
        {
          key: '/admin/production-planning/scheduling',
          label: 'Machine Scheduling',
        },
      ],
    },
    {
      key: '/admin/production-monitoring',
      icon: <Activity size={20} />,
      label: 'Production Monitoring',
      children: [
        {
          key: '/admin/production-monitoring/dashboard',
          label: 'Live Monitoring',
        },
        {
          key: '/admin/production-monitoring/production-vs-actual',
          label: 'Production vs Actual',
        },
        {
          key: '/admin/production-monitoring/oee-overview',
          label: 'OEE Overview',
        },
        {
          key: '/admin/production-monitoring/analytics',
          label: 'Analytics',
        },
        {
          key: '/admin/pokayoke',
          label: 'PokaYoke Checklists',
        },
      ],
    },
    {
      key: '/admin/quality-management',
      icon: <CheckSquare size={20} />,
      label: 'Quality Management',
    },
    {
      key: 'inventory_data_management',
      icon: <Archive size={20} />,
      label: 'Inventory Management',
      children: [
        {
          key: '/admin/inventory_data_management/inventory_all_data',
          label: 'Inventery Master ',
        },
        {
          key: '/admin/inventory_data_management/inventory_analytics',
          label: 'Overview Data',
        },
      ],
    },
    {
      key: '/admin/energy-monitoring',
      icon: <BarChart2 size={20} />,
      label: 'Energy Monitoring',
    },
    {
      key: '/admin/machine_availability',

      icon: <Gauge  size={20} />,
      label: 'Assets Availability',
    },
    {
      key: '/admin/documents',

      icon: <Files size={20} />,
      label: 'Document Management',
    },
    {
      key: '/admin/notifications',
      icon: unreadCount > 0 ? (
        <Badge count={unreadCount} size="small" offset={[5, 0]}>
          <Bell size={20} />
        </Badge>
      ) : <Bell size={20} />,
      label: 'Notifications',
    },
    {
      key: '/admin/logs',
      icon: <ScrollText  size={20} />,
      label: 'Logs',
    },
    {
      key: '/admin/access_control_management',
      icon: <ScrollText  size={20} />,
      label: 'Access Control Management',
    },
    {
      key: 'access_control_management',
      icon: <Lock  size={20} />,
      label: 'Access Control Management',
      children: [
        {
          key: '/admin/access_control_management/user_management',
          label: 'Register New User ',
        },
        {
          key: '/admin/access_control_management/machine_password_management',
          label: 'Machine Password Management',
        },
      ],
    },
  ];

  const menuItems = 
    user?.role === 'operator' ? operatorMenuItems : 
    user?.role === 'admin' ? adminMenuItems : // Added condition for admin
    supervisorMenuItems;

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 flex justify-center">
        <Image
          src={belLogo}
          alt="BEL Logo"
          preview={false}
          width={isCollapsed ? 40 : 100}
          className="transition-all duration-300"
        />
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={[location.pathname.split('/').slice(0, 3).join('/')]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        inlineCollapsed={isCollapsed}
      />
    </div>
  );
}

export default Sidebar;