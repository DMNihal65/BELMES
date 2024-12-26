import React, { useState } from 'react';
import { Card, Button, Input, Checkbox, Layout, Modal, Spin } from 'antd';
import { BellOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import MPP from '../operatorscreens/JobDetails/Mpp'; // Import MPP component
import IPID from '../operatorscreens/JobDetails/IPID'; // Import IPID component

const { Content, Header } = Layout;

const JobDetails = () => {
  const jobData = {
    jobId: 'JOB-2024-001',
    partNumber: 'PA-0014',
    batchSize: '120',
    priority: 'High',
    machine: 'OP10',
    operator: 'John Doe',
    startTime: '1/15/2024, 8:00:00 AM',
    endTime: '1/15/2024, 4:00:00 PM',
    steps: [
      { title: 'Prepare workstation', status: 'completed' },
      { title: 'Install fixtures', status: 'completed' },
      { title: 'Load raw materials', status: 'in-progress' },
      { title: 'Calibrate machine', status: 'pending' },
      { title: 'Begin machining', status: 'pending' }
    ]
  };

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [partCount, setPartCount] = useState(15);
  const [steps, setSteps] = useState(jobData.steps);
  const [isMPPVisible, setIsMPPVisible] = useState(false); // Manage MPP modal visibility

  // Handle IPID button click with backend call
  const handleIPIDClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/open-exe', { method: 'POST' });

      if (response.ok) {
        console.log('QMS application opened successfully');
      } else {
        throw new Error('Failed to open QMS application');
      }
    } catch (error) {
      console.error(error);
      Modal.error({
        title: 'Error',
        content: 'Failed to open QMS application. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle part count change
  const handlePartCountChange = (e) => {
    setPartCount(e.target.value);
  };

  // Handle submit action for part count
  const handleSubmit = () => {
    console.log(`Part Count updated to: ${partCount}`);
  };

  // Handle checkbox change for steps
  const handleCheckboxChange = (index) => {
    const updatedSteps = [...steps];
    updatedSteps[index].status = updatedSteps[index].status === 'completed' ? 'in-progress' : 'completed';
    setSteps(updatedSteps);
  };

  // Handle MPP modal visibility
  const handleMPPClick = () => {
    setIsMPPVisible(true); // Show the MPP modal
  };

  const handleMPPClose = () => {
    setIsMPPVisible(false); // Hide the MPP modal
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Job Details</h1>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Button type="text" icon={<BellOutlined />} />
            <Button type="text" icon={<UserOutlined />} />
          </div>
        </Header>

        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Job Information Card */}
            <Card title="Job Information">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <p>Job ID: {jobData.jobId}</p>
                  <p>Part Number: {jobData.partNumber}</p>
                  <p>Batch Size: {jobData.batchSize}</p>
                  <p>Priority: {jobData.priority}</p>
                </div>
                <div>
                  <p>Machine: {jobData.machine}</p>
                  <p>Operator: {jobData.operator}</p>
                  <p>Start: {jobData.startTime}</p>
                  <p>End: {jobData.endTime}</p>
                </div>
              </div>
            </Card>

            {/* Part Count Update Card */}
            <Card title="Update PartCount">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <span>Machine1 OP10</span>
                <Input 
                  type="number" 
                  value={partCount} 
                  onChange={handlePartCountChange} 
                  style={{ width: '100px' }} 
                />
              </div>
              <Button type="primary" onClick={handleSubmit}>Submit</Button>
            </Card>

            {/* Steps and Documents Card */}
            <Card title="Steps and Documents">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <IPID /> {/* Render the IPID component */}
                <Button
                  type="primary"
                  onClick={handleMPPClick} // Show MPP modal on click
                  style={{ width: '200px', textAlign: 'center' }}
                >
                  MPP
                </Button>
                <Button
                  type="primary"
                  onClick={() => console.log('Other Documents clicked')}
                  style={{ width: '200px', textAlign: 'center' }}
                >
                  Other Documents
                </Button>
                <Button
                  type="primary"
                  onClick={() => console.log('Tools Used clicked')}
                  style={{ width: '200px', textAlign: 'center' }}
                >
                  Tools Used
                </Button>
              </div>
            </Card>

            {/* Task Progress Card */}
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Task Progress</span>
                  <span style={{ color: '#1890ff' }}>poka-yoke</span>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {steps.map((step, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Checkbox 
                      checked={step.status === 'completed'} 
                      onChange={() => handleCheckboxChange(index)} 
                    />
                    <span>{step.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Content>
      </Layout>

      {/* Loading Modal */}
      <Modal
        title="QMS Loading"
        open={isLoading}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
            size="large"
          />
          <p style={{ marginTop: '16px' }}>Loading QMS, please wait...</p>
        </div>
      </Modal>

      {/* MPP Modal */}
      <Modal
        title="Manufacturing Process Plan (MPP)"
        open={isMPPVisible}
        onCancel={handleMPPClose}
        footer={null}
        width={1700}
      >
        <MPP /> {/* MPP Component inside modal */}
      </Modal>
    </Layout>
  );
};

export default JobDetails;
