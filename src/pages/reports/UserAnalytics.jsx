import { Card, Table, DatePicker } from 'antd'

function UserAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Report</h1>
        <DatePicker.RangePicker />
      </div>
      
      <Card>
        <Table 
          columns={[
            { title: 'Date', dataIndex: 'date' },
            { title: 'Product', dataIndex: 'product' },
            { title: 'Amount', dataIndex: 'amount' },
            { title: 'Status', dataIndex: 'status' },
          ]}
          // Add your data here
        />

        <Table 
          columns={[
            { title: 'Date', dataIndex: 'date' },
            { title: 'Product', dataIndex: 'product' },
            { title: 'Amount', dataIndex: 'amount' },
            { title: 'Status', dataIndex: 'status' },
          ]}
          // Add your data here
        />
        
      </Card>
    </div>
  )
}

export default UserAnalytics 