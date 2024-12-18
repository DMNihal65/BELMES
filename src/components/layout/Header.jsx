import { Avatar, Button, Dropdown, Input, Layout, Space } from 'antd';
import { LogOut, Menu as MenuIcon, Search, User } from 'lucide-react';
import useStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import cmtiLogo from '../../assets/bel.png';
import { useEffect, useState } from 'react';

const { Header: AntHeader } = Layout;

function Header() {
  const { toggleSidebar } = useStore();
  const navigate = useNavigate();
  const [operatorName, setOperatorName] = useState('');

  useEffect(() => {
    // Get operator name from localStorage
    const name = localStorage.getItem('operatorName');
    setOperatorName(name || '');
  }, []);

  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('operatorName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    // Navigate to login page
    navigate('/login');
  };

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
  ];

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
          style={{ height: '40px', width: '186px', marginRight: '16px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar 
              style={{ 
                backgroundColor: '#1890ff',
                verticalAlign: 'middle',
              }}
            >
              {operatorName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <span className="font-medium">{operatorName}</span>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
}

export default Header;