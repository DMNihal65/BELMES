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
  const { fetchMPPDetails, saveMPPDetails, mppDetails, isLoading } = usePlanningStore();
  const [workInstructions, setWorkInstructions] = useState(defaultInstructions);
  const [editableCardTitles, setEditableCardTitles] = useState({
    fixture: 'Fixture & IPID Details',
    datum: 'Datum Information',
    workInstructions: 'Work Holding Instructions',
    images: 'Operation Images'
  });

  useEffect(() => {
    if (partNumber && operation?.operation_number) {
      fetchMPPDetails(partNumber, operation.operation_number);
    }
  }, [partNumber, operation, fetchMPPDetails]);

  useEffect(() => {
    if (mppDetails) {
      form.setFieldsValue({
        fixture_number: mppDetails.fixture_number,
        ipid_number: mppDetails.ipid_number,
        datum_x: mppDetails.datum_x,
        datum_y: mppDetails.datum_y,
        datum_z: mppDetails.datum_z,
      });

      if (mppDetails.work_instructions?.sections) {
        setWorkInstructions(mppDetails.work_instructions.sections.map((section, index) => ({
          id: index + 1,
          title: section.title,
          content: section.instructions
        })));
      }
    }
  }, [mppDetails, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const mppData = {
        order_id: operation?.order_id || null,
        operation_id: operation?.id || null,
        document_id: null,
        fixture_number: values.fixture_number,
        ipid_number: values.ipid_number,
        datum_x: values.datum_x,
        datum_y: values.datum_y,
        datum_z: values.datum_z,
        work_instructions: {
          sections: workInstructions.map((instruction, index) => ({
            title: instruction.title || '',
            instructions: instruction.content || '',
            sequence: index
          }))
        },
        part_number: partNumber,
        operation_number: Number(operation?.operation_number)
      };

      console.log('Saving MPP data:', mppData);

      await saveMPPDetails(mppData);
      message.success('MPP details saved successfully');
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Save error:', error);
      message.error(
        'Failed to save MPP details: ' + 
        (typeof error === 'string' ? error : error.message || 'Unknown error')
      );
    }
  };

  const handleCardTitleChange = (key, value) => {
    setEditableCardTitles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Title level={4} editable>Operation Details - Operation Number: {operation?.operation_number}</Title>
      
      <Form form={form} layout="vertical">
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

        {/* Operation Images */}
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
            showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Card>

        {/* Save Changes Button */}
        <div className="flex justify-end mt-6">
          <Button 
            type="primary" 
            onClick={handleSave}
            loading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default OperationMPPDetails;