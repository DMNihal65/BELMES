import React, { useState } from 'react';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill's default styles
import {
  Tabs, Form, Input, Select, Space, Button, Upload,
  Table, Card, Row, Col, Divider, message, Descriptions, Typography, 
} from 'antd';
import {
  UploadOutlined, SaveOutlined, PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;


const OperationMPPDetails = ({ operation, onSave }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('setup');
  const [fileList, setFileList] = useState([]);
  const [editorContent, setEditorContent] = useState(''); // Store the rich text content
  const [workHolding, setWorkHolding] = useState('');
  const [workHoldingDetails, setWorkHoldingDetails] = useState('');
  const [ipidNoRev, setIpidNoRev] = useState('');
  const [freq, setFreq] = useState('');
  const [datumXAxis, setDatumXAxis] = useState('');
  const [datumYAxis, setDatumYAxis] = useState('');
  const [datumZAxis, setDatumZAxis] = useState('');
  const [rev, setRev] = useState('');

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-2 space-y-6">
      <Form
        form={form}
        layout="vertical"
        initialValues={operation}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Setup Information" key="setup">
            <Row gutter={24}>
              <Col span={12}>

              <Card title="Machine Setup" className="shadow-sm">
                <Descriptions column={1} bordered>
                  {/* Work Holding and Work Holding Details */}
                  <Descriptions.Item label="Work Holding">
                    <Input 
                      placeholder="Enter Work Holding" 
                      value={workHolding} 
                      onChange={(e) => setWorkHolding(e.target.value)} 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Work Holding Details">
                    <Input 
                      placeholder="Enter Work Holding Details" 
                      value={workHoldingDetails} 
                      onChange={(e) => setWorkHoldingDetails(e.target.value)} 
                    />
                  </Descriptions.Item>
                  
                  {/* IPID No with Rev */}
                  <Descriptions.Item label="IPID No with Rev">
                    <Input 
                      placeholder="Enter IPID No with Rev" 
                      value={ipidNoRev} 
                      onChange={(e) => setIpidNoRev(e.target.value)} 
                    />
                  </Descriptions.Item>

                  {/* Frequency */}
                  <Descriptions.Item label="Freq.">
                    <Input 
                      placeholder="Enter Frequency" 
                      value={freq} 
                      onChange={(e) => setFreq(e.target.value)} 
                    />
                  </Descriptions.Item>

                  {/* Datum X Axis */}
                  <Descriptions.Item label="Datum X Axis">
                    <Input 
                      placeholder="Enter Datum X Axis" 
                      value={datumXAxis} 
                      onChange={(e) => setDatumXAxis(e.target.value)} 
                    />
                  </Descriptions.Item>

                  {/* Datum Y Axis */}
                  <Descriptions.Item label="Datum Y Axis">
                    <Input 
                      placeholder="Enter Datum Y Axis" 
                      value={datumYAxis} 
                      onChange={(e) => setDatumYAxis(e.target.value)} 
                    />
                  </Descriptions.Item>

                  {/* Datum Z Axis */}
                  <Descriptions.Item label="Datum Z Axis">
                    <Input 
                      placeholder="Enter Datum Z Axis" 
                      value={datumZAxis} 
                      onChange={(e) => setDatumZAxis(e.target.value)} 
                    />
                  </Descriptions.Item>

                  {/* Revision */}
                  <Descriptions.Item label="Rev">
                    <Input 
                      placeholder="Enter Revision" 
                      value={rev} 
                      onChange={(e) => setRev(e.target.value)} 
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Card>


                {/* <Card title="Machine Setup" size="small">
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
                </Card> */}
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
                                  <Input placeholder="Enter program name" />
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
                            Add Program Name
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
                  name={['docs', 'headingPoints']}
                  label="Notes"
                >
                  <Form.List
                    name="headings"
                    initialValue={[]}
                    rules={[
                      {
                        validator: async(_, names) => {
                          if (!names || names.length < 1) {
                            return Promise.reject(new Error('At least one heading is required.'));
                          }
                        },
                      },
                    ]}
                  >
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, fieldKey, ...restField }) => (
                          <div key={key} style={{ marginBottom: 20 }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'heading']}
                              fieldKey={[fieldKey, 'heading']}
                              label="Heading"
                              rules={[{ required: true, message: 'Please enter a heading' }]}
                            >
                              <Input placeholder="Enter Heading" />
                            </Form.Item>
                            <Form.List
                              name={[name, 'points']}
                              initialValue={[]}
                            >
                              {(pointFields, { add: addPoint, remove: removePoint }) => (
                                <>
                                  {pointFields.map(({ key, name, fieldKey, ...restPointField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                      <Form.Item
                                        {...restPointField}
                                        name={[name, 'point']}
                                        fieldKey={[fieldKey, 'point']}
                                        rules={[{ required: true, message: 'Missing point' }]}
                                      >
                                        <Input placeholder="Enter point" />
                                      </Form.Item>
                                      <MinusCircleOutlined onClick={() => removePoint(name)} />
                                    </Space>
                                  ))}
                                  <Form.Item>
                                    <Button
                                      type="dashed"
                                      onClick={() => addPoint()}
                                      block
                                      icon={<PlusOutlined />}
                                    >
                                      Add Point
                                    </Button>
                                  </Form.Item>
                                </>
                              )}
                            </Form.List>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </div>
                        ))}
                        <Form.Item>
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                          >
                            Add Heading
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
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