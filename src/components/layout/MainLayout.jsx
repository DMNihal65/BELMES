import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import useStore from '../../store/useStore'

const { Content, Sider } = Layout

function MainLayout() {
  const isCollapsed = useStore((state) => state.isSidebarCollapsed)

  return (
    <Layout>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={isCollapsed}
        theme="light"
      >
        <Sidebar />
      </Sider>
      <Layout>
        <Header />
        <Content className="p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout 