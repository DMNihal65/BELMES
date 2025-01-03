import React, { useState } from 'react';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill's default styles
import {
  Tabs, Form, Input, Select, Space, Button, Upload,
  Table, Card, Row, Col, Divider, message
} from 'antd';
import {
  UploadOutlined, SaveOutlined, PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const OperationMPPDetails = ({ operation, onSave }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('setup');
  const [fileList, setFileList] = useState([]);
  const [editorContent, setEditorContent] = useState(''); // Store the rich text content

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave({ ...values, docs: { instructions: editorContent } }); // Pass the editor content
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList); // Update file list on change
  };

  const handleFilenameChange = (index, value) => {
    const newFileList = [...fileList];
    newFileList[index].name = value; // Update the filename in the fileList
    setFileList(newFileList); // Set the updated file list
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
                name={['setup', 'workHolding']}
                label="Work Holding"
              >
                <Input placeholder="Enter Work Holding" />
              </Form.Item>

              <Form.Item
                name={['setup', 'workHoldingDetails']}
                label="Work Holding Details"
              >
                <Input placeholder="Enter Work Holding Details" />
              </Form.Item>

              <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name={['setup', 'ipidNoRev']}
                  label="IPID No with Rev"
                >
                  <Input placeholder="Enter IPID No with Rev" />
                </Form.Item>
              </Col>

          <Col span={12}>
            <Form.Item
              name={['setup', 'freq.']}
              label="Freq."
            >
              <Input placeholder="Enter Freq" />
            </Form.Item>
          </Col>
        </Row>

              <Form.Item
                name={['setup', 'datumXAxis']}
                label="Datum X Axis"
              >
                <Input placeholder="Enter Datum X Axis" />
              </Form.Item>

              <Form.Item
                name={['setup', 'datumYAxis']}
                label="Datum Y Axis"
              >
                <Input placeholder="Enter Datum Y Axis" />
              </Form.Item>

              <Form.Item
                name={['setup', 'datumZAxis']}
                label="Datum Z Axis"
              >
                <Input placeholder="Enter Datum Z Axis" />
              </Form.Item>

              <Form.Item
                name={['setup', 'rev']}
                label="Rev"
              >
                <Input placeholder="Enter Rev" />
              </Form.Item>
              
        
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Program Name" size="small">
                <Form.Item
                  name={['setup', 'programName']}
                  label="Program Name"
                >
                  <Input placeholder="Enter Program Name" />
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
                            <Row gutter={24}>
                            <Col span={40}>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              rules={[{ required: true, message: 'Missing step' }]}
                            >
                              <Input placeholder="Setup step" />
                            </Form.Item>
                            </Col>
                            </Row>
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
            </Row>
          </TabPane>

          <TabPane tab="Upload Notes and Images" key="docs">
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name={['docs', 'instructions']}
                  label="Special Instructions"
                >
                  <ReactQuill
                    value={editorContent}
                    onChange={setEditorContent} // Update editor content
                    theme="snow"
                    placeholder="Enter special instructions here"
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name={['docs', 'images']}
                  label="Setup Images"
                >
                  <Upload
                    listType="picture-card"
                    maxCount={4}
                    onChange={handleUploadChange}
                    fileList={fileList}
                    beforeUpload={(file) => {
                      const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
                      const isSmallEnough = file.size / 1024 / 1024 < 2; // Less than 2 MB
                      if (!isValidType) {
                        message.error('You can only upload JPG/PNG files!');
                        return Upload.LIST_IGNORE;
                      }
                      if (!isSmallEnough) {
                        message.error('File size must be smaller than 2MB!');
                        return Upload.LIST_IGNORE;
                      }
                      return true;
                    }}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>

                {fileList.map((file, index) => (
                  <Row key={file.uid} gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                    <Col span={6} style={{ textAlign: 'center' }}>
                      <img
                        src={file.thumbUrl || file.url}
                        alt="Uploaded Image"
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginBottom: '8px',
                        }}
                      />
                    </Col>

                    <Col span={18}>
                      <Input
                        value={file.name}
                        onChange={(e) => handleFilenameChange(index, e.target.value)}
                        placeholder="Enter filename"
                        style={{ width: '30%' }}
                      />
                    </Col>
                  </Row>
                ))}
              </Col>
            </Row>
          </TabPane>
        </Tabs>

        <Divider />

        <div className="flex justify-end">
          <Space>
            <Button onClick={() => form.resetFields()}>Reset</Button>
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
