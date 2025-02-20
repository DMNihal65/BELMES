import React from 'react';
import { Layout, Typography, Card, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment';

const { Content } = Layout;
const { Title, Text } = Typography;

function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get('date');

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <Card 
            className="mb-6 shadow-lg rounded-xl border-0 backdrop-blur-sm bg-white/90"
            bodyStyle={{ padding: '24px' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => window.close()}
                  className="flex items-center"
                >
                  Close
                </Button>
                <Title level={4} className="!m-0">
                  Energy Report - {selectedDate ? moment(selectedDate).format('MMMM D, YYYY') : 'No Date Selected'}
                </Title>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <Text>Report content for {selectedDate}</Text>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}

export default Report; 