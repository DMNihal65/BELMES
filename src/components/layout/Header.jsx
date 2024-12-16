import { Avatar, Button, Dropdown, Input, Layout, Space } from 'antd'
import { LogOut, Menu as MenuIcon, Search, User } from 'lucide-react'
import useStore from '../../store/useStore'
import { useNavigate } from 'react-router-dom'
import cmtiLogo from '../../assets/cmti.png';

const { Header: AntHeader } = Layout

function Header() {
  const { toggleSidebar, user, logout } = useStore()
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
              {/* CMTI Logo */}
      <img
        src={cmtiLogo}
        alt="CMTI Logo"
        style={{ height: '60px', width:'96px', marginRight: '16px', cursor: 'pointer' }}
        onClick={() => navigate('/')} // Redirect to home on click
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