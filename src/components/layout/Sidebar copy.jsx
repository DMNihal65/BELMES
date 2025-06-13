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
  ScrollText,
  LockKeyhole,
  List, Factory,
BarChart3,
CalendarClock,
BarChartBig, Monitor , LineChart , Boxes, Warehouse ,
FileBarChart,
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
      className: 'dashboard-menu-item',
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
      label: 'Dashboard',
      className: 'dashboard-menu-item',
    },
    {
      key: '/supervisor/order-management',
      icon: <Package size={20} />,
      label: 'Order Management',
      children: [
        {
          key: '/supervisor/order-management/',
          icon: <List size={18} />,
          label: 'Order Lists',
        },
        {
          key: '/supervisor/configuration',
          icon: <Factory size={18} />,
          label: 'work centre',
        },
      ]
    },

    {
      key: 'production-planning',
      icon: <Calendar size={18} />,
      label: 'Process Engineering Cell',
      children: [

         {
          key: '/supervisor/machine_availability',
          icon: <Gauge  size={18} />,
          label: 'Assets Availability',
        },
        {
          key: '/supervisor/production-planning/planning',
          icon: <ClipboardList size={18} />,
          label: 'Process Planning',
        },
        {
          key: '/supervisor/production-planning/capacity_planning',
          icon: <BarChart3 size={18} />,
          label: "Capacity Planning"
        },
       
        {
          key: '/supervisor/production-planning/scheduling',
          icon: <CalendarClock size={18} />,
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
          icon: <Monitor size={18} />,
          label: 'Live Monitoring',
        },
        {
          key: '/supervisor/production-monitoring/production-vs-actual',
          icon: <BarChartBig size={18} />,
          label: 'Production vs Actual',
        },
        // {
        //   key: '/supervisor/production-monitoring/order-analysis',
        //   label: 'Order Analysis',
        // },
        {
          key: '/supervisor/production-monitoring/oee-overview',
          icon: <Gauge size={18} />,
          label: 'OEE Overview',
        },
        {
          key: '/supervisor/production-monitoring/analytics',
          icon: <LineChart size={18} />,
          label: 'Analytics',
        },
        {
          key: '/supervisor/pokayoke',
          icon: <CheckSquare size={18} />,
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
      label: 'Quality Management',
      className: 'quality-menu-item',
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
      key: '/supervisor/inventory_data_management',
      icon: <Archive size={20} />,
      label: 'Inventory Management',
      children: [
        // {
        //   key: '/supervisor/inventory_data_management/data_management',
        //   label: 'Data Management',
        // },
        {
          key: '/supervisor/inventory_data_management/inventory_all_data',
          icon: <Warehouse size={18} />,
          label: 'Inventory Master ',
        },
        {
          key: '/supervisor/inventory_data_management/inventory_analytics',
          icon: <FileBarChart size={18} />,
          label: 'Overview Data',
        },
      ],
    },
    {
      key: '/supervisor/maintenance',
      icon: <Wrench size={20} />,
      label: 'Maintenance',
    },
    // {
    //   key: '/supervisor/energy-monitoring',
    //   icon: <BarChart2 size={20} />,
    //   label: 'Energy Monitoring',
    // },
    {
      key: '/supervisor/energy-monitoring-bel',
      icon: <BarChart2 size={20} />,
      label: 'Energy Monitoring BEL',
    },
    // {
    //   key: '/supervisor/machine_availability',

    //   icon: <Gauge  size={20} />,
    //   label: 'Assets Availability',
    // },
    {
      key: '/supervisor/documents',

      icon: <Files size={20} />,
      label: 'Document Management',
    },
    // {
    //   key: '/supervisor/notifications',
    //   icon: unreadCount > 0 ? (
    //     <Badge count={unreadCount} size="small" offset={[5, 0]}>
    //       <Bell size={20} />
    //     </Badge>
    //   ) : <Bell size={20} />,
    //   label: 'Notifications',
    // },
    {
      key: '/supervisor/notifications_new',
      icon: unreadCount > 0 ? (
        <Badge count={unreadCount} size="small" offset={[5, 0]}>
          <Bell size={20} />
        </Badge>
      ) : <Bell size={20} />,
      label: 'Notifications',
    },
    // {
    //   key: '/supervisor/logs',
    //   icon: <ScrollText  size={20} />,
    //   label: 'Logs',
    // },
  ];


  const adminMenuItems = [
    {
      key: '/admin/dashboard',
      label: 'Dashboard',
      className: 'dashboard-menu-item',
    },
    {
      key: '/admin/order-management',
      icon: <Package size={20} />,
      label: 'Order Management',
      children: [
        {
          key: '/admin/order-management/',
          icon: <List size={18} />,
          label: 'Order Lists',
        },
        {
          key: '/admin/configuration',
          icon: <Factory size={18} />,
          label: 'work centre',
        },
      ]
    },
    {
      key: 'production-planning',
      icon: <Calendar size={20} />,
      label: 'Process Engineering Cell',
      children: [
        {
          key: '/admin/machine_availability',
          icon: <Gauge  size={18} />,
          label: 'Assets Availability',
        },
        {
          key: '/admin/production-planning/planning',
          icon: <ClipboardList size={18} />,
          label: 'Process Planning',
        },
        {
          key: '/admin/production-planning/capacity_planning',
          icon: <BarChart3 size={18} />,
          label: "Capacity Planning"
        },
       
        {
          key: '/admin/production-planning/scheduling',
          icon: <CalendarClock size={18} />,
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
          icon: <Monitor size={18} />,
          label: 'Live Monitoring',
        },
        {
          key: '/admin/production-monitoring/production-vs-actual',
          icon: <BarChartBig size={18} />,
          label: 'Production vs Actual',
        },
        // {
        //   key: '/admin/production-monitoring/order-analysis',
        //   label: 'Order Analysis',
        // },
        {
          key: '/admin/production-monitoring/oee-overview',
          icon: <Gauge size={18} />,
          label: 'OEE Overview',
        },
        {
          key: '/admin/production-monitoring/analytics',
          icon: <LineChart size={18} />,
          label: 'Analytics',
        },
        {
          key: '/supervisor/pokayoke',
          icon: <CheckSquare size={18} />,
          label: 'PokaYoke Checklists',
        },
      ],
    },
    {
      key: '/admin/quality-management',
      label: 'Quality Management',
      className: 'quality-menu-item',
    },
    {
      key: '/admin/inventory_data_management',
      icon: <Archive size={20} />,
      label: 'Inventory Management',
      children: [
        {
          key: '/admin/inventory_data_management/inventory_all_data',
          icon: <Warehouse size={18} />,
          label: 'Inventory Master ',
        },
        {
          key: '/admin/inventory_data_management/inventory_analytics',
          icon: <FileBarChart size={18} />,
          label: 'Overview Data',
        },
      ],
    },
    {
      key: '/admin/maintenance',
      icon: <Wrench size={20} />,
      label: 'Maintenance',
    },
    // {
    //   key: '/admin/energy-monitoring',
    //   icon: <BarChart2 size={20} />,
    //   label: 'Energy Monitoring',
    // },
    {
      key: '/admin/energy-monitoring-bel',
      icon: <BarChart2 size={20} />,
      label: 'Energy Monitoring BEL',
    },
    // {
    //   key: '/admin/machine_availability',

    //   icon: <Gauge  size={20} />,
    //   label: 'Assets Availability',
    // },
    {
      key: '/admin/documents',

      icon: <Files size={20} />,
      label: 'Document Management',
    },
    // {
    //   key: '/admin/notifications',
    //   icon: unreadCount > 0 ? (
    //     <Badge count={unreadCount} size="small" offset={[5, 0]}>
    //       <Bell size={20} />
    //     </Badge>
    //   ) : <Bell size={20} />,
    //   label: 'Notifications',
    // },
    {
      key: '/admin/notifications_new',
      icon: unreadCount > 0 ? (
        <Badge count={unreadCount} size="small" offset={[5, 0]}>
          <Bell size={20} />
        </Badge>
      ) : <Bell size={20} />,
      label: 'Notifications',
    },
    // {
    //   key: '/admin/logs',
    //   icon: <ScrollText  size={20} />,
    //   label: 'Logs',
    // },
    {
      key: '/admin/access_control_management',
      icon: <LockKeyhole />,
      label: 'Access Control Management',
    },
    // {
    //   key: 'access_control_management',
    //   icon: <Lock  size={20} />,
    //   label: 'Access Control Management',
    //   children: [
    //     {
    //       key: '/admin/access_control_management/user_management',
    //       label: 'Register New User ',
    //     },
    //     {
    //       key: '/admin/access_control_management/machine_password_management',
    //       label: 'Machine Password Management',
    //     },
    //   ],
    // },
  ];

  const menuItems = 
    user?.role === 'operator' ? operatorMenuItems : 
    user?.role === 'admin' ? adminMenuItems : // Added condition for admin
    supervisorMenuItems;

  return (
    <div className="h-screen flex flex-col">
      <style jsx global>{`
        .dashboard-menu-item,
        .quality-menu-item {
          background-size: cover;
          background-position: center;
          height: 100px !important;
          margin: 8px;
          display: flex !important;
          align-items: center;
          justify-content: center;
          color: #fff !important;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          position: relative;
          overflow: hidden;
        }
        .dashboard-menu-item {
          background-image: url('/images/dashboard-bg.jpg');
        }
        .quality-menu-item {
          background-image: url('/images/quality-bg.jpg');
        }
        .dashboard-menu-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(24, 144, 255, 0.05));
          z-index: 0;
        }
        .dashboard-menu-item .ant-menu-title-content,
        .quality-menu-item .ant-menu-title-content {
          position: relative;
          z-index: 1;
          padding: 0;
          margin: 0 !important;
          width: 100%;
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dashboard-menu-item .ant-menu-item-icon {
          display: none;
        }
        .dashboard-menu-item:hover {
          transform: none;
          box-shadow: none;
        }
        .dashboard-menu-item:hover .ant-menu-title-content {
          background: none;
        }
      `}</style>
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