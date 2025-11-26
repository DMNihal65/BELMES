import React, { useEffect, useState } from 'react';
import {
  Form, 
  Input, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Spin,
  Button, 
  Space,
  Upload,
  message
} from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { PlusOutlined } from '@ant-design/icons';
import usePlanningStore from '../../store/planning-store';

const { Title, Text } = Typography;

const defaultInstructions = [
  { id: 1, title: 'Fixture Setup', content: '' },
  { id: 2, title: 'Job Preparation', content: '' },
  { id: 3, title: 'Post-Machining Steps', content: '' }
];

const OperationMPPDetails = ({ operation, partNumber, onSave }) => {
  const [form] = Form.useForm();
  const { createOrFetchMPP, createNewMpp, updateMpp } = usePlanningStore();
  const [workInstructions, setWorkInstructions] = useState(defaultInstructions);
  const [editableCardTitles, setEditableCardTitles] = useState({
    fixture: 'Fixture & IPID Details',
    datum: 'Datum Information',
    workInstructions: 'Work Holding Instructions',
    images: 'Operation Images'
  });
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeMPP = async () => {
      try {
        setLoading(true);
        
        if (operation.existingMppData) {
          const mppData = operation.existingMppData;
          form.setFieldsValue({
            fixture_number: mppData.fixture_number || '',
            ipid_number: mppData.ipid_number || '',
            datum_x: mppData.datum_x || '',
            datum_y: mppData.datum_y || '',
            datum_z: mppData.datum_z || '',
          });

          if (mppData.work_instructions?.sections) {
            setWorkInstructions(mppData.work_instructions.sections.map(section => ({
              id: section.sequence,
              title: section.title,
              content: section.instructions
            })));
          }
        } else {
          const mppData = await createOrFetchMPP(partNumber, operation.operation_number);
          
          if (mppData) {
            form.setFieldsValue({
              fixture_number: mppData.fixture_number || '',
              ipid_number: mppData.ipid_number || '',
              datum_x: mppData.datum_x || '',
              datum_y: mppData.datum_y || '',
              datum_z: mppData.datum_z || '',
            });

            if (mppData.work_instructions?.sections) {
              setWorkInstructions(mppData.work_instructions.sections.map(section => ({
                id: section.sequence,
                title: section.title,
                content: section.instructions
              })));
            }
          } else {
            form.resetFields();
            setWorkInstructions(defaultInstructions);
          }
        }
      } catch (error) {
        console.error('Error initializing MPP:', error);
        message.error('Failed to initialize MPP details');
      } finally {
        setLoading(false);
      }
    };

    if (partNumber && operation?.operation_number) {
      initializeMPP();
    }
  }, [partNumber, operation, form, createOrFetchMPP]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const mppData = {
        part_number: partNumber,
        operation_number: Number(operation.operation_number),
        fixture_number: values.fixture_number?.trim() || '',
        ipid_number: values.ipid_number?.trim() || '',
        datum_x: values.datum_x?.trim() || '',
        datum_y: values.datum_y?.trim() || '',
        datum_z: values.datum_z?.trim() || '',
        work_instructions: {
          sections: workInstructions
            .filter(instruction => instruction.title || instruction.content)
            .map((instruction, index) => ({
              title: instruction.title?.trim() || '',
              instructions: instruction.content?.trim() || '',
              sequence: index
            }))
        }
      };

      console.log('Submitting MPP data:', mppData);

      if (operation.existingMppData) {
        await updateMpp(partNumber, operation.operation_number, mppData);
        message.success('MPP details updated successfully');
      } else {
        await createNewMpp(mppData);
        message.success('MPP details created successfully');
      }

      onSave?.();
    } catch (error) {
      console.error('Error saving MPP:', error);
      message.error(error.message || 'Failed to save MPP details');
    } finally {
      setLoading(false);
    }
  };

  const handleCardTitleChange = (key, value) => {
    setEditableCardTitles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Title level={4} editable>Operation Details - Operation Number: {operation?.operation_number}</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* Fixture & IPID Details */}
        <Card 
          title={
            <Input
              value={editableCardTitles.fixture}
              onChange={(e) => handleCardTitleChange('fixture', e.target.value)}
              bordered={false}
              className="text-lg font-medium"
            />
          }
          className="shadow-sm"
        >
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                name="fixture_number"
                label={<Text strong>Fixture No</Text>}
                rules={[{ required: true, message: 'Please enter fixture number' }]}
              >
                <Input placeholder="Enter Fixture Number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="ipid_number"
                label={<Text strong>IPID No</Text>}
                rules={[{ required: true, message: 'Please enter IPID number' }]}
              >
                <Input placeholder="Enter IPID Number" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Datum Information */}
        <Card 
          title={
            <Input
              value={editableCardTitles.datum}
              onChange={(e) => handleCardTitleChange('datum', e.target.value)}
              bordered={false}
              className="text-lg font-medium"
            />
          }
          className="shadow-sm"
        >
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <Form.Item 
                name="datum_x"
                label={<Text strong>Datum X Axis</Text>}
                rules={[{ required: true, message: 'Please enter Datum X' }]}
              >
                <Input placeholder="Enter Datum X" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="datum_y"
                label={<Text strong>Datum Y Axis</Text>}
                rules={[{ required: true, message: 'Please enter Datum Y' }]}
              >
                <Input placeholder="Enter Datum Y" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="datum_z"
                label={<Text strong>Datum Z Axis</Text>}
                rules={[{ required: true, message: 'Please enter Datum Z' }]}
              >
                <Input placeholder="Enter Datum Z" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Work Instructions */}
        <Card 
          title={
            <Input
              value={editableCardTitles.workInstructions}
              onChange={(e) => handleCardTitleChange('workInstructions', e.target.value)}
              bordered={false}
              className="text-lg font-medium"
            />
          }
          className="shadow-sm"
        >
          <div className="space-y-4">
            {workInstructions.map((instruction) => (
              <div key={instruction.id} className="border rounded-lg p-4">
                <Input
                  value={instruction.title}
                  onChange={(e) => {
                    const newInstructions = workInstructions.map(inst =>
                      inst.id === instruction.id ? { ...inst, title: e.target.value } : inst
                    );
                    setWorkInstructions(newInstructions);
                  }}
                  className="mb-2 font-medium"
                />
                <ReactQuill
                  theme="snow"
                  value={instruction.content}
                  onChange={(content) => {
                    const newInstructions = workInstructions.map(inst =>
                      inst.id === instruction.id ? { ...inst, content } : inst
                    );
                    setWorkInstructions(newInstructions);
                  }}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  placeholder="Enter instructions points here..."
                />
              </div>
            ))}
            <Button 
              type="dashed" 
              onClick={() => {
                setWorkInstructions([
                  ...workInstructions,
                  {
                    id: workInstructions.length + 1,
                    title: `New Section ${workInstructions.length + 1}`,
                    content: ''
                  }
                ]);
              }} 
              block
              icon={<PlusOutlined />}
            >
              Add New Section
            </Button>
          </div>
        </Card>

        {/* Operation Images
        <Card 
          title={
            <Input
              value={editableCardTitles.images}
              onChange={(e) => handleCardTitleChange('images', e.target.value)}
              bordered={false}
              className="text-lg font-medium"
            />
          }
          className="shadow-sm"
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Card> */}

        {/* Save Changes Button */}
        <div className="flex justify-end mt-6">
          <Form.Item className="mb-0">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              Save Changes
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default OperationMPPDetails;