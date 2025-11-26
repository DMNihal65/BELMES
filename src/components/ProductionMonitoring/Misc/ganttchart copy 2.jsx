import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

const ProductionGantt = ({ data, machineData, selectedMachine }) => {
  const [viewMode, setViewMode] = useState('hourly');
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoom = (direction) => {
    if (direction === 'in' && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.2);
    } else if (direction === 'out' && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.2);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-semibold mb-2">
          {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            const [machineId, type] = entry.dataKey.split('_');
            const machine = machineData.find(m => m.id === machineId);
            
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{machine.name}</span>
                <span className="text-sm font-medium">
                  {type === 'planned' ? 'Target' : 'Actual'}
                </span>
                <span className="text-sm font-semibold">{entry.value} units</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">Production Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <Select 
            defaultValue={viewMode} 
            onValueChange={setViewMode}
            className="w-[120px]"
          >
            <Select.Trigger>
              <Select.Value placeholder="View Mode" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="hourly">Hourly View</Select.Item>
              <Select.Item value="shift">Shift View</Select.Item>
            </Select.Content>
          </Select>
          
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleZoom('out')}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleZoom('in')}
              disabled={zoomLevel >= 2}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) => new Date(time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                stroke="#888888"
                tickLine={false}
                scale="time"
                type="number"
                domain={['auto', 'auto']}
              />
              <YAxis 
                stroke="#888888"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} units`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              
              {machineData.map((machine, index) => {
                if (selectedMachine === 'all' || selectedMachine === machine.id) {
                  const baseHue = (index * 120) % 360;
                  return (
                    <React.Fragment key={machine.id}>
                      <Line
                        type="monotone"
                        dataKey={`${machine.id}_planned`}
                        stroke={`hsl(${baseHue}, 70%, 50%)`}
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name={`${machine.name} (Target)`}
                      />
                      <Line
                        type="monotone"
                        dataKey={`${machine.id}_actual`}
                        stroke={`hsl(${baseHue}, 70%, 40%)`}
                        strokeWidth={2}
                        dot={false}
                        name={`${machine.name} (Actual)`}
                      />
                    </React.Fragment>
                  );
                }
                return null;
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionGantt;