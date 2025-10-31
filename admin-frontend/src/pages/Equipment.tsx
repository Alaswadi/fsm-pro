import React from 'react';
import EquipmentTypes from '../components/EquipmentTypes';

const Equipment: React.FC = () => {

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Types</h1>
          <p className="text-gray-600 mt-1">Manage equipment brands, models, and specifications</p>
        </div>
      </div>

      {/* Equipment Types Content */}
      <EquipmentTypes />
    </div>
  );
};

export default Equipment;
