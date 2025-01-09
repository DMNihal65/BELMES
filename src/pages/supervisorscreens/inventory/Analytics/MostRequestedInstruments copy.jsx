import React from 'react';
import { Card } from 'antd';
import { Column } from '@ant-design/plots';

const MostRequestedInstruments = () => {
    // Sample data - replace with your actual data
    const data = [
        { instrument: 'Multimeter', requests: 45 },
        { instrument: 'Oscilloscope', requests: 38 },
        { instrument: 'Power Supply', requests: 32 },
        { instrument: 'Signal Generator', requests: 28 },
        { instrument: 'Spectrum Analyzer', requests: 25 },
    ];

    const config = {
        data,
        xField: 'instrument',
        yField: 'requests',
        label: {
            position: 'middle',
            style: {
                fill: '#FFFFFF',
                opacity: 0.6,
            },
        },
        xAxis: {
            label: {
                autoHide: true,
                autoRotate: false,
            },
        },
        meta: {
            instrument: {
                alias: 'Instrument',
            },
            requests: {
                alias: 'Number of Requests',
            },
        },
    };

    return (
        <Card title="Most Requested Instruments">
            <Column {...config} />
        </Card>
    );
};

export default MostRequestedInstruments;