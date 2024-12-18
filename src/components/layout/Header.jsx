import { Avatar, Button, Dropdown, Input, Layout, Space } from 'antd'
import { LogOut, Menu as MenuIcon, Search, User } from 'lucide-react'
import useStore from '../../store/useStore'
import useAuthStore from '../../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import cmtiLogo from '../../assets/cmti.png'

const { Header: AntHeader } = Layout

function Header() {
  const { toggleSidebar } = useStore()
  const { user, role, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const profileMenuItems = [
    {
      key: 'role',
      label: `Role: ${role}`,
      disabled: true,
    },
    {
      key: 'profile',
      icon: <User size={16} />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  return (
    <AntHeader
      style={{ 
        background: '#fff',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <Button
        type="text"
        icon={<MenuIcon size={20} />}
        onClick={toggleSidebar}
      />
      
      <Input 
        placeholder="Search..."
        prefix={<Search size={16} />}
        style={{ maxWidth: '400px' }}
      />
      
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <img
          src={cmtiLogo}
          alt="CMTI Logo"
          style={{ height: '60px', width:'96px', marginRight: '16px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar src={user?.avatar} />
            <div className="flex flex-col">
              <span>{user?.name}</span>
              <span className="text-xs text-gray-500">{role}</span>
            </div>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  )
}

export default Header 