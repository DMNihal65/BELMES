import React, { useState } from 'react';
import { Tabs } from 'antd'; 
import Analytics from './Analytics/Analytics'; // Import Analytics component
import Requests from './Analytics/Requests'; // Import Requests component
import ReturnRequests from './Analytics/ReturnRequests'; // Import Return Requests component
import Calibration from './Analytics/Calibration'; // Import Calibration component
import History from './Analytics/History'; // Import History component
const { TabPane } = Tabs;

function InventoryAnalytics() {
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
        <Tabs defaultActiveKey="requests">
            <TabPane tab="Inventory Requests" key="requests">
                <Requests />
            </TabPane>
            <TabPane tab="Return Requests" key="return-requests">
                <ReturnRequests />
            </TabPane>
            <TabPane tab="Calibration" key="calibration">
                <Calibration />
            </TabPane>
            {/* <TabPane tab="Analytics" key="analytics">
                <Analytics />
            </TabPane> */}
            {/* <TabPane tab="History" key="history">
                <History 
                    showModal={showModal} 
                    handleDownloadData={handleDownloadData} 
                    handleFileUpload={handleFileUpload} 
                />
            </TabPane> */}
        </Tabs>
    );
}

export default InventoryAnalytics;