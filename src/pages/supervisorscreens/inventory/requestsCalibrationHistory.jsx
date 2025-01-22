import React, { useState } from 'react';
import { Tabs } from 'antd'; 
import Analytics from './Analytics/Analytics'; // Import Analytics component
import Requests from './Requests'; // Import Requests component
import Calibration from './Calibration'; // Import Calibration component
import History from './History'; // Import History component
const { TabPane } = Tabs;

function RequestsCalibrationHistory() {
    const showModal = () => {
        // Function to show modal for adding new tool
    };

    const handleDownloadData = () => {
        // Function to handle data download
    };

    const handleFileUpload = (file) => {
        // Function to handle file upload
        return false; // Prevent automatic upload
    };

    return (
        <Tabs defaultActiveKey="analytics">
            <TabPane tab="Analytics" key="analytics">
                <Analytics />
            </TabPane>
            <TabPane tab="Requests" key="requests">
                <Requests />
            </TabPane>
            <TabPane tab="Calibration" key="calibration">
                <Calibration />
            </TabPane>
            <TabPane tab="History" key="history">
                <History 
                    showModal={showModal} 
                    handleDownloadData={handleDownloadData} 
                    handleFileUpload={handleFileUpload} 
                />
            </TabPane>
        </Tabs>
    );
}

export default RequestsCalibrationHistory;