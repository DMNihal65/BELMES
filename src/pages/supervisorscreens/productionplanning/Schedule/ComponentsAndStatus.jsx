import React from 'react';
import { Card, Badge } from 'antd';

// Component Legend Component
export const ComponentLegend = ({ componentColors }) => {
  return (
    <div className="component-legend">
      <div className="legend-title">Part Numbers</div>
      <div className="legend-items">
        {Object.entries(componentColors).map(([component, colors]) => (
          <div key={component} className="legend-item">
            <span 
              className="color-box" 
              style={{ backgroundColor: colors.backgroundColor }}
            />
            <span className="component-name">{component}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .component-legend {
          margin-top: 16px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .legend-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .color-box {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        .component-name {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

// Machine Status Card Component
export const MachineStatusCard = ({ machine, operations, componentStatus, componentColors }) => {
  const currentOperation = operations.find(op => 
    new Date(op.start_time) <= new Date() && 
    new Date(op.end_time) >= new Date()
  );
  const status = currentOperation ? 'running' : 'idle';
  
  return (
    <Card 
      size="small" 
      className={`hover:shadow-md transition-shadow border-l-4 ${
        status === 'running' ? 'border-green-500' : 'border-yellow-500'
      }`}
      style={{
        height: '80px',
        minWidth: '100px',
        display: 'flex',
        flexDirection: 'column'
      }}
      bodyStyle={{
        flex: 1,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-base">{machine}</div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            {currentOperation && (
              <span 
                className="inline-block w-3 h-3 rounded-sm"
                style={{ 
                  backgroundColor: componentColors?.[currentOperation.component]?.backgroundColor || '#999',
                }} 
              />
            )}
            <span className="font-normal text-base">
              {currentOperation ? ` ${currentOperation.component}` : 'No active operation'}
            </span>
          </div>
        </div>
        <Badge 
          status={status === 'running' ? 'success' : 'warning'} 
          text={status.toUpperCase()}
        />
      </div>
    </Card>
  );
};

// Machine Status Cards Container Component
export const MachineStatusCards = ({ machines, operations, componentStatus, componentColors }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Machine Status Cards</h2>
      <div
        className="overflow-x-auto"
        style={{ display: 'flex', maxWidth: '1800px', whiteSpace: 'nowrap' }}
      >
        {machines.map(machine => (
          <div key={machine} style={{ flex: '0 0 auto', marginRight: '20px' }}>
            <MachineStatusCard
              machine={machine}
              operations={operations.filter(op => op.machine === machine)}
              componentStatus={componentStatus}
              componentColors={componentColors} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};