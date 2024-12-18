import { useState } from 'react'
import { Card, Form, Input, Button, Radio, message } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'
import { Lock, User } from 'lucide-react'

function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)

  const from = location.state?.from?.pathname || "/"

  const onFinish = async (values) => {
    setLoading(true)
    try {
      // In a real app, this would be an API call
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock login response
      const userData = {
        user: {
          name: values.role === 'SUPERVISOR' ? 'John Supervisor' : 'Jane Operator',
          email: `${values.username}@example.com`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.username}`,
        },
        token: 'mock-jwt-token',
        role: values.role,
      }

      login(userData)
      message.success('Login successful!')
      navigate(from, { replace: true })
    } catch (error) {
      message.error('Login failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Please sign in to continue</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{ role: 'OPERATOR' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input 
              prefix={<User size={16} className="text-gray-400" />}
              placeholder="Username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<Lock size={16} className="text-gray-400" />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item name="role" className="mb-6">
            <Radio.Group buttonStyle="solid" className="w-full">
              <div className="grid grid-cols-2 gap-4">
                <Radio.Button value="OPERATOR" className="text-center h-12 flex items-center justify-center">
                  Operator
                </Radio.Button>
                <Radio.Button value="SUPERVISOR" className="text-center h-12 flex items-center justify-center">
                  Supervisor
                </Radio.Button>
              </div>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full h-12"
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login 