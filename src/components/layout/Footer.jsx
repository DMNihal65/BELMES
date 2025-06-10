import { Layout } from 'antd';
import useStore from '../../store/useStore';

const { Footer: AntFooter } = Layout;

function Footer() {
  const isCollapsed = useStore((state) => state.isSidebarCollapsed);

  return (
    <AntFooter style={{ 
      textAlign: 'center',
      background: '#fff',
      padding: '16px 50px',
      borderTop: '1px solid #f0f0f0',
      position: 'fixed',
      bottom: 0,
      left: isCollapsed ? 80 : 260,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontWeight: 'bold'
    }}>
      {/* CMTI ©{new Date().getFullYear()} Created by CMTI */}
      &copy; 2025 CMTI. All rights reserved.
    </AntFooter>
  );
}

export default Footer; 