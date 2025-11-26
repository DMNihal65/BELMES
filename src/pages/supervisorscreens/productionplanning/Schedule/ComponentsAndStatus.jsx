import React from 'react';
import { Card, Badge } from 'antd';

// Component Legend Component
export const ComponentLegend = ({ componentColors, title = "Production Orders" }) => {
  return (
    <div className="component-legend">
      <div className="legend-title">{title}</div>
      <div className="legend-items">
        {Object.entries(componentColors).map(([order, colors]) => (
          <div key={order} className="legend-item">
            <span 
              className="color-box" 
              style={{ backgroundColor: colors.backgroundColor }}
            />
            <span className="component-name">{order}</span>
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
      className={`machine-status-card hover:shadow-md transition-all duration-300 border-l-4 ${
        status === 'running' ? 'border-green-500' : 'border-yellow-500'
      }`}
      style={{
        height: '100px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      bodyStyle={{
        flex: 1,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-base truncate" title={machine.displayName}>{machine.displayName}</div>
          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            {currentOperation && (
              <span 
                className="inline-block flex-shrink-0 w-3 h-3 rounded-sm"
                style={{ 
                  backgroundColor: componentColors?.[currentOperation.production_order]?.backgroundColor || '#999',
                }} 
              />
            )}
            <span className="font-normal text-base truncate" title={currentOperation ? currentOperation.production_order : 'No active operation'}>
              {currentOperation ? currentOperation.production_order : 'No active operation'}
            </span>
          </div>
        </div>
        <Badge 
          className="flex-shrink-0"
          status={status === 'running' ? 'success' : 'warning'} 
          text={status.toUpperCase()}
        />
      </div>
      {currentOperation && (
        <div className="text-xs text-gray-500 mt-2 truncate" title={currentOperation.description}>
          {currentOperation.description}
        </div>
      )}
    </Card>
  );
};

// Machine Status Cards Container Component
export const MachineStatusCards = ({ machines, operations, componentStatus, componentColors }) => {
  return (
    <div className="mt-2">
      <h2 className="text-xl font-semibold mb-4">Machine Status Cards</h2>
      <div className="grid gap-4" style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        {machines.map(machine => (
          <div key={machine.machineId}>
            <MachineStatusCard
              machine={machine}
              operations={operations.filter(op => op.machine === machine.machineId)}
              componentStatus={componentStatus}
              componentColors={componentColors} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};