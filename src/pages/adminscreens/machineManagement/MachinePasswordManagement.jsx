import React, { useState, useEffect } from "react";
import { Form, Select, Input, Button, message, Card } from "antd";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Option } = Select;

const MachinePasswordManagement = ({ onClose }) => {
  const [form] = Form.useForm();
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchMachines();
  }, []);

  // const fetchMachines = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await axios.get(
  //       "http://172.19.224.1:8002/api/v1/master-order/all-machines/"
  //     );
  //     setMachines(response.data || []);
  //   } catch (error) {
  //     console.error("Failed to fetch machines:", error);
  //     message.error("Failed to fetch machines");
  //     toast.error(`Error: ${error.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchMachines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/all-machines/');
      const data = await response.json();
      // Filter machines where work_center_boolean is true and extract the code
      const machinesWithCode = data
        .filter(machine => machine.work_center_boolean === true)
        .map(machine => ({
          ...machine,
          code: machine.work_center.code
        }));
      setMachines(machinesWithCode);
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      message.error("Failed to fetch machines");
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const onFinish = async (values) => {
    const { machineName, password } = values;
    setSubmitLoading(true);
    try {
      const response = await axios.post(
        `http://172.19.224.1:8002/api/v1/auth/register-machine-password?machine_id=${machineName}&password=${password}`
      );
      message.success(response.data.status || "Password set successfully");
      toast.success(response.data.status || "Password set successfully");
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Failed to set password:", error);
      message.error("Failed to set password");
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };






  
  return (
    <div className="flex justify-center items-center  p-4 ">
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Machine Password Management</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="machineName"
            label={<span className="text-gray-700 font-semibold">Select Machine</span>}
            rules={[{ required: true, message: 'Please select a machine!' }]}
          >
            <Select
              placeholder="Select machine"
              className="w-full"
              size="large"
              loading={isLoading}
              showSearch
              optionFilterProp="children"
            >
              {(machines || []).map((machine) => (
                <Option key={machine.id} value={machine.id}>
                  ({machine.work_center.code}) {machine.make}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-gray-700 font-semibold">Enter Password</span>}
            rules={[{ required: true, message: 'Please enter password!' }]}
          >
            <Input.Password size="large" placeholder="Enter password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
              loading={submitLoading}
            >
              Set Password
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default MachinePasswordManagement;
