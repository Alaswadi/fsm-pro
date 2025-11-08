import React from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
          <i className="ri-rocket-line text-4xl text-primary"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let's Get Started!
        </h2>
        <p className="text-gray-600">
          This wizard will guide you through the initial setup of your FSM Pro system
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <i className="ri-user-add-line text-green-600 text-xl"></i>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Create Admin Account</h3>
            <p className="text-gray-600">
              Set up your administrator account with secure credentials
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <i className="ri-building-line text-blue-600 text-xl"></i>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
            <p className="text-gray-600">
              Enter your company information and contact details
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
              <i className="ri-settings-3-line text-purple-600 text-xl"></i>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Configuration</h3>
            <p className="text-gray-600">
              Configure timezone, currency, and date format preferences
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="ri-information-line text-blue-600 text-xl"></i>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Before you begin</h4>
            <p className="text-sm text-blue-700 mt-1">
              Make sure you have your company information ready. This setup will only take a few minutes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center"
        >
          Get Started
          <i className="ri-arrow-right-line ml-2"></i>
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;

