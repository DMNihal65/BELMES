import React, { useState } from 'react';
import {
  Form, Input, Upload, Button, Card, Row, Col, 
  Modal, Typography, Space, Divider, Collapse
} from 'antd';
import {
  UploadOutlined, SaveOutlined, PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill'; // Rich text editor
import 'react-quill/dist/quill.snow.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const OperationMPPDetails = ({ operation, onSave }) => {
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');

  const [instructions, setInstructions] = useState([
    { id: 1, title: 'Fixture Setup', content: '' },
    { id: 2, title: 'Job Preparation', content: '' },
    { id: 3, title: 'Post-Machining Steps', content: '' }
  ]);

  const [expandedKeys, setExpandedKeys] = useState(['1']);

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Form form={form} layout="vertical" initialValues={operation}>
        {/* Fixture & IPID Details */}
        <Card 
          title={<Title level={5}>Fixture & IPID Details</Title>} 
          className="shadow-sm"
        >
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item
                name="fixtureNo"
                label={<Text strong>Fixture No with Rev.</Text>}
                rules={[{ required: true }]}
              >
                <Input placeholder="Ex: Fx-62805080AA-70.80-Rev.01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ipidNo"
                label={<Text strong>IPID No with Rev.</Text>}
                rules={[{ required: true }]}
              >
                <Input placeholder="Ex: IPID-62805080AA-80-Rev.01" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Datum Information */}
        <Card 
          title={<Title level={5}>Datum Information</Title>}
          className="shadow-sm"
        >
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <Form.Item
                name="datumX"
                label={<Text strong>Datum X Axis</Text>}
              >
                <Input placeholder="Ex: 0 at the job center" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="datumY"
                label={<Text strong>Datum Y Axis</Text>}
              >
                <Input placeholder="Ex: 0 at the job center" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="datumZ"
                label={<Text strong>Datum Z Axis</Text>}
              >
                <Input placeholder="Ex: +0.25mm at top of the job" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Work Holding Instructions */}
        <Card 
          title={<Title level={5}>Work Holding Instructions</Title>}
          className="shadow-sm"
        >
          <div className="space-y-4">
            {instructions.map((instruction) => (
              <Card 
                key={instruction.id}
                size="small"
                className="border-l-4 border-l-blue-500"
              >
                <div className="mb-3">
                  <Form.Item
                    name={['instructions', instruction.id, 'title']}
                    initialValue={instruction.title}
                  >
                    <Input 
                      placeholder="Enter section title"
                      className="font-medium text-lg"
                      bordered={false}
                      style={{ paddingLeft: 0 }}
                    />
                  </Form.Item>
                </div>
                <Form.Item
                  name={['instructions', instruction.id, 'content']}
                >
                  <ReactQuill 
                    theme="snow"
                    style={{ 
                      height: '150px',
                      marginBottom: '40px'
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
                </Form.Item>
              </Card>
            ))}

            {/* Add New Section Button */}
            <Button 
              type="dashed" 
              block
              icon={<PlusOutlined />}
              onClick={() => {
                setInstructions([
                  ...instructions,
                  {
                    id: instructions.length + 1,
                    title: '',
                    content: ''
                  }
                ]);
              }}
            >
              Add New Section
            </Button>
          </div>
        </Card>

        {/* Operation Images */}
        <Card 
          title={<Title level={5}>Operation Images</Title>}
          className="shadow-sm"
        >
          <Form.Item name="images">
            <Upload
              listType="picture-card"
              multiple
              maxCount={4}
              onPreview={handlePreview}
              beforeUpload={(file) => {
                // Add name input before upload
                return new Promise((resolve, reject) => {
                  Modal.confirm({
                    title: 'Image Name',
                    content: (
                      <Input 
                        placeholder="Enter image name"
                        onChange={(e) => file.customName = e.target.value}
                      />
                    ),
                    onOk: () => {
                      if (file.customName) {
                        resolve(file);
                      } else {
                        message.error('Please enter an image name');
                        reject();
                      }
                    },
                    onCancel: () => reject(),
                  });
                });
              }}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button 
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        </div>
      </Form>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img
          alt="preview"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default OperationMPPDetails; 