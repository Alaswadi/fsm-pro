import React from 'react';
import { useForm } from 'react-hook-form';
import { SetupData } from './SetupWizard';

interface CompanyProfileStepProps {
  data: SetupData;
  onUpdate: (data: Partial<SetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CompanyProfileForm {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
}

const CompanyProfileStep: React.FC<CompanyProfileStepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyProfileForm>({
    defaultValues: {
      companyName: data.companyName,
      companyEmail: data.companyEmail || data.adminEmail,
      companyPhone: data.companyPhone,
      companyAddress: data.companyAddress,
    },
  });

  const onSubmit = (formData: CompanyProfileForm) => {
    onUpdate({
      companyName: formData.companyName,
      companyEmail: formData.companyEmail,
      companyPhone: formData.companyPhone,
      companyAddress: formData.companyAddress,
    });
    onNext();
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Profile</h2>
        <p className="text-gray-600">
          Enter your company information and contact details
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('companyName', {
              required: 'Company name is required',
              minLength: { value: 2, message: 'Company name must be at least 2 characters' },
            })}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Acme Field Services"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
          )}
        </div>

        {/* Company Email */}
        <div>
          <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Company Email
          </label>
          <input
            {...register('companyEmail', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="info@company.com"
          />
          {errors.companyEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.companyEmail.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This will be used for customer communications
          </p>
        </div>

        {/* Company Phone */}
        <div>
          <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Company Phone
          </label>
          <input
            {...register('companyPhone')}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Company Address */}
        <div>
          <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Company Address
          </label>
          <textarea
            {...register('companyAddress')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="123 Main Street&#10;Suite 100&#10;City, State 12345"
          />
          <p className="mt-1 text-xs text-gray-500">
            Full business address including street, city, state, and ZIP code
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="ri-information-line text-blue-600 text-xl"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                This information will appear on invoices, work orders, and customer communications.
                You can update these details later in the settings.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center"
          >
            Continue
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfileStep;

