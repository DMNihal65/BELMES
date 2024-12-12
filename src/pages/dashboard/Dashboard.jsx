import { Card, Col, Row, Statistic } from 'antd'
import { Activity, Users, DollarSign } from 'lucide-react'

function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <Row gutter={16}>
        <Col span={8}>
          <Card className='bg-red-300 cor'>
            <Statistic
              title="Active Users"
              value={1128}
              prefix={<Users size={20} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Revenue"
              value={9280}
              prefix={<DollarSign size={20} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Activity"
              value={93}
              suffix="%"
              prefix={<Activity size={20} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard 