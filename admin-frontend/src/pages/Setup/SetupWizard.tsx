import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import WelcomeStep from './WelcomeStep';
import AdminUserStep from './AdminUserStep';
import CompanyProfileStep from './CompanyProfileStep';
import ConfigurationStep from './ConfigurationStep';
import CompletionStep from './CompletionStep';
import api from '../../services/api';

export interface SetupData {
  // Admin user
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  adminPhone: string;

  // Company
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;

  // Configuration
  timezone: string;
  currency: string;
  dateFormat: string;

  // Demo data
  includeDemoData: boolean;
}

const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({
    adminEmail: '',
    adminPassword: '',
    adminFullName: '',
    adminPhone: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    includeDemoData: true // Default to true for better first-time experience
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpdateData = (data: Partial<SetupData>) => {
    setSetupData({ ...setupData, ...data });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post<{
        user: {
          id: string;
          email: string;
          fullName: string;
          role: string;
        };
        company: {
          id: string;
          name: string;
          email: string;
        };
      }>('/setup/initialize', setupData);

      // Check if setup was successful
      if (response.success && response.data) {
        toast.success('Setup completed successfully!');
        setCurrentStep(5); // Move to completion step
      } else {
        toast.error(response.error || 'Setup failed');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.response?.data?.error || 'Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    navigate('/login');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return (
          <AdminUserStep
            data={setupData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <CompanyProfileStep
            data={setupData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ConfigurationStep
            data={setupData}
            onUpdate={handleUpdateData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        );
      case 5:
        return (
          <CompletionStep
            data={setupData}
            onFinish={handleFinish}
          />
        );
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <span className="text-5xl font-pacifico text-primary">FSM Pro</span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Welcome to FSM Pro Setup
          </h1>
          <p className="mt-2 text-gray-600">
            Let's get your field service management system up and running
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps - 1}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 FSM Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;

