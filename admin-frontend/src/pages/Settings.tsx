import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import type { WorkshopSettings } from '../types/workshop';

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  business_type?: string;
  tax_id?: string;
  license_number?: string;
  timezone?: string;
  currency?: string;
  date_format?: string;
  time_format?: string;
}

interface Skill {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sort_order: number;
  is_active: boolean;
}

interface Certification {
  id: string;
  name: string;
  description?: string;
  issuing_organization?: string;
  validity_period_months?: number;
  renewal_required: boolean;
  renewal_notice_days: number;
  sort_order: number;
  is_active: boolean;
}

interface MailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
  from_email: string;
  is_enabled: boolean;
}



interface SettingsState {
  activeTab: 'company' | 'skills' | 'certifications' | 'mail' | 'workshop';
  loading: boolean;
  company: Company | null;
  skills: Skill[];
  certifications: Certification[];
  mailSettings: MailSettings | null;
  workshopSettings: WorkshopSettings | null;
  showSkillModal: boolean;
  showCertModal: boolean;
  editingSkill: Skill | null;
  editingCert: Certification | null;
}

const Settings: React.FC = () => {
  const [state, setState] = useState<SettingsState>({
    activeTab: 'company',
    loading: true,
    company: null,
    skills: [],
    certifications: [],
    mailSettings: null,
    workshopSettings: null,
    showSkillModal: false,
    showCertModal: false,
    editingSkill: null,
    editingCert: null,
  });

  const [companyForm, setCompanyForm] = useState<Partial<Company>>({});
  const [skillForm, setSkillForm] = useState({
    name: '',
    description: '',
    category: '',
    sort_order: 0,
  });
  const [certForm, setCertForm] = useState({
    name: '',
    description: '',
    issuing_organization: '',
    validity_period_months: '',
    renewal_required: false,
    renewal_notice_days: 30,
    sort_order: 0,
  });

  const [mailForm, setMailForm] = useState<MailSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    from_name: 'FSM Pro',
    from_email: '',
    is_enabled: false,
  });

  const [testEmail, setTestEmail] = useState('');

  const [workshopForm, setWorkshopForm] = useState<Partial<WorkshopSettings>>({
    max_concurrent_jobs: 20,
    max_jobs_per_technician: 5,
    default_estimated_repair_hours: 24,
    default_pickup_delivery_fee: 0,
    workshop_address: '',
    workshop_phone: '',
    send_intake_confirmation: true,
    send_ready_notification: true,
    send_status_updates: true,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeTab]);

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      if (state.activeTab === 'company') {
        const response = await apiService.get<Company>('/settings/company');
        if (response.success && response.data) {
          setState(prev => ({ ...prev, company: response.data || null }));
          setCompanyForm(response.data);
        }
      } else if (state.activeTab === 'skills') {
        const response = await apiService.get<Skill[]>('/settings/skills');
        if (response.success && response.data) {
          setState(prev => ({ ...prev, skills: response.data || [] }));
        }
      } else if (state.activeTab === 'certifications') {
        const response = await apiService.get<Certification[]>('/settings/certifications');
        if (response.success && response.data) {
          setState(prev => ({ ...prev, certifications: response.data || [] }));
        }
      } else if (state.activeTab === 'mail') {
        const response = await apiService.getMailSettings();
        if (response.success && response.data) {
          setState(prev => ({ ...prev, mailSettings: response.data }));
          setMailForm(response.data);
        }
      } else if (state.activeTab === 'workshop') {
        const response = await apiService.get<WorkshopSettings>('/workshop/settings');
        if (response.success && response.data) {
          setState(prev => ({ ...prev, workshopSettings: response.data || null }));
          setWorkshopForm(response.data);
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.put<Company>('/settings/company', companyForm);
      if (response.success) {
        toast.success('Company profile updated successfully');
        setState(prev => ({ ...prev, company: response.data || null }));
      } else {
        throw new Error(response.error || 'Failed to update company profile');
      }
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast.error(error.response?.data?.error || 'Failed to update company profile');
    }
  };

  const openSkillModal = (skill?: Skill) => {
    if (skill) {
      setState(prev => ({ ...prev, editingSkill: skill, showSkillModal: true }));
      setSkillForm({
        name: skill.name,
        description: skill.description || '',
        category: skill.category || '',
        sort_order: skill.sort_order,
      });
    } else {
      setState(prev => ({ ...prev, editingSkill: null, showSkillModal: true }));
      setSkillForm({
        name: '',
        description: '',
        category: '',
        sort_order: state.skills.length,
      });
    }
  };

  const closeSkillModal = () => {
    setState(prev => ({ ...prev, showSkillModal: false, editingSkill: null }));
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (state.editingSkill) {
        const response = await apiService.put(`/settings/skills/${state.editingSkill.id}`, skillForm);
        if (response.success) {
          toast.success('Skill updated successfully');
        }
      } else {
        const response = await apiService.post('/settings/skills', skillForm);
        if (response.success) {
          toast.success('Skill created successfully');
        }
      }
      closeSkillModal();
      loadData();
    } catch (error: any) {
      console.error('Error saving skill:', error);
      toast.error(error.response?.data?.error || 'Failed to save skill');
    }
  };

  const deleteSkill = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    
    try {
      const response = await apiService.delete(`/settings/skills/${id}`);
      if (response.success) {
        toast.success('Skill deleted successfully');
        loadData();
      }
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      toast.error(error.response?.data?.error || 'Failed to delete skill');
    }
  };

  const openCertModal = (cert?: Certification) => {
    if (cert) {
      setState(prev => ({ ...prev, editingCert: cert, showCertModal: true }));
      setCertForm({
        name: cert.name,
        description: cert.description || '',
        issuing_organization: cert.issuing_organization || '',
        validity_period_months: cert.validity_period_months?.toString() || '',
        renewal_required: cert.renewal_required,
        renewal_notice_days: cert.renewal_notice_days,
        sort_order: cert.sort_order,
      });
    } else {
      setState(prev => ({ ...prev, editingCert: null, showCertModal: true }));
      setCertForm({
        name: '',
        description: '',
        issuing_organization: '',
        validity_period_months: '',
        renewal_required: false,
        renewal_notice_days: 30,
        sort_order: state.certifications.length,
      });
    }
  };

  const closeCertModal = () => {
    setState(prev => ({ ...prev, showCertModal: false, editingCert: null }));
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...certForm,
        validity_period_months: certForm.validity_period_months ? parseInt(certForm.validity_period_months) : null,
      };

      if (state.editingCert) {
        const response = await apiService.put(`/settings/certifications/${state.editingCert.id}`, data);
        if (response.success) {
          toast.success('Certification updated successfully');
        }
      } else {
        const response = await apiService.post('/settings/certifications', data);
        if (response.success) {
          toast.success('Certification created successfully');
        }
      }
      closeCertModal();
      loadData();
    } catch (error: any) {
      console.error('Error saving certification:', error);
      toast.error(error.response?.data?.error || 'Failed to save certification');
    }
  };

  const deleteCertification = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) return;
    
    try {
      const response = await apiService.delete(`/settings/certifications/${id}`);
      if (response.success) {
        toast.success('Certification deleted successfully');
        loadData();
      }
    } catch (error: any) {
      console.error('Error deleting certification:', error);
      toast.error(error.response?.data?.error || 'Failed to delete certification');
    }
  };

  const handleMailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.updateMailSettings(mailForm);
      if (response.success) {
        toast.success('Mail settings updated successfully');
        setState(prev => ({ ...prev, mailSettings: response.data }));
      } else {
        throw new Error(response.error || 'Failed to update mail settings');
      }
    } catch (error: any) {
      console.error('Error updating mail settings:', error);
      toast.error(error.response?.data?.error || 'Failed to update mail settings');
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error('Please enter a test email address');
      return;
    }

    try {
      const response = await apiService.testMailSettings(testEmail);
      if (response.success) {
        toast.success(`Test email sent successfully to ${testEmail}`);
        setTestEmail('');
      } else {
        throw new Error(response.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.response?.data?.error || 'Failed to send test email');
    }
  };

  const handleWorkshopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate workshop settings
    const errors: string[] = [];
    
    if (workshopForm.max_concurrent_jobs && (workshopForm.max_concurrent_jobs < 1 || workshopForm.max_concurrent_jobs > 1000)) {
      errors.push('Max concurrent jobs must be between 1 and 1000');
    }
    
    if (workshopForm.max_jobs_per_technician && (workshopForm.max_jobs_per_technician < 1 || workshopForm.max_jobs_per_technician > 100)) {
      errors.push('Max jobs per technician must be between 1 and 100');
    }
    
    if (workshopForm.default_estimated_repair_hours && (workshopForm.default_estimated_repair_hours < 1 || workshopForm.default_estimated_repair_hours > 1000)) {
      errors.push('Default estimated repair hours must be between 1 and 1000');
    }
    
    if (workshopForm.default_pickup_delivery_fee !== undefined && workshopForm.default_pickup_delivery_fee < 0) {
      errors.push('Default pickup/delivery fee cannot be negative');
    }
    
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    
    try {
      const response = await apiService.put<WorkshopSettings>('/workshop/settings', workshopForm);
      if (response.success) {
        toast.success('Workshop settings updated successfully');
        setState(prev => ({ ...prev, workshopSettings: response.data || null }));
      } else {
        throw new Error(response.error || 'Failed to update workshop settings');
      }
    } catch (error: any) {
      console.error('Error updating workshop settings:', error);
      toast.error(error.response?.data?.error || 'Failed to update workshop settings');
    }
  };

  if (state.loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your company profile, skills, and certifications</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-4 px-6">
            {[
              { id: 'company', label: 'Company Profile', icon: 'ri-building-line' },
              { id: 'skills', label: 'Skills Management', icon: 'ri-tools-line' },
              { id: 'certifications', label: 'Certifications', icon: 'ri-award-line' },
              { id: 'mail', label: 'Mail Settings', icon: 'ri-mail-settings-line' },
              { id: 'workshop', label: 'Workshop Settings', icon: 'ri-settings-3-line' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                  state.activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {state.activeTab === 'company' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
            </div>
            
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.name || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Type</label>
                  <input
                    type="text"
                    value={companyForm.business_type || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, business_type: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    value={companyForm.address || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={companyForm.phone || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={companyForm.email || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    value={companyForm.website || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                  <input
                    type="text"
                    value={companyForm.tax_id || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, tax_id: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {state.activeTab === 'skills' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Skills Management</h2>
              <button
                onClick={() => openSkillModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <i className="ri-add-line"></i>
                <span>Add Skill</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.skills.map((skill) => (
                <div key={skill.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{skill.name}</h3>
                      {skill.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                          {skill.category}
                        </span>
                      )}
                      {skill.description && (
                        <p className="text-sm text-gray-600 mt-2">{skill.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => openSkillModal(skill)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {state.skills.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <i className="ri-tools-line text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No skills defined</h3>
                  <p className="text-gray-500 mb-4">Create your first skill to get started.</p>
                  <button
                    onClick={() => openSkillModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add First Skill
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {state.activeTab === 'certifications' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Certifications Management</h2>
              <button
                onClick={() => openCertModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <i className="ri-add-line"></i>
                <span>Add Certification</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.certifications.map((cert) => (
                <div key={cert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{cert.name}</h3>
                      {cert.issuing_organization && (
                        <p className="text-sm text-gray-600 mt-1">Issued by: {cert.issuing_organization}</p>
                      )}
                      {cert.description && (
                        <p className="text-sm text-gray-600 mt-2">{cert.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        {cert.validity_period_months && (
                          <span>Valid for {cert.validity_period_months} months</span>
                        )}
                        {cert.renewal_required && (
                          <span className="text-orange-600">Renewal required</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => openCertModal(cert)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => deleteCertification(cert.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {state.certifications.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <i className="ri-award-line text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications defined</h3>
                  <p className="text-gray-500 mb-4">Create your first certification to get started.</p>
                  <button
                    onClick={() => openCertModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add First Certification
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {state.activeTab === 'mail' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Mail Settings</h2>
            </div>

            <form onSubmit={handleMailSubmit} className="space-y-6">
              {/* Enable/Disable Mail */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Enable Email Service</h3>
                  <p className="text-sm text-gray-500">Allow the system to send emails for password resets and notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mailForm.is_enabled}
                    onChange={(e) => setMailForm(prev => ({ ...prev, is_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* SMTP Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Host *</label>
                  <input
                    type="text"
                    required={mailForm.is_enabled}
                    value={mailForm.smtp_host}
                    onChange={(e) => setMailForm(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Port *</label>
                  <input
                    type="number"
                    required={mailForm.is_enabled}
                    value={mailForm.smtp_port}
                    onChange={(e) => setMailForm(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Username *</label>
                  <input
                    type="text"
                    required={mailForm.is_enabled}
                    value={mailForm.smtp_user}
                    onChange={(e) => setMailForm(prev => ({ ...prev, smtp_user: e.target.value }))}
                    placeholder="your-email@gmail.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Password *</label>
                  <input
                    type="password"
                    required={mailForm.is_enabled && mailForm.smtp_password !== '••••••••'}
                    value={mailForm.smtp_password}
                    onChange={(e) => setMailForm(prev => ({ ...prev, smtp_password: e.target.value }))}
                    placeholder={mailForm.smtp_password === '••••••••' ? 'Password is set' : 'Enter password'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">From Name</label>
                  <input
                    type="text"
                    value={mailForm.from_name}
                    onChange={(e) => setMailForm(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder="FSM Pro"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">From Email *</label>
                  <input
                    type="email"
                    required={mailForm.is_enabled}
                    value={mailForm.from_email}
                    onChange={(e) => setMailForm(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder="noreply@yourcompany.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* SSL/TLS Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smtp_secure"
                  checked={mailForm.smtp_secure}
                  onChange={(e) => setMailForm(prev => ({ ...prev, smtp_secure: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="smtp_secure" className="ml-2 block text-sm text-gray-900">
                  Use SSL/TLS (recommended for port 465)
                </label>
              </div>

              {/* Test Email Section */}
              {mailForm.is_enabled && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Test Email Configuration</h3>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Enter test email address"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Send Test Email
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Send a test email to verify your configuration is working correctly.
                  </p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Mail Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {state.activeTab === 'workshop' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Workshop Settings</h2>
            </div>

            <form onSubmit={handleWorkshopSubmit} className="space-y-6">
              {/* Capacity Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Capacity Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Concurrent Jobs *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={workshopForm.max_concurrent_jobs || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                        setWorkshopForm(prev => ({ ...prev, max_concurrent_jobs: isNaN(value) ? 1 : value }));
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of jobs the workshop can handle at once</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Jobs Per Technician *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={workshopForm.max_jobs_per_technician || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                        setWorkshopForm(prev => ({ ...prev, max_jobs_per_technician: isNaN(value) ? 1 : value }));
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum jobs each technician can work on simultaneously</p>
                  </div>
                </div>
              </div>

              {/* Default Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Default Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Estimated Repair Hours *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={workshopForm.default_estimated_repair_hours || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                        setWorkshopForm(prev => ({ ...prev, default_estimated_repair_hours: isNaN(value) ? 1 : value }));
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default time estimate for repairs (in hours)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Pickup/Delivery Fee</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={workshopForm.default_pickup_delivery_fee || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setWorkshopForm(prev => ({ ...prev, default_pickup_delivery_fee: isNaN(value) ? 0 : value }));
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default fee for equipment pickup/delivery</p>
                  </div>
                </div>
              </div>

              {/* Workshop Location */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Workshop Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Workshop Address</label>
                    <textarea
                      rows={3}
                      value={workshopForm.workshop_address || ''}
                      onChange={(e) => setWorkshopForm(prev => ({ ...prev, workshop_address: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter workshop address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Workshop Phone</label>
                    <input
                      type="tel"
                      value={workshopForm.workshop_phone || ''}
                      onChange={(e) => setWorkshopForm(prev => ({ ...prev, workshop_phone: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Workshop contact number"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Send Intake Confirmation</h4>
                      <p className="text-sm text-gray-500">Notify customers when equipment is received</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={workshopForm.send_intake_confirmation || false}
                        onChange={(e) => setWorkshopForm(prev => ({ ...prev, send_intake_confirmation: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Send Ready Notification</h4>
                      <p className="text-sm text-gray-500">Notify customers when equipment is ready for pickup</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={workshopForm.send_ready_notification || false}
                        onChange={(e) => setWorkshopForm(prev => ({ ...prev, send_ready_notification: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Send Status Updates</h4>
                      <p className="text-sm text-gray-500">Notify customers of repair progress updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={workshopForm.send_status_updates || false}
                        onChange={(e) => setWorkshopForm(prev => ({ ...prev, send_status_updates: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Workshop Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Skill Modal */}
      {state.showSkillModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {state.editingSkill ? 'Edit Skill' : 'Add New Skill'}
                </h3>
                <button
                  onClick={closeSkillModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSkillSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skill Name *</label>
                  <input
                    type="text"
                    required
                    value={skillForm.name}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={skillForm.category}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Electrical, HVAC, Plumbing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    value={skillForm.description}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of this skill"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeSkillModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {state.editingSkill ? 'Update' : 'Create'} Skill
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {state.showCertModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {state.editingCert ? 'Edit Certification' : 'Add New Certification'}
                </h3>
                <button
                  onClick={closeCertModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleCertSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Certification Name *</label>
                    <input
                      type="text"
                      required
                      value={certForm.name}
                      onChange={(e) => setCertForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issuing Organization</label>
                    <input
                      type="text"
                      value={certForm.issuing_organization}
                      onChange={(e) => setCertForm(prev => ({ ...prev, issuing_organization: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., EPA, OSHA, State Board"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    value={certForm.description}
                    onChange={(e) => setCertForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of this certification"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Validity Period (months)</label>
                    <input
                      type="number"
                      min="1"
                      value={certForm.validity_period_months}
                      onChange={(e) => setCertForm(prev => ({ ...prev, validity_period_months: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Leave empty for no expiration"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Renewal Notice (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={certForm.renewal_notice_days}
                      onChange={(e) => setCertForm(prev => ({ ...prev, renewal_notice_days: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={certForm.renewal_required}
                      onChange={(e) => setCertForm(prev => ({ ...prev, renewal_required: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Renewal required</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCertModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {state.editingCert ? 'Update' : 'Create'} Certification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
