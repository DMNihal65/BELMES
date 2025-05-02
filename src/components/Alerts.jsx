import React from 'react';
import { Alert, Button } from 'antd';

const Alerts = ({ error, isConnected, cleanup, initializeWebSocket }) => {
  if (error) {
    return (
      <Alert
        message="Connection Error"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: '16px' }}
        action={
          <Button size="small" danger onClick={() => {
            cleanup();
            initializeWebSocket();
          }}>
            Retry
          </Button>
        }
      />
    );
  }
  
  if (!isConnected && !error) {
    return (
      <Alert
        message="Connecting..."
        description="Attempting to connect to machine monitoring system..."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    );
  }
  
  return null;
};

export default Alerts; 