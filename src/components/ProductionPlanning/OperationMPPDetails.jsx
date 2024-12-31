import React, { useState } from 'react';
import {
  Tabs, Form, Input, Select, Space, Button, Upload,
  Table, Card, Row, Col, Divider, message
} from 'antd';
import {
  UploadOutlined, SaveOutlined, PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const OperationMPPDetails = ({ operation, onSave }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('setup');

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Form
        form={form}
        layout="vertical"
        initialValues={operation}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Setup Information" key="setup">
            <Row gutter={24}>
              <Col span={12}>
                <Card title="Machine Setup" size="small">
                  <Form.Item
                    name={['setup', 'fixtures']}
                    label="Fixtures Required"
                  >
                    <Select mode="multiple" placeholder="Select fixtures">
                      {/* Add fixture options */}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name={['setup', 'tools']}
                    label="Tools Required"
                  >
                    <Select mode="multiple" placeholder="Select tools">
                      {/* Add tool options */}
                    </Select>
                  </Form.Item>

                  <Form.List name={['setup', 'steps']}>
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Space 
                            key={key} 
                            style={{ display: 'flex', marginBottom: 8 }} 
                            align="baseline"
                          >
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              rules={[{ required: true, message: 'Missing step' }]}
                            >
                              <Input placeholder="Setup step" />
                            </Form.Item>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Space>
                        ))}
                        <Form.Item>
                          <Button 
                            type="dashed" 
                            onClick={() => add()} 
                            block 
                            icon={<PlusOutlined />}
                          >
                            Add Setup Step
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Quality Parameters" size="small">
                  <Form.List name={['quality', 'parameters']}>
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Space key={key} align="baseline">
                            <Form.Item
                              {...restField}
                              name={[name, 'parameter']}
                              rules={[{ required: true }]}
                            >
                              <Input placeholder="Parameter" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'specification']}
                              rules={[{ required: true }]}
                            >
                              <Input placeholder="Specification" />
                            </Form.Item>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Space>
                        ))}
                        <Form.Item>
                          <Button 
                            type="dashed" 
                            onClick={() => add()} 
                            block
                            icon={<PlusOutlined />}
                          >
                            Add Parameter
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Process Parameters" key="process">
            <Card title="Machining Parameters">
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name={['process', 'speed']}
                    label="Cutting Speed (RPM)"
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={['process', 'feed']}
                    label="Feed Rate (mm/min)"
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={['process', 'doc']}
                    label="Depth of Cut (mm)"
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab="Documentation" key="docs">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name={['docs', 'instructions']}
                  label="Special Instructions"
                >
                  <TextArea rows={4} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['docs', 'images']}
                  label="Setup Images"
                >
                  <Upload
                    listType="picture-card"
                    maxCount={4}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
        </Tabs>

        <Divider />

        <div className="flex justify-end">
          <Space>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default OperationMPPDetails; 