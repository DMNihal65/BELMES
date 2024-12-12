import { ConfigProvider, theme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import useStore from './store/useStore'

function App() {
  const isDarkMode = useStore((state) => state.isDarkMode)

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

export default App
