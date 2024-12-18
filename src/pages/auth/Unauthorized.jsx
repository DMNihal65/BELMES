import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <div className="space-x-4">
            <Button type="primary" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        }
      />
    </div>
  )
}

export default Unauthorized