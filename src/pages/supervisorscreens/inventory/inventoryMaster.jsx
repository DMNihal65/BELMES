import React, { useState } from 'react';
import { Tabs, Card, Button } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Tools from './Tools/Tools'; 
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';
import FilterSidebar from '../../../components/inventory/FilterSidebar';

const { TabPane } = Tabs;

function Inventory() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  // // Define filter fields for each component
  // const filterFields = [
  //   {
  //     name: 'toolType',
  //     label: 'Tool Type',
  //     options: [
  //       { label: 'End Mill', value: 'end_mill' },
  //       { label: 'Drill', value: 'drill' },
  //       { label: 'Insert', value: 'insert' }
  //     ]
  //   },
  //   {
  //     name: 'size',
  //     label: 'Size',
  //     options: [
  //       { label: 'Small', value: 'small' },
  //       { label: 'Medium', value: 'medium' },
  //       { label: 'Large', value: 'large' }
  //     ]
  //   },
  //   // Add more filter fields as needed
  // ];

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
    setFilterVisible(false);
  };

  return (
    <div className="p-4">
      {/* <div className="flex justify-end mb-4">
        <Button 
          type="primary" 
          icon={<FilterOutlined />}
          onClick={() => setFilterVisible(true)}
        >
          Master Filter
        </Button>
      </div> */}

      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Tools" key="1">
            <Tools filters={activeFilters} />
          </TabPane>
          <TabPane tab="Gauges & Instruments" key="2">
            <GaugesAndInstruments filters={activeFilters} />
          </TabPane>
          <TabPane tab="Fixtures" key="3">
            <Fixtures filters={activeFilters} />
          </TabPane>
          <TabPane tab="Raw Materials" key="4">
            <RawMaterials filters={activeFilters} />
          </TabPane>
          <TabPane tab="Consumables" key="5">
            <Consumables filters={activeFilters} />
          </TabPane>
        </Tabs>
      </Card>

      {/* <FilterSidebar
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleFilterApply}
        filterFields={filterFields}
      /> */}
    </div>
  );
}

export default Inventory;