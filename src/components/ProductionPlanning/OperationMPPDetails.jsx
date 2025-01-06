import React, { useState } from 'react';
import { Card, Typography, Space, Tag, Divider, Image, Collapse, Button, Input, Form, message, Upload } from 'antd';
import { ToolOutlined, ExpandAltOutlined, RightOutlined, EditOutlined, SaveOutlined, CloseOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import jobLoading from '../../assets/job.png';
import postMachining from '../../assets/job2.png';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const getDefaultSteps = (section) => {
  switch(section) {
    case 'fixtureSetup':
      return [
        'Hold the fixture in vise with around 3 to 5 mm projection over jaws.',
        'Clamp the job on fixture with (M4) M5 screws while ensuring longest edge to be parallel to X axis within +/-0.1 mm through dialing.',
        'Check fixture alignment using dial indicator',
        'Verify all clamps are properly tightened'
      ];
    case 'jobPreparation':
      return [
        'Clean the job surface thoroughly',
        'Check for any burrs or damage',
        'Mark reference points if necessary',
        'Verify material specifications',
        'Check surface finish requirements'
      ];
    case 'postMachining':
      return [
        'Remove the job carefully from fixture',
        'Clean any coolant or chips',
        'Perform quality checks as per specifications',
        'Check critical dimensions',
        'Document any deviations'
      ];
    default:
      return [];
  }
};

const OperationMPPDetails = ({ operation, onUpdate }) => {
  const [form] = Form.useForm();
  const [editingSection, setEditingSection] = useState(null);
  const [editingTitles, setEditingTitles] = useState({
    fixture: false,
    datum: false,
    workHolding: false,
  });
  const [cardTitles, setCardTitles] = useState({
    fixture: 'Fixture & IPID Details',
    datum: 'Datum Information',
    workHolding: 'Work Holding Instructions',
  });
  const [fileList, setFileList] = useState([]);

  const handleUpload = async (file) => {
    try {
      // Here you would typically upload the file to your server
      // For now, we'll just show a success message
      message.success(`${file.name} file uploaded successfully`);
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error(`${file.name} file upload failed.`);
      return false;
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    form.setFieldsValue({
      fixtureNo: operation?.fixtureNo || '', // Empty input field for Fixture No
      ipidNo: operation?.ipidNo || '', // Empty input field for IPID No
      fixtureSetup: operation?.fixtureSetup || getDefaultSteps('fixtureSetup'),
      jobPreparation: operation?.jobPreparation || getDefaultSteps('jobPreparation'),
      postMachining: operation?.postMachining || getDefaultSteps('postMachining')
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onUpdate({ ...operation, ...values });
      setEditingSection(null);
      message.success('Changes saved successfully');
    } catch (error) {
      message.error('Please check the form fields');
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    form.resetFields();
  };

  const handleTitleEdit = (section) => {
    setEditingTitles((prev) => ({ ...prev, [section]: true }));
  };

  const handleTitleSave = (section) => {
    setEditingTitles((prev) => ({ ...prev, [section]: false }));
    message.success('Title updated successfully');
  };

  const handleTitleCancel = (section) => {
    setEditingTitles((prev) => ({ ...prev, [section]: false }));
  };

  const EditableTitle = ({ section }) => (
    <div className="flex items-center gap-2">
      {editingTitles[section] ? (
        <>
          <Input
            defaultValue={cardTitles[section]}
            onChange={(e) =>
              setCardTitles((prev) => ({ ...prev, [section]: e.target.value }))
            }
            style={{ width: '200px' }}
          />
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            size="small"
            onClick={() => handleTitleSave(section)}
          >
            Save
          </Button>
          <Button 
            icon={<CloseOutlined />} 
            size="small"
            onClick={() => handleTitleCancel(section)}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Text>{cardTitles[section]}</Text>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleTitleEdit(section)}
          >
            Edit
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Form form={form} layout="vertical">
        {/* Operation Header */}
        <div className="flex items-center space-x-2">
          <Title level={4} style={{ margin: 0 }}>Operation {operation?.opNo}</Title>
          <Tag color="blue">{operation?.description || 'Face Milling'}</Tag>
        </div>

        {/* Fixture & IPID Details */}
        <Card 
          title={<EditableTitle section="fixture" />}
          className="shadow-sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Fixture No with Rev. */}
              <div>
                <Text type="secondary">Fixture No with Rev.</Text>
                <div className="mt-1">
                  {editingSection === 'fixture' ? (
                    <Form.Item name="fixtureNo" rules={[{ required: true, message: 'Fixture No is required' }]}>
                      <Input placeholder="Enter Fixture No with Rev." />
                    </Form.Item>
                  ) : (
                    <div className="p-2 bg-gray-50 rounded">
                      <Text>{operation?.fixtureNo || 'No Fixture No entered'}</Text>
                    </div>
                  )}
                </div>
              </div>

              {/* IPID No with Rev. */}
              <div>
                <Text type="secondary">IPID No with Rev.</Text>
                <div className="mt-1">
                  {editingSection === 'fixture' ? (
                    <Form.Item name="ipidNo" rules={[{ required: true, message: 'IPID No is required' }]}>
                      <Input placeholder="Enter IPID No with Rev." />
                    </Form.Item>
                  ) : (
                    <div className="p-2 bg-gray-50 rounded">
                      <Text>{operation?.ipidNo || 'No IPID No entered'}</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Datum Information */}
        <Card 
          title={<EditableTitle section="datum" />}
          className="shadow-sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {['X', 'Y', 'Z'].map((axis) => (
                <div key={axis} className="grid grid-cols-2 gap-4">
                  <Text type="secondary">Datum {axis} Axis</Text>
                  {editingSection === 'datum' ? (
                    <Form.Item name={`datum${axis}`} rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  ) : (
                    <Text>{operation?.[`datum${axis}`] || (axis === 'Z' ? '+0.25mm at top of the job' : '0 at the job center')}</Text>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Work Holding Instructions */}
        <Card 
          title={<EditableTitle section="workHolding" />}
          className="shadow-sm"
        >
          <Collapse 
            ghost
            expandIcon={({ isActive }) => (
              <RightOutlined rotate={isActive ? 90 : 0} className="text-blue-600" />
            )}
          >
            {['fixtureSetup', 'jobPreparation', 'postMachining'].map((section, index) => (
              <Panel 
                header={
                  <div className="flex justify-between items-center w-full pr-4">
                    <Text strong className="text-blue-600">
                      {section === 'fixtureSetup' ? 'Fixture Setup' : 
                       section === 'jobPreparation' ? 'Job Preparation' : 
                       'Post-Machining Steps'}
                    </Text>
                  </div>
                } 
                key={index + 1}
              >
                <div className="pl-6">
                  {editingSection === section ? (
                    <Form.List name={section}>
                      {(fields, { add, remove }) => (
                        <div className="space-y-2">
                          {fields.map((field, index) => (
                            <Form.Item {...field} key={field.key} className="mb-2">
                              <div className="flex gap-2">
                                <Input.TextArea 
                                  autoSize 
                                  placeholder="Enter instruction step..."
                                />
                                <Button 
                                  type="text" 
                                  danger
                                  icon={<CloseOutlined />}
                                  onClick={() => remove(field.name)}
                                />
                              </div>
                            </Form.Item>
                          ))}
                          <Button 
                            type="dashed" 
                            onClick={() => add()} 
                            block 
                            className="mt-2"
                          >
                            Add Step
                          </Button>
                        </div>
                      )}
                    </Form.List>
                  ) : (
                    <ul className="space-y-2 list-disc">
                      {(operation?.[section] || getDefaultSteps(section)).map((step, idx) => (
                        <li key={idx}>
                          <Text>{step}</Text>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Panel>
            ))}
          </Collapse>
        </Card>

        {/* Reference Images */}
        <Card 
          title={
            <Space>
              <ExpandAltOutlined />
              <span>Reference Images</span>
            </Space>
          } 
          className="shadow-sm"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="bg-gray-50 p-4 rounded-lg" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  src={operation?.jobLoadingImage || jobLoading}
                  alt="Job Loading"
                  style={{ 
                    width: '300px',
                    height: '250px',
                    objectFit: 'contain'
                  }}
                  preview={{
                    mask: <div className="text-sm">Click to view</div>
                  }}
                />
              </div>
              <div className="mt-2 flex justify-center items-center gap-2">
                <Text>Job Loading</Text>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleUpload}
                >
                  <Button 
                    size="small" 
                    icon={<UploadOutlined />}
                    type="link"
                  >
                    Change Image
                  </Button>
                </Upload>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-gray-50 p-4 rounded-lg" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  src={operation?.postMachiningImage || postMachining}
                  alt="Post Machining"
                  style={{ 
                    width: '300px',
                    height: '250px',
                    objectFit: 'contain'
                  }}
                  preview={{
                    mask: <div className="text-sm">Click to view</div>
                  }}
                />
              </div>
              <div className="mt-2 flex justify-center items-center gap-2">
                <Text>Post Machining</Text>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleUpload}
                >
                  <Button 
                    size="small" 
                    icon={<UploadOutlined />}
                    type="link"
                  >
                    Change Image
                  </Button>
                </Upload>
              </div>
            </div>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default OperationMPPDetails;