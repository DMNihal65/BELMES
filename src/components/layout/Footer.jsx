import { Layout } from 'antd';
import useStore from '../../store/useStore';

const { Footer: AntFooter } = Layout;

function Footer() {
  const isCollapsed = useStore((state) => state.isSidebarCollapsed);

  return (
    <AntFooter style={{ 
      textAlign: 'center',
      background: '#fff',
      padding: '10px 24px',
      borderTop: '1px solid #f0f0f0',
      position: 'fixed',
      bottom: 0,
      left: isCollapsed ? 80 : 260,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '12px',
      color: '#000',
      height: '40px'
    }}>
      <div style={{ fontWeight: 'bold' }}>
        © {new Date().getFullYear()} CMTI. All rights reserved.
      </div>
    </AntFooter>
  );
}

export default Footer; 