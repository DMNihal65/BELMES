import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Spin, Alert } from 'antd';

const MostRequestedInstruments = () => {
    // Temporary static data
    const data = [
        { category: 'Endmills', requests: 85 },
        { category: 'Drills', requests: 65 },
        { category: 'Inserts', requests: 95 },
        { category: 'Gauges and Instruments', requests: 55 },
        { category: 'Fixtures', requests: 45 },
        { category: 'Raw Materials', requests: 75 },
        { category: 'Consumables', requests: 88 },
    ];

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                className="m-5"
            />
        );
    }

    const xAxisData = data.map((item) => item.category.trim());
    const seriesData = data.map((item) => item.requests);

    const option = {
        title: {
            text: 'Most Requested Inventory Items',
            left: 'center',
        },
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLabel: {
                rotate: 45,
                interval: 0,
                formatter: (value) => {
                    return value.length > 10 ? `${value.substring(0, 10)}...` : value;
                },
                textStyle: {
                    fontSize: 12,
                },
            },
            axisTick: {
                alignWithLabel: true,
            },
            axisLine: {
                onZero: true,
            },
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                data: seriesData,
                type: 'line',
                smooth: true,
                itemStyle: {
                //    color: '#0284c7'
                },
                lineStyle: {
                    width: 2,
                },
            },
        ],
    };

    return (
        <Card className="shadow-md rounded-lg overflow-hidden m-5">
            <ReactECharts option={option} style={{ height: '450px', width: '100%' }} />
        </Card>
    );
};

export default MostRequestedInstruments;
