import { Image, Menu } from 'antd';
import {
  BarChart2,
  FileText,
  Home,
  AlertTriangle,
  Wrench,
  HelpCircle,
  ClipboardList,
  Package,
  Calendar,
  Activity,
  CheckSquare,
  Archive,
  Files
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import belLogo from '../../assets/cmti.png';
import { useEffect, useState } from 'react';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = useStore((state) => state.isSidebarCollapsed);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

  const operatorMenuItems = [
    {
      key: '/operator/dashboard',
      icon: <Home size={20} />,
      label: 'Dashboard',
    },
    {
      key: '/operator/job-details',
      icon: <ClipboardList size={20} />,
      label: 'Job Details',
    },
    {
      key: '/operator/alerts',
      icon: <AlertTriangle size={20} />,
      label: 'Alert Screen',
    },
    {
      key: '/operator/maintenance',
      icon: <Wrench size={20} />,
      label: 'Maintenance Guide',
    },
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
    },
    {
      key: 'capacity-planning',
      icon: <Calendar size={20} />,
      label: 'Capacity Planning',
      children: [
        {
          key: '/supervisor/capacity-planning/planning',
          label: 'Planning',
        },
        {
          key: '/supervisor/capacity-planning/scheduling',
          label: 'Scheduling',
        },
      ],
    },
    {
      key: '/supervisor/production',
      icon: <Activity size={20} />,
      label: 'Production Monitoring',
    },
    {
      key: '/supervisor/quality',
      icon: <CheckSquare size={20} />,
      label: 'Quality Management',
    },
    // {
    //   key: '/supervisor/inventory_master',
    //   icon: <Archive size={20} />,
    //   label: 'Inventory Management',
    // },
    {
      key: 'inventory_master',
      icon: <Archive size={20} />,
      label: 'Inventory Management',
      children: [
        {
          key: '/supervisor/inventory_master/inventory_usage_and_analytics',
          label: 'Master Data',
        },
        {
          key: '/supervisor/inventory_master/requests_calibration_history',
          label: 'Overview ',
        },
      ],
    },
    {
      key: '/supervisor/documents',
      icon: <Files size={20} />,
      label: 'Document Management',
    },
  ];

  const menuItems = userRole === 'supervisor' ? supervisorMenuItems : operatorMenuItems;

  function getMenuItems() {
    if (userRole === 'supervisor') {
      return supervisorMenuItems;
    } else {
      return operatorMenuItems;
    }
  }

  // Redirect to role-specific dashboard if on root path
  useEffect(() => {
    if (location.pathname === '/' && userRole) {
      navigate(`/${userRole}/dashboard`);
    }
  }, [location.pathname, userRole, navigate]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 flex justify-center">
        {isCollapsed ? (
          <Image
            src={belLogo}
            alt="Logo"
            preview={false}
            width={32}
          />
        ) : (
          <Image
            src={belLogo}
            alt="Logo"
            preview={false}
            height={36}
          />
        )}
      </div>
      <Menu
        mode="inline"
        className="flex-1 border-r"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['capacity-planning']}
        collapsed={isCollapsed}
        items={getMenuItems()}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  );
}

export default Sidebar;