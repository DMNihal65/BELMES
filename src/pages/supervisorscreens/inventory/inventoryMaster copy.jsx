import React, { useState } from 'react';
import { Card, Table, Button, Row, Col, Space, Modal, InputNumber } from 'antd';
import { ToolOutlined, CheckCircleOutlined, WarningOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';

function Inventory() {
    // ... existing state variables ...

    // Analytics Data
    const categoryData = [
        { category: 'Raw Materials', count: 15 },
        { category: 'Cutting Tools', count: 25 },
        { category: 'Consumables', count: 30 },
        { category: 'Spares', count: 20 },
        { category: 'Tool Holders', count: 18 },
        { category: 'Jigs & Fixtures', count: 12 },
        { category: 'Measuring Instruments', count: 36 },
    ];

    const monthlyUsageData = [
        { month: 'Jan', usage: 45 },
        { month: 'Feb', usage: 52 },
        { month: 'Mar', usage: 38 },
        { month: 'Apr', usage: 62 },
        { month: 'May', usage: 55 },
        { month: 'Jun', usage: 48 },
    ];

    // Pie Chart Configuration
    const pieConfig = {
        data: categoryData,
        angleField: 'count',
        colorField: 'category',
        radius: 0.8,
        label: {
            type: 'outer',
            content: '{name}: {percentage}',
        },
        interactions: [{ type: 'element-active' }],
    };

    // Column Chart Configuration
    const columnConfig = {
        data: monthlyUsageData,
        xField: 'month',
        yField: 'usage',
        label: {
            position: 'middle',
            style: {
                fill: '#FFFFFF',
                opacity: 0.6,
            },
        },
        color: '#1890ff',
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Analytics Dashboard */}
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Card hoverable>
                        <Space align="center">
                            <ToolOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                            <div>
                                <h3 style={{ margin: 0, color: '#8c8c8c' }}>Total Tools</h3>
                                <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.totalTools}</h2>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card hoverable>
                        <Space align="center">
                            <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                            <div>
                                <h3 style={{ margin: 0, color: '#8c8c8c' }}>Available Tools</h3>
                                <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.availableTools}</h2>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card hoverable>
                        <Space align="center">
                            <WarningOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                            <div>
                                <h3 style={{ margin: 0, color: '#8c8c8c' }}>Low Stock Items</h3>
                                <h2 style={{ margin: '8px 0 0 0' }}>
                                    {toolsData.filter(tool => tool.quantity <= 5).length}
                                </h2>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card hoverable>
                        <Space align="center">
                            <ShoppingOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                            <div>
                                <h3 style={{ margin: 0, color: '#8c8c8c' }}>Out of Stock</h3>
                                <h2 style={{ margin: '8px 0 0 0' }}>
                                    {toolsData.filter(tool => tool.quantity === 0).length}
                                </h2>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col span={12}>
                    <Card title="Tools by Category">
                        <Pie {...pieConfig} />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Monthly Tool Usage">
                        <Column {...columnConfig} />
                    </Card>
                </Col>
            </Row>

            {/* Existing Tools Table */}
            <Card 
                title="Tools Inventory" 
                style={{ marginTop: '24px' }}
            >
                {/* ... existing table code ... */}
            </Card>

            {/* ... existing modal code ... */}
        </div>
    );
}

export default Inventory;