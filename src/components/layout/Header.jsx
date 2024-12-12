import { Avatar, Button, Dropdown, Input, Layout, Space, theme } from 'antd'
import { LogOut, Menu as MenuIcon, Moon, Search, Sun, User } from 'lucide-react'
import useStore from '../../store/useStore'
import { useNavigate } from 'react-router-dom'

const { Header: AntHeader } = Layout

function Header() {
  const { toggleSidebar, isDarkMode, toggleDarkMode, user, logout } = useStore()
  const { token } = theme.useToken()
  const navigate = useNavigate()

  const profileMenuItems = [
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
      onClick: logout,
    },
  ]

  return (
    <AntHeader
      style={{ 
        background: token.colorBgContainer,
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
        <Button
          type="text"
          icon={isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          onClick={toggleDarkMode}
        />
        
        <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar src={user?.avatar} />
            <span>{user?.name}</span>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  )
}

export default Header 