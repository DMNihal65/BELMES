import { Image, Menu } from 'antd'
import { BarChart2, Home, Settings, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import useStore from '../../store/useStore'
import useAuthStore from '../../store/useAuthStore'
import belLogo from '../../assets/bel.png'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isCollapsed = useStore((state) => state.isSidebarCollapsed)
  const { role } = useAuthStore()

  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <Home size={20} />,
        label: 'Dashboard',
      },
    ]

    if (role === 'SUPERVISOR') {
      items.push(
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
          ],
        },
        {
          key: '/settings',
          icon: <Settings size={20} />,
          label: 'Settings',
        }
      )
    }

    items.push({
      key: '/profile',
      icon: <User size={20} />,
      label: 'Profile',
    })

    return items
  }

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
        defaultOpenKeys={['reports']}
        collapsed={isCollapsed}
        items={getMenuItems()}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  )
}

export default Sidebar 