import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

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

interface SettingsState {
  activeTab: 'company' | 'skills' | 'certifications';
  loading: boolean;
  company: Company | null;
  skills: Skill[];
  certifications: Certification[];
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

  useEffect(() => {
    loadData();
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
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'company', label: 'Company Profile', icon: 'ri-building-line' },
              { id: 'skills', label: 'Skills Management', icon: 'ri-tools-line' },
              { id: 'certifications', label: 'Certifications', icon: 'ri-award-line' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
