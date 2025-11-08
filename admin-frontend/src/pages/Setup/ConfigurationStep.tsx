import React from 'react';
import { useForm } from 'react-hook-form';
import { SetupData } from './SetupWizard';

interface ConfigurationStepProps {
  data: SetupData;
  onUpdate: (data: Partial<SetupData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

interface ConfigurationForm {
  timezone: string;
  currency: string;
  dateFormat: string;
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfigurationForm>({
    defaultValues: {
      timezone: data.timezone || 'America/New_York',
      currency: data.currency || 'USD',
      dateFormat: data.dateFormat || 'MM/DD/YYYY',
    },
  });

  const onFormSubmit = (formData: ConfigurationForm) => {
    onUpdate({
      timezone: formData.timezone,
      currency: formData.currency,
      dateFormat: formData.dateFormat,
    });
    onSubmit();
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Configuration</h2>
        <p className="text-gray-600">
          Configure your system preferences
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone <span className="text-red-500">*</span>
          </label>
          <select
            {...register('timezone', { required: 'Timezone is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <optgroup label="US Timezones">
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Phoenix">Arizona Time (MST)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
            </optgroup>
            <optgroup label="Other Timezones">
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </optgroup>
          </select>
          {errors.timezone && (
            <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This will be used for scheduling and timestamps
          </p>
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            {...register('currency', { required: 'Currency is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="CAD">Canadian Dollar (CAD)</option>
            <option value="AUD">Australian Dollar (AUD)</option>
            <option value="JPY">Japanese Yen (JPY)</option>
            <option value="INR">Indian Rupee (INR)</option>
          </select>
          {errors.currency && (
            <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This will be used for invoices and pricing
          </p>
        </div>

        {/* Date Format */}
        <div>
          <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
            Date Format <span className="text-red-500">*</span>
          </label>
          <select
            {...register('dateFormat', { required: 'Date format is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
            <option value="DD-MMM-YYYY">DD-MMM-YYYY (31-Dec-2024)</option>
          </select>
          {errors.dateFormat && (
            <p className="mt-1 text-sm text-red-600">{errors.dateFormat.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This will be used throughout the system
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="ri-checkbox-circle-line text-green-600 text-xl"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-900">Almost done!</h4>
              <p className="text-sm text-green-700 mt-1">
                Click "Complete Setup" to finalize your configuration and create your account.
                You can change these settings later in the system preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Setting up...
              </>
            ) : (
              <>
                <i className="ri-check-line mr-2"></i>
                Complete Setup
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigurationStep;

