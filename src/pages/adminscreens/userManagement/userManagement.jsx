import React, {useState } from 'react';
import RegisterNewUser from '../userManagement/RegisterNewuser';
import AllUsersDataTable from './AllUsersDataTable';

const UserManagement = () => {
    const [reloadTable, setReloadTable] = useState(false);

  const handleUserRegistered = () => {
    setReloadTable(prev => !prev); // Toggle to trigger re-fetch
  };

  return (
    <div className="w-full px-4 md:px-4 py-2 space-y-8">

      {/* Register New User Card */}
      <div className="bg-white border border-gray-200 shadow-md rounded-2xl p-2 h-20">
        <div className="flex items-center justify-between border-b border-gray-300">
          <h2 className="text-2xl font-bold text-sky-900">Register New User</h2>
           <RegisterNewUser onSuccess={handleUserRegistered} />
        </div>
        {/* If your RegisterNewUser also renders something like a form inside, it will show here */}
      </div>

      {/* All Users Data Table Card */}
      <div className="bg-white border border-gray-200 shadow-md rounded-2xl p-3">
        <div className="border-b border-gray-300">
          <h2 className="text-2xl font-bold text-sky-900 text-center">All Users</h2>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-6xl ">
          <AllUsersDataTable reload={reloadTable} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserManagement;
