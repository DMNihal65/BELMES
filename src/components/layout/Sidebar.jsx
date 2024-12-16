import { Image, Menu } from 'antd'
import { BarChart2, FileText, Home, Settings, User, Users } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import useStore from '../../store/useStore'
import belLogo from '../../assets/bel.png';

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isCollapsed = useStore((state) => state.isSidebarCollapsed)

  const menuItems = [
    {
      key: '/',
      icon: <Home size={20} />,
      label: 'Dashboard',
    },
    {
      key: 'reports',
      icon: <BarChart2 size={20} />,
      label: 'Reports',
      children: [
        {
          key: '/reports/sales',
          label: 'Sales Report',
        },
        {
          key: '/reports/users',
          label: 'User Analytics',
        },
        {
          key: '/reports/inventory',
          label: 'Inventory',
        },
      ],
    },
    {
      key: 'users',
      icon: <Users size={20} />,
      label: 'User Management',
      children: [
        {
          key: '/users/list',
          label: 'User List',
        },
        {
          key: '/users/roles',
          label: 'Roles & Permissions',
        },
      ],
    },
    {
      key: '/profile',
      icon: <User size={20} />,
      label: 'Profile',
    },
    {
      key: '/settings',
      icon: <Settings size={20} />,
      label: 'Settings',
    },
  ]

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 flex justify-center">
        {isCollapsed ? (
          <Image
            src={belLogo} // Added bel logo
            alt="Logo"
            preview={false}
            width={32}
          />
        ) : (
          <Image
            src={belLogo} // Added bel logo
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
        defaultOpenKeys={['reports', 'users']}
        collapsed={isCollapsed}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  )
}

export default Sidebar 