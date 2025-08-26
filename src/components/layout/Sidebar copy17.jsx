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
  User, Key,
  BarChart3,
  CalendarClock,
  BarChartBig, Monitor , LineChart , Boxes, Warehouse ,
  FileBarChart,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import belLogo from '../../assets/cmti.png';
import notificationBg from '../../assets/notification.jpeg';
import orderBg from '../../assets/order.png';
import inventoryBg from '../../assets/inventory.jpeg';
import planningBg from '../../assets/planning.jpeg';
import productionBg from '../../assets/production.png';
import qualityBg from '../../assets/Quality.jpeg';
import helpBg from '../../assets/help.jpeg';
import useAuthStore from '../../store/auth-store';
import useNotificationStore from '../../store/notification';

function Sidebar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = useStore((state) => state.isSidebarCollapsed);
  const { unreadCount } = useNotificationStore();

  const notificationStyle = {
    backgroundImage: `url('/images/notification.jpeg')`,
    backgroundPosition: 'center center',
    backgroundSize: 'cover',
    height: '100px',
    margin: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    borderRadius: '8px',
    borderLeft: '4px solid #1890ff',
    position: 'relative',
    overflow: 'hidden',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
    textAlign: 'center',
    width: 'calc(100% - 16px)',
    padding: '0 8px',
    boxSizing: 'border-box'
  };

  const operatorMenuItems = [
    {
      key: '/operator/dashboard',
      // icon: <ClipboardList size={20} />,
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
      label: (
        <div className="inspection-results-header">
          INSPECTION RESULTS
        </div>
      ),
      className: 'inspection-results-item',
    },
    {
      key: '/operator/inventory',
      label: (
        <div className="inventory-data-header">
          INVENTORY DATA
        </div>
      ),
      className: 'inventory-data-item',
    },
    {
      key: '/operator/help',
      label: (
        <div className="help-support-header">
          HELP & SUPPORT
        </div>
      ),
      className: 'help-support-item',
    },
  ];

  const supervisorMenuItems = [
    {
      key: '/supervisor/dashboard',
      label: 'Dashboard',
      className: 'dashboard-menu-item',
    },
    {
      key: 'order-management',
      icon: <ClipboardList size={20} />,
      label: 'ORDER MANAGEMENT',
      className: 'order-management-item',
      children: [
        {
          key: '/supervisor/order-management/',
          label: 'Order Lists',
          icon: <List size={18} />
        },
        {
          key: '/supervisor/order-management/',
          label: 'Workcenter',
          icon: <Factory size={18} />
        }
      ]
    },

    {
      key: 'production-planning',
      label: (
        <div className="process-engineering-header">
          PROCESS ENGINEERING CELL
        </div>
      ),
      popupClassName: 'process-engineering-submenu',
      className: 'process-engineering-item',
      popupOffset: [0, 0],
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
      label: (
        <div className="production-monitoring-header">
          PRODUCTION MONITORING
        </div>
      ),
      popupClassName: 'production-monitoring-submenu',
      className: 'production-monitoring-item',
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
      label: 'QUALITY MANAGEMENT',
      className: 'quality-menu-item',
      style: {
        textAlign: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '14px',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%'
      }
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
      label: (
        <div className="inventory-menu-header">
          INVENTORY MANAGEMENT
        </div>
      ),
      popupClassName: 'inventory-submenu',
      className: 'inventory-menu-item',
      popupOffset: [0, 0],
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
      label: 'MAINTENANCE',
      className: 'maintenance-menu-item',
    },
    // {
    //   key: '/supervisor/energy-monitoring',
    //   icon: <BarChart2 size={20} />,
    //   label: 'Energy Monitoring',
    // },
    {
      key: '/supervisor/energy-monitoring-bel',
      label: 'ENERGY MONITORING BEL',
      className: 'energy-menu-item',
    },
    // {
    //   key: '/supervisor/machine_availability',

    //   icon: <Gauge  size={20} />,
    //   label: 'Assets Availability',
    // },
    {
      key: '/supervisor/documents',
      label: 'DOCUMENT MANAGEMENT',
      className: 'documents-menu-item',
      style: {
        textAlign: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '14px',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%'
      }
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
      label: 'NOTIFICATIONS',
      style: notificationStyle,
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
      // icon: <Package size={20} />,
      label: 'ORDER MANAGEMENT',
      className: 'order-management-item',
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
      label: (
        <div className="process-engineering-header">
          PROCESS ENGINEERING CELL
        </div>
      ),
      popupClassName: 'process-engineering-submenu',
      className: 'process-engineering-item',
      popupOffset: [0, 0],
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
      label: (
        <div className="production-monitoring-header">
          PRODUCTION MONITORING
        </div>
      ),
      popupClassName: 'production-monitoring-submenu',
      className: 'production-monitoring-item',
      children: [
        {
          key: '/admin/production-monitoring/dashboard',
          icon: <Monitor size={18} />,
          label: 'Live Monitoring',
        },
        {
          key: '/admin/production-monitoring/production-vs-actual',
          icon: <BarChartBig size={18} />,
          label: 'Planned vs Production',
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
      label: (
        <div className="inventory-menu-header">
          INVENTORY MANAGEMENT
        </div>
      ),
      popupClassName: 'inventory-submenu',
      className: 'inventory-menu-item',
      popupOffset: [0, 0],
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
      label: 'MAINTENANCE',
      className: 'maintenance-menu-item',
    },
    // {
    //   key: '/admin/energy-monitoring',
    //   icon: <BarChart2 size={20} />,
    //   label: 'Energy Monitoring',
    // },
    {
      key: '/admin/energy-monitoring-bel',
      label: 'ENERGY MONITORING BEL',
      className: 'energy-menu-item',
      style: {
        textAlign: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '14px',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%'
      }
    },
    // {
    //   key: '/admin/machine_availability',

    //   icon: <Gauge  size={20} />,
    //   label: 'Assets Availability',
    // },
    {
      key: '/admin/documents',
      label: 'DOCUMENT MANAGEMENT',
      className: 'documents-menu-item',
      style: {
        textAlign: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '14px',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%'
      }
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
      label: 'NOTIFICATIONS',
      style: notificationStyle
    },
    // {
    //   key: '/admin/logs',
    //   icon: <ScrollText  size={20} />,
    //   label: 'Logs',
    // },
    {
      key: '/admin/access_control_management',
      label: 'ACCESS CONTROL',
      className: 'access-control-menu-item',
      style: {
        textAlign: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '14px',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%'
      }
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
        .quality-menu-item,
        .maintenance-menu-item,
        .energy-menu-item,
        .documents-menu-item,
        .access-control-menu-item,
        .notification-menu-item {
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
        .maintenance-menu-item {
          background-image: url('/images/maintenance-bg.jpg');
          background-position: center 30%;
        }
        .energy-menu-item {
          background-image: url('/images/energy-bg.jpg');
          background-position: center 30%;
        }
        .documents-menu-item {
          background-image: url('/images/document-bg.jpg');
          background-position: center 30%;
        }
        .access-control-menu-item {
          background-image: url('/images/access-control-bg.jpg');
          background-position: center 30%;
        }
        .process-engineering-header {
          background-image: url('/images/planning.jpeg');
          background-position: center center;
          background-size: cover;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          font-weight: bold;
          text-transform: uppercase;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          width: 100%;
          padding: 0 8px;
          box-sizing: border-box;
          cursor: pointer;
        }
        
        .process-engineering-item > .ant-menu-submenu-title {
          height: auto !important;
          padding: 0 !important;
          margin: 8px !important;
          line-height: normal !important;
          background: transparent !important;
          width: calc(100% - 16px) !important;
        }
        
        .process-engineering-submenu {
          margin-left: 16px !important;
          position: fixed !important;
          left: 80px !important; /* Width of collapsed sidebar */
          z-index: 1000;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          min-width: 200px;
        }
        
        /* Adjust submenu position when sidebar is collapsed */
        .ant-layout-sider-collapsed .process-engineering-submenu {
          left: 80px !important;
          margin-left: 0 !important;
        }
        
        .process-engineering-submenu .ant-menu-item {
          margin: 4px 0 !important;
          padding: 8px 24px !important;
          background: #fff;
          color: #333;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .process-engineering-submenu .ant-menu-item:hover {
          background: #e6f7ff;
          color: #1890ff;
        }
        
        .process-engineering-submenu .ant-menu-item .anticon {
          margin-right: 8px;
        }
        .inventory-menu-header {
          background-image: url('/images/inventory.jpeg');
          background-position: center center;
          background-size: cover;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          font-weight: bold;
          text-transform: uppercase;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          width: 100%;
          padding: 0 8px;
          box-sizing: border-box;
          cursor: pointer;
        }
        
        .inventory-menu-item > .ant-menu-submenu-title {
          height: auto !important;
          padding: 0 !important;
          margin: 8px !important;
          line-height: normal !important;
          background: transparent !important;
          width: calc(100% - 16px) !important;
        }
        
        .inventory-submenu {
          margin-left: 16px !important;
          position: fixed !important;
          left: 80px !important; /* Width of collapsed sidebar */
          z-index: 1000;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          min-width: 200px;
        }
        
        /* Adjust submenu position when sidebar is collapsed */
        .ant-layout-sider-collapsed .inventory-submenu {
          left: 80px !important;
          margin-left: 0 !important;
        }
        
        .inventory-submenu .ant-menu-item {
          margin: 4px 0 !important;
          padding: 8px 24px !important;
          background: #fff;
          color: #333;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .inventory-submenu .ant-menu-item:hover {
          background: #e6f7ff;
          color: #1890ff;
        }
        
        .inventory-submenu .ant-menu-item .anticon {
          margin-right: 8px;
        }
        
        .inspection-results-item {
          background-image: url('/images/quality-bg.jpg');
          background-position: center center;
          background-size: cover;
          height: 100px !important;
          margin: 8px !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          font-weight: bold;
          text-transform: uppercase;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          width: calc(100% - 16px) !important;
          padding: 0 8px;
          box-sizing: border-box;
        }
        
        .inspection-results-header {
          width: 100%;
          text-align: center;
          font-size: 14px;
          line-height: 1.4;
          padding: 0 8px;
          color: #ffffff; /* Ensure text is white */
        }
        
        .inventory-data-item {
          background-image: url('/images/inventory-bg.jpg');
          background-position: center center;
          background-size: cover;
          height: 100px !important;
          margin: 8px !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          font-weight: bold;
          text-transform: uppercase;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          width: calc(100% - 16px) !important;
          padding: 0 8px;
          box-sizing: border-box;
        }
        
        .inventory-data-header {
          width: 100%;
          text-align: center;
          font-size: 14px;
          line-height: 1.4;
          padding: 0 8px;
          color: #ffffff;
        }
        
        .help-support-item {
          background-image: url('/images/help-bg.jpg');
          background-position: center center;
          background-size: cover;
          height: 100px !important;
          margin: 8px !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          font-weight: bold;
          text-transform: uppercase;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          width: calc(100% - 16px) !important;
          padding: 0 8px;
          box-sizing: border-box;
        }
        
        .help-support-header {
          width: 100%;
          text-align: center;
          font-size: 14px;
          line-height: 1.4;
          padding: 0 8px;
          color: #ffffff;
        }
        
        .production-monitoring-header {
          background-image: url('/images/production.png');
          background-position: center center;
          background-size: cover;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          font-weight: bold;
          text-transform: uppercase;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          width: 100%;
          padding: 0 8px;
          box-sizing: border-box;
          cursor: pointer;
        }
        
        .production-monitoring-item > .ant-menu-submenu-title {
          height: auto !important;
          padding: 0 !important;
          margin: 8px !important;
          line-height: normal !important;
          background: transparent !important;
          width: calc(100% - 16px) !important;
        }
        
        .production-monitoring-submenu {
          margin-left: 16px !important;
          position: fixed !important;
          left: 80px !important; /* Width of collapsed sidebar */
          z-index: 1000;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          min-width: 200px;
        }
        
        /* Adjust submenu position when sidebar is collapsed */
        .ant-layout-sider-collapsed .production-monitoring-submenu {
          left: 80px !important;
          margin-left: 0 !important;
        }
        
        .production-monitoring-submenu .ant-menu-item {
          margin: 4px 0 !important;
          padding: 8px 24px !important;
          background: #fff;
          color: #333;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .production-monitoring-submenu .ant-menu-item:hover {
          background: #e6f7ff;
          color: #1890ff;
        }
        
        .production-monitoring-submenu .ant-menu-item .anticon {
          margin-right: 8px;
        }
        
        .access-control-header {
          background-image: url('/images/access-control-bg.jpg');
          background-position: center center;
          background-size: cover;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 8px;
          border-left: 4px solid #1890ff;
          font-weight: bold;
          text-transform: uppercase;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center;
          width: 100%;
          padding: 0 8px;
          box-sizing: border-box;
          cursor: pointer;
        }
        
        .access-control-menu-item > .ant-menu-submenu-title {
          height: auto !important;
          padding: 0 !important;
          margin: 8px !important;
          line-height: normal !important;
          background: transparent !important;
          width: calc(100% - 16px) !important;
        }
        
        .access-control-submenu {
          margin-left: 16px !important;
          position: relative;
          z-index: 1000;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          min-width: 200px;
        }
        
        .access-control-submenu .ant-menu-item {
          margin: 4px 0 !important;
          padding: 8px 24px !important;
          background: #fff;
          color: #333;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .access-control-submenu .ant-menu-item:hover {
          background: #e6f7ff;
          color: #1890ff;
        }
        
        .access-control-submenu .ant-menu-item .anticon {
          margin-right: 8px;
        }
        .order-management-item > .ant-menu-submenu-title {
          background-image: url('/images/order-bg.jpg') !important;
          background-position: center center !important;
          background-size: cover !important;
          height: 100px !important;
          margin: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #fff !important;
          border-radius: 8px !important;
          border-left: 4px solid #1890ff !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8) !important;
          padding: 0 16px !important;
        }
        .order-management-item > .ant-menu-submenu-title .ant-menu-title-content {
          margin: 0 auto !important;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center !important;
          justify-content: center !important;
          height: 100%;
          padding: 0 8px !important;
          font-size: 14px !important;
          text-transform: uppercase !important;
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
        .quality-menu-item .ant-menu-title-content,
        .maintenance-menu-item .ant-menu-title-content,
        .energy-menu-item .ant-menu-title-content,
        .documents-menu-item .ant-menu-title-content,
        .access-control-menu-item .ant-menu-title-content {
          position: relative;
          z-index: 1;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: center !important;
          line-height: 1.5 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
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
        style={{ height: '100%', borderRight: 0 }}
      >
        {menuItems.map(item => {
          if (item.children) {
            return (
              <Menu.SubMenu key={item.key} title={item.label} icon={item.icon}>
                {item.children.map(child => (
                  <Menu.Item key={child.key} icon={child.icon}>
                    {child.label}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            );
          }
          return (
            <Menu.Item 
              key={item.key} 
              icon={item.icon}
              className={item.className}
              style={item.style}
            >
              {item.label}
            </Menu.Item>
          );
        })}
      </Menu>
    </div>
  );
}

export default Sidebar;