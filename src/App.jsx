import { ConfigProvider } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'

function App() {
  return (
    <ConfigProvider>
      <RouterProvider router={router} />
      <style jsx global>{`
        * {
          font-family: 'CustomFont', system-ui, sans-serif;
        }

        /* Ant Design specific overrides */
        .ant-btn,
        .ant-input,
        .ant-select,
        .ant-modal-title,
        .ant-tabs-tab,
        .ant-menu-item,
        .ant-dropdown-menu-item,
        .ant-statistic-title,
        .ant-statistic-content,
        .ant-card-head-title,
        .ant-tag,
        .ant-badge,
        .ant-divider,
        .ant-modal-content,
        .ant-space,
        .ant-typography {
          font-family: 'CustomFont', system-ui, sans-serif !important;
        }

        /* Variable font weight classes */
        .font-thin { font-variation-settings: 'wght' 100; }
        .font-extralight { font-variation-settings: 'wght' 200; }
        .font-light { font-variation-settings: 'wght' 300; }
        .font-normal { font-variation-settings: 'wght' 400; }
        .font-medium { font-variation-settings: 'wght' 500; }
        .font-semibold { font-variation-settings: 'wght' 600; }
        .font-bold { font-variation-settings: 'wght' 700; }
        .font-extrabold { font-variation-settings: 'wght' 800; }
        .font-black { font-variation-settings: 'wght' 900; }
      `}</style>
    </ConfigProvider>
  )
}

export default App
