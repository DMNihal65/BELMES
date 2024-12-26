import React, { useState, useRef } from 'react';
import { Upload, Trash2, Download } from 'lucide-react';
import { Card, Button, Input, notification, Table, Select, Tabs } from 'antd';
import { saveAs } from 'file-saver';
const { TabPane } = Tabs;

const exportFinalReport = () => {
  // Example data, you should use actual inspection data here
  const inspectionData = [
    { test: 'Leak Test', status: 'Passed', inspector: 'John Doe', date: '2024-12-23', comments: 'No leaks detected.' },
    { test: 'Measurement Accuracy', status: 'Failed', inspector: 'Jane Smith', date: '2024-12-22', comments: 'Out of tolerance.' },
  ];

  // Convert inspection data to CSV format
  const header = ['Test Name', 'Status', 'Inspector', 'Date', 'Comments'];
  const rows = inspectionData.map(item => [
    item.test,
    item.status,
    item.inspector,
    item.date,
    item.comments,
  ]);

  // Create CSV content
  let csvContent = header.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });

  // Create a Blob from CSV data and trigger a download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'final_inspection_report.csv');
};

const IPIDGenerationTab = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [selection, setSelection] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentUnit, setCurrentUnit] = useState('px');
  const [formData, setFormData] = useState({
    partNumber: '',
    revision: '',
  });
  const [draggedMeasurementId, setDraggedMeasurementId] = useState(null);
  const [gdntSymbol, setGdntSymbol] = useState('');
  const drawingRef = useRef(null);

  // Handle PDF upload
  const handleFileUpload = (file) => {
    if (file?.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setMeasurements([]); // Reset measurements when a new file is uploaded
      notification.success({ message: 'PDF uploaded successfully' });
    } else {
      notification.error({ message: 'Please upload a valid PDF file' });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateIPID = () => {
    if (!formData.partNumber || !formData.revision) {
      notification.error({ message: 'Please fill in all required fields' });
      return;
    }
    notification.success({
      message: `IPID generated for Part Number: ${formData.partNumber}, Revision: ${formData.revision}`,
    });
  };

  // Conversion logic based on selected unit
  const convertToUnit = (pixels) => {
    switch (currentUnit) {
      case 'mm':
        return (pixels * 0.264583).toFixed(2);  // Conversion for mm
      case 'in':
        return (pixels * 0.0104167).toFixed(2);  // Conversion for inches
      default:
        return pixels.toFixed(2);  // Default unit: px (pixels)
    }
  };

  // Submit inspection form
  const handleSubmitInspection = () => {
    if (!inspectionFormData.stage || !inspectionFormData.observations) {
      notification.error({ message: 'Please fill in all fields' });
      return;
    }
    // Update the status of the stage inspection
    setStageData((prevData) =>
      prevData.map((stage) =>
        stage.stage === inspectionFormData.stage
          ? { ...stage, status: 'Completed', inspectionDate: new Date().toLocaleDateString() }
          : stage
      )
    );
    notification.success({ message: 'Inspection submitted successfully' });
    setInspectionFormData({ stage: '', observations: '' }); // Reset form
  };
  // Stage inspection data
  const [stageData, setStageData] = useState([
    { key: '1', stage: 'Stage 1', status: 'Completed', inspectionDate: '2024-12-23' },
    { key: '2', stage: 'Stage 2', status: 'Pending', inspectionDate: '' },
    { key: '3', stage: 'Stage 3', status: 'In Progress', inspectionDate: '2024-12-22' },
  ]);
  const [defectData, setDefectData] = useState([
    { key: '1', defectId: 'D001', description: 'Incorrect measurement', status: 'Resolved' },
    { key: '2', defectId: 'D002', description: 'Missing part', status: 'Open' },
  ]);
  const [inspectionFormData, setInspectionFormData] = useState({
    stage: '',
    observations: '',
  });

 

  // Handle form changes (for stage inspection)
  const handleInspectionFormChange = (e) => {
    const { name, value } = e.target;
    setInspectionFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMouseDown = (e) => {
    if (!drawingRef.current) return;
    const rect = drawingRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelection({ x, y, width: 0, height: 0, startX: x, startY: y });
    setIsSelecting(true);
  };
  const handleMouseMove = (e) => {
    if (!isSelecting || !drawingRef.current) return;
    const rect = drawingRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setSelection((prev) => ({
      ...prev,
      width: currentX - prev.startX,
      height: currentY - prev.startY,
      x: Math.min(prev.startX, currentX),
      y: Math.min(prev.startY, currentY),
    }));
  };

  const handleMouseUp = () => {
    if (selection) {
      const width = Math.abs(selection.width);
      const height = Math.abs(selection.height);

      // Example: Simulate extraction of GD&T symbol from selected region
      const symbol = detectGDNTSymbol(selection); // This should have real symbol detection logic.

      const measurement = {
        id: measurements.length + 1,
        x: selection.x,
        y: selection.y,
        width: convertToUnit(width),
        height: convertToUnit(height),
        area: convertToUnit(width * height),
        timestamp: new Date().toLocaleTimeString(),
        unit: currentUnit,
        gdntSymbol: symbol,
      };

      setMeasurements((prev) => [...prev, measurement]);
    }
    setIsSelecting(false);
    setSelection(null);
  };

  // Placeholder function for GD&T symbol detection logic
  const detectGDNTSymbol = (selection) => {
    // Ideally, you would use OCR or other methods to detect the GD&T symbol
    return '⊥';  // Example placeholder
  };

  const handleMeasurementMouseDown = (e, id) => {
    e.stopPropagation();
    setDraggedMeasurementId(id);
  };

  const handleMeasurementMouseMove = (e) => {
    if (!draggedMeasurementId || !drawingRef.current) return;

    const rect = drawingRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMeasurements((prev) =>
      prev.map((m) =>
        m.id === draggedMeasurementId
          ? { ...m, x: x - m.width / 2, y: y - m.height / 2 }
          : m
      )
    );
  };

  const handleMeasurementMouseUp = () => {
    if (draggedMeasurementId) {
      setDraggedMeasurementId(null);
      notification.success({ message: 'Measurement moved successfully' });
    }
  };

  // Delete measurement
  const deleteMeasurement = (id) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
    notification.success({ message: 'Measurement deleted successfully' });
  };

  // Export measurements to CSV
  const exportToCSV = () => {
    if (measurements.length === 0) {
      notification.warning({ message: 'No measurements to export' });
      return;
    }

    const headers = ['ID,Width,Height,Area,Time,Unit,GD&T Symbol'];
    const rows = measurements.map(
      (m) => `${m.id},${m.width},${m.height},${m.area},${m.timestamp},${m.unit},${m.gdntSymbol}`
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements_${formData.partNumber || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notification.success({ message: 'Measurements exported successfully' });
  };

  // Table columns for measurements
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Width',
      dataIndex: 'width',
      key: 'width',
      render: (text, record) => `${text} ${record.unit}`,
    },
    {
      title: 'Height',
      dataIndex: 'height',
      key: 'height',
      render: (text, record) => `${text} ${record.unit}`,
    },
    {
      title: 'Area',
      dataIndex: 'area',
      key: 'area',
      render: (text, record) => `${text} ${record.unit}²`,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'GD&T Symbol',
      dataIndex: 'gdntSymbol',
      key: 'gdntSymbol',
    },
  ];


  return (
    <div className="p-4">
      <Card title="IPID Drawing Analysis" className="shadow-lg">
        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="IPID Drawing Analysis" key="1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Click or drag PDF file to upload</p>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {pdfUrl && (
                  <div className="mt-6 border rounded-lg p-4 relative">
                    <div
                      ref={drawingRef}
                      className="w-full h-[600px] border rounded relative overflow-hidden"
                      onMouseDown={handleMouseDown}
                      onMouseMove={(e) => {
                        handleMouseMove(e);
                        handleMeasurementMouseMove(e);
                      }}
                      onMouseUp={() => {
                        handleMouseUp();
                        handleMeasurementMouseUp();
                      }}
                      onMouseLeave={() => {
                        setIsSelecting(false);
                        setDraggedMeasurementId(null);
                      }}
                    >
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                      {measurements.map((measurement) => (
                        <div
                          key={measurement.id}
                          className={`absolute ${draggedMeasurementId === measurement.id ? 'border-red-500 bg-red-100' : 'border-blue-500 bg-blue-100'} bg-opacity-20`}
                          style={{
                            left: `${measurement.x}px`,
                            top: `${measurement.y}px`,
                            width: `${measurement.width}px`,
                            height: `${measurement.height}px`,
                          }}
                          onMouseDown={(e) => handleMeasurementMouseDown(e, measurement.id)}
                        >
                          <div className="absolute -top-6 left-0 bg-white px-2 py-1 text-xs border rounded-md text-gray-700">
                            {measurement.gdntSymbol}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold">Measurement Controls</h2>
                <Input
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={handleFormChange}
                  placeholder="Enter Part Number"
                  className="mt-4"
                />
                <Input
                  name="revision"
                  value={formData.revision}
                  onChange={handleFormChange}
                  placeholder="Enter Revision"
                  className="mt-4"
                />
                <Button type="primary" className="mt-4" onClick={handleGenerateIPID}>
                  Generate IPID
                </Button>
              </div>
            </div>
          </TabPane>


          {/* Other tabs */}
          <TabPane tab="Ballooning & BOC" key="2">
          <div className="p-4">
    <h2 className="text-lg font-semibold">Ballooning & BOC Section</h2>

    {/* Example content: a simple table */}
    <Table
      dataSource={[
        { key: '1', item: 'Balloon 1', description: 'Description 1', status: 'Active' },
        { key: '2', item: 'Balloon 2', description: 'Description 2', status: 'Inactive' },
        { key: '3', item: 'Balloon 3', description: 'Description 3', status: 'Active' },
      ]}
      columns={[
        { title: 'Item', dataIndex: 'item', key: 'item' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
      ]}
      pagination={false}
      size="small"
    />
  </div>
          </TabPane>


          <TabPane tab="Stage Inspection" key="3">
            <div className="p-4">
              <h2 className="text-lg font-semibold">Stage Inspection</h2>
              <Table
                dataSource={stageData}
                columns={[
                  { title: 'Stage', dataIndex: 'stage', key: 'stage' },
                  { title: 'Status', dataIndex: 'status', key: 'status' },
                  { title: 'Inspection Date', dataIndex: 'inspectionDate', key: 'inspectionDate' },
                ]}
                pagination={false}
                size="small"
              />

              {/* Defect Tracker */}
              <h3 className="mt-4 text-md font-semibold">Defect Tracker</h3>
              <Table
                dataSource={defectData}
                columns={[
                  { title: 'Defect ID', dataIndex: 'defectId', key: 'defectId' },
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Status', dataIndex: 'status', key: 'status' },
                ]}
                pagination={false}
                size="small"
              />

              {/* Inspection Form */}
              <h3 className="mt-4 text-md font-semibold">Inspection Form</h3>
              <Input
                name="stage"
                value={inspectionFormData.stage}
                onChange={handleInspectionFormChange}
                placeholder="Enter Stage"
                className="mt-2"
              />
              <Input
                name="observations"
                value={inspectionFormData.observations}
                onChange={handleInspectionFormChange}
                placeholder="Enter Observations/Comments"
                className="mt-2"
              />
              <Button type="primary" className="mt-2" onClick={handleSubmitInspection}>
                Submit Inspection
              </Button>
            </div>
          </TabPane>




          <TabPane tab="Final Inspection" key="4">
          <div className="p-4">
    <h2 className="text-lg font-semibold">Final Inspection</h2>

    {/* Inspection Summary */}
    <div className="mt-4">
      <h3 className="text-md font-semibold">Inspection Summary</h3>
      <Input placeholder="Enter Final Inspection Remarks" className="mt-2" />
      <Button type="primary" className="mt-2">Submit Final Inspection</Button>
    </div>

    {/* Inspection Results Table */}
    <div className="mt-4">
      <h3 className="text-md font-semibold">Inspection Results</h3>
      <Table
        dataSource={[
          { key: '1', test: 'Leak Test', status: 'Passed', inspector: 'John Doe', date: '2024-12-23', comments: 'No leaks detected.' },
          { key: '2', test: 'Measurement Accuracy', status: 'Failed', inspector: 'Jane Smith', date: '2024-12-22', comments: 'Out of tolerance.' },
        ]}
        columns={[
          { title: 'Test Name', dataIndex: 'test', key: 'test' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Inspector', dataIndex: 'inspector', key: 'inspector' },
          { title: 'Date', dataIndex: 'date', key: 'date' },
          { title: 'Comments', dataIndex: 'comments', key: 'comments' },
        ]}
        pagination={false}
        size="small"
      />
    </div>

    {/* Defect Tracker */}
    <div className="mt-4">
      <h3 className="text-md font-semibold">Defect Tracker</h3>
      <Table
        dataSource={[
          { key: '1', defectId: 'D001', description: 'Leak detected', status: 'Resolved', date: '2024-12-23', assignedTo: 'John Doe' },
          { key: '2', defectId: 'D002', description: 'Incorrect measurement', status: 'Open', date: '2024-12-22', assignedTo: 'Jane Smith' },
        ]}
        columns={[
          { title: 'Defect ID', dataIndex: 'defectId', key: 'defectId' },
          { title: 'Description', dataIndex: 'description', key: 'description' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Date Identified', dataIndex: 'date', key: 'date' },
          { title: 'Assigned To', dataIndex: 'assignedTo', key: 'assignedTo' },
        ]}
        pagination={false}
        size="small"
      />
    </div>

    {/* Final Approval Section */}
    <div className="mt-4">
      <h3 className="text-md font-semibold">Final Approval</h3>
      <Select placeholder="Select Approval Status" className="w-full mt-2">
        <Select.Option value="approved">Approved</Select.Option>
        <Select.Option value="rejected">Rejected</Select.Option>
      </Select>
      <Input placeholder="Approval Date" className="mt-2" />
      <Input placeholder="Approved By" className="mt-2" />
      <Input.TextArea placeholder="Final Remarks" className="mt-2" />
      <Button type="primary" className="mt-2">Submit Approval</Button>
    </div>

    {/* Export Button */}
    <Button type="default" className="mt-4" onClick={exportFinalReport}>Export Report</Button>
    </div>
          </TabPane>
          <TabPane tab="Analytics" key="5">...</TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default IPIDGenerationTab;
