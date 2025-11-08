import React from 'react';
import { SetupData } from './SetupWizard';

interface CompletionStepProps {
  data: SetupData;
  onFinish: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = ({ data, onFinish }) => {
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <i className="ri-checkbox-circle-fill text-5xl text-green-600"></i>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Setup Complete!
        </h2>
        <p className="text-gray-600 text-lg">
          Your FSM Pro system is ready to use
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Summary</h3>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="ri-user-line text-blue-600 text-xl mt-1"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Administrator Account</p>
              <p className="text-sm text-gray-600">{data.adminFullName}</p>
              <p className="text-sm text-gray-600">{data.adminEmail}</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="ri-building-line text-blue-600 text-xl mt-1"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Company</p>
              <p className="text-sm text-gray-600">{data.companyName}</p>
              {data.companyEmail && (
                <p className="text-sm text-gray-600">{data.companyEmail}</p>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="ri-settings-line text-blue-600 text-xl mt-1"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Configuration</p>
              <p className="text-sm text-gray-600">
                Timezone: {data.timezone} • Currency: {data.currency} • Date: {data.dateFormat}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="ri-lightbulb-line text-yellow-500 text-xl"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">Next Steps</h4>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <i className="ri-arrow-right-s-line mr-1"></i>
                  Add technicians to your team
                </li>
                <li className="flex items-center">
                  <i className="ri-arrow-right-s-line mr-1"></i>
                  Create customer profiles
                </li>
                <li className="flex items-center">
                  <i className="ri-arrow-right-s-line mr-1"></i>
                  Configure equipment types and inventory
                </li>
                <li className="flex items-center">
                  <i className="ri-arrow-right-s-line mr-1"></i>
                  Start creating work orders
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="ri-information-line text-blue-600 text-xl"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">Login Credentials</h4>
              <p className="text-sm text-blue-700 mt-1">
                Use the email and password you just created to log in to the system.
                Make sure to keep your credentials secure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onFinish}
          className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-lg flex items-center shadow-lg"
        >
          Go to Login
          <i className="ri-arrow-right-line ml-2"></i>
        </button>
      </div>
    </div>
  );
};

export default CompletionStep;

