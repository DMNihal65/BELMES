import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InventoryOverview from './inventory/InventoryOverview';
import InventoryMasterData from './inventory/InventoryMasterData';

const InventoryManagement = () => {
  return (
    <div className="p-4">
      <Routes>
        <Route path="overview" element={<InventoryOverview />} />
        <Route path="master-data" element={<InventoryMasterData />} />
      </Routes>
    </div>
  );
};

export default InventoryManagement;