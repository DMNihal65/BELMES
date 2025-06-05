import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import useStore from '../../store/useStore';

const { Content } = Layout;

function MainLayout() {
  const isCollapsed = useStore((state) => state.isSidebarCollapsed);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsed={isCollapsed}
        width={260}
        style={{
          background: '#fff',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          transition: 'all 0.2s',
        }}
      >
        <Sidebar />
      </Layout.Sider>

      <Layout style={{ 
        marginLeft: isCollapsed ? 80 : 260,
        transition: 'all 0.2s',
      }}>
        <Header />
        <Content style={{ 
          padding: '24px',
          minHeight: 280,
          background: '#f0f9ff',
          paddingBottom: '80px'
        }}>
          <Outlet />
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
}

export default MainLayout; 