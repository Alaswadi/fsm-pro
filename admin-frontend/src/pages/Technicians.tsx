import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { Technician, TechniciansResponse } from '../types';

interface TechniciansPageState {
  technicians: Technician[];
  loading: boolean;
  searchTerm: string;
  statusFilter: string;
  skillsFilter: string;
  currentPage: number;
  totalPages: number;
  showModal: boolean;
  showDeleteModal: boolean;
  showProfileModal: boolean;
  showPasswordResetModal: boolean;
  showSetPasswordModal: boolean;
  editingTechnician: Technician | null;
  deletingTechnician: Technician | null;
  viewingTechnician: Technician | null;
  resettingPasswordTechnician: Technician | null;
  settingPasswordTechnician: Technician | null;
  activeDropdown: string | null;
  availableSkills: Array<{id: string, name: string, category?: string}>;
  availableCertifications: Array<{id: string, name: string, issuing_organization?: string}>;
}

const Technicians: React.FC = () => {
  const [state, setState] = useState<TechniciansPageState>({
    technicians: [],
    loading: true,
    searchTerm: '',
    statusFilter: '',
    skillsFilter: '',
    currentPage: 1,
    totalPages: 1,
    showModal: false,
    showDeleteModal: false,
    showProfileModal: false,
    showPasswordResetModal: false,
    showSetPasswordModal: false,
    editingTechnician: null,
    deletingTechnician: null,
    viewingTechnician: null,
    resettingPasswordTechnician: null,
    settingPasswordTechnician: null,
    activeDropdown: null,
    availableSkills: [],
    availableCertifications: [],
  });

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    password: '',
    hourly_rate: '',
    max_jobs_per_day: 8,
    is_available: true,
    skill_ids: [] as string[],
    certification_ids: [] as string[],

  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadTechnicians();
    loadTechnicianOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPage, state.searchTerm, state.statusFilter, state.skillsFilter]);

  const loadTechnicianOptions = async () => {
    try {
      const response = await apiService.get<{
        skills: Array<{id: string, name: string, category?: string}>;
        certifications: Array<{id: string, name: string, issuing_organization?: string}>;
      }>('/technicians/options');
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          availableSkills: response.data?.skills || [],
          availableCertifications: response.data?.certifications || []
        }));
      }
    } catch (error) {
      console.error('Error loading technician options:', error);
    }
  };

  const loadTechnicians = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const params: any = {
        page: state.currentPage,
        limit: 10,
      };
      
      if (state.searchTerm) params.search = state.searchTerm;
      if (state.statusFilter) params.status = state.statusFilter;
      if (state.skillsFilter) params.skills = state.skillsFilter;

      const response = await apiService.get<TechniciansResponse>('/technicians', params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          technicians: response.data?.technicians || [],
          totalPages: response.data?.pagination?.totalPages || 1,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
      toast.error('Failed to load technicians');
      setState(prev => ({ ...prev, loading: false, technicians: [] }));
    }
  };

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchTerm: value, currentPage: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setState(prev => ({ ...prev, statusFilter: status, currentPage: 1 }));
  };

  const handleSkillsFilter = (skill: string) => {
    setState(prev => ({ ...prev, skillsFilter: skill, currentPage: 1 }));
  };

  const openModal = (technician?: Technician) => {
    if (technician) {
      setState(prev => ({ ...prev, editingTechnician: technician, showModal: true }));
      setFormData({
        full_name: technician.user?.full_name || '',
        email: technician.user?.email || '',
        phone: technician.user?.phone || '',
        employee_id: technician.employee_id,
        password: '',
        hourly_rate: technician.hourly_rate?.toString() || '',
        max_jobs_per_day: technician.max_jobs_per_day,
        is_available: technician.is_available,
        skill_ids: Array.isArray(technician.skills) ? technician.skills.map((s: any) => s.id || s) : [],
        certification_ids: Array.isArray(technician.certifications) ? technician.certifications.map((c: any) => c.id || c) : [],
      });
    } else {
      setState(prev => ({ ...prev, editingTechnician: null, showModal: true }));
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        employee_id: '',
        password: '',
        hourly_rate: '',
        max_jobs_per_day: 8,
        is_available: true,
        skill_ids: [],
        certification_ids: [],
      });
    }
  };

  const closeModal = () => {
    setState(prev => ({ ...prev, showModal: false, editingTechnician: null }));
  };

  const openProfileModal = async (technician: Technician) => {
    try {
      // Fetch detailed technician data
      const response = await apiService.get<Technician>(`/technicians/${technician.id}`);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          showProfileModal: true,
          viewingTechnician: response.data || null
        }));
      } else {
        // Fallback to existing data if API call fails
        setState(prev => ({
          ...prev,
          showProfileModal: true,
          viewingTechnician: technician
        }));
      }
    } catch (error) {
      console.error('Error loading technician details:', error);
      // Fallback to existing data
      setState(prev => ({
        ...prev,
        showProfileModal: true,
        viewingTechnician: technician
      }));
    }
  };

  const closeProfileModal = () => {
    setState(prev => ({
      ...prev,
      showProfileModal: false,
      viewingTechnician: null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
      };

      // Basic validation
      if (!data.full_name || !data.email || !data.employee_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!state.editingTechnician && !data.password) {
        toast.error('Password is required for new technicians');
        return;
      }

      console.log('Sending technician data:', data);
      console.log('Editing technician:', state.editingTechnician);

      if (state.editingTechnician) {
        console.log('Making PUT request to:', `/technicians/${state.editingTechnician.id}`);
        const response = await apiService.put(`/technicians/${state.editingTechnician.id}`, data);
        console.log('Update response:', response);
        if (response.success) {
          toast.success('Technician updated successfully');
        } else {
          throw new Error(response.error || 'Failed to update technician');
        }
      } else {
        const response = await apiService.post('/technicians', data);
        if (response.success) {
          toast.success('Technician created successfully');
        } else {
          throw new Error(response.error || 'Failed to create technician');
        }
      }

      closeModal();
      loadTechnicians();
    } catch (error: any) {
      console.error('Error saving technician:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save technician';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!state.deletingTechnician) return;

    try {
      const response = await apiService.delete(`/technicians/${state.deletingTechnician.id}`);
      if (response.success) {
        toast.success(
          response.message || 'Technician permanently deleted from the system',
          { duration: 4000 }
        );
        setState(prev => ({ ...prev, showDeleteModal: false, deletingTechnician: null }));
        loadTechnicians();
      } else {
        throw new Error(response.error || 'Failed to delete technician');
      }
    } catch (error: any) {
      console.error('Error deleting technician:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete technician';
      toast.error(errorMessage);
    }
  };

  const toggleAvailability = async (technician: Technician) => {
    try {
      const action = technician.is_available ? 'deactivating' : 'activating';
      const actionPast = technician.is_available ? 'deactivated' : 'activated';

      // Show loading toast
      const loadingToast = toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)} ${technician.user?.full_name}...`);

      const response = await apiService.patch(`/technicians/${technician.id}/availability`);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success(
          `${technician.user?.full_name} has been ${actionPast} successfully`,
          {
            icon: technician.is_available ? '⏸️' : '▶️',
          }
        );
        loadTechnicians();
      } else {
        throw new Error(response.error || 'Failed to update availability');
      }
    } catch (error: any) {
      console.error('Error updating availability:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update availability';
      toast.error(errorMessage);
    }
  };

  const handlePasswordReset = async () => {
    if (!state.resettingPasswordTechnician) return;

    try {
      const technician = state.resettingPasswordTechnician;

      // Show loading toast
      const loadingToast = toast.loading(`Sending password reset email to ${technician.user?.full_name}...`);

      const response = await apiService.adminInitiatePasswordReset(technician.id);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success(
          `Password reset email sent to ${technician.user?.email}`,
          { duration: 5000 }
        );
        setState(prev => ({
          ...prev,
          showPasswordResetModal: false,
          resettingPasswordTechnician: null
        }));
      } else {
        throw new Error(response.error || 'Failed to send password reset email');
      }
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send password reset email';
      toast.error(errorMessage);
    }
  };

  const handleSetPassword = async () => {
    if (!state.settingPasswordTechnician) return;

    // Validation
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    try {
      const technician = state.settingPasswordTechnician;

      // Show loading toast
      const loadingToast = toast.loading(`Setting new password for ${technician.user?.full_name}...`);

      const response = await apiService.adminSetPassword(technician.id, newPassword);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success(
          `Password updated successfully for ${technician.user?.full_name}`,
          { duration: 5000 }
        );
        setState(prev => ({
          ...prev,
          showSetPasswordModal: false,
          settingPasswordTechnician: null
        }));
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
      } else {
        throw new Error(response.error || 'Failed to set password');
      }
    } catch (error: any) {
      console.error('Error setting password:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to set password';
      toast.error(errorMessage);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skill_ids: prev.skill_ids.includes(skillId)
        ? prev.skill_ids.filter(s => s !== skillId)
        : [...prev.skill_ids, skillId]
    }));
  };

  const handleCertificationToggle = (certId: string) => {
    setFormData(prev => ({
      ...prev,
      certification_ids: prev.certification_ids.includes(certId)
        ? prev.certification_ids.filter(c => c !== certId)
        : [...prev.certification_ids, certId]
    }));
  };

  const toggleDropdown = (technicianId: string) => {
    setState(prev => ({
      ...prev,
      activeDropdown: prev.activeDropdown === technicianId ? null : technicianId
    }));
  };

  const closeDropdown = () => {
    setState(prev => ({ ...prev, activeDropdown: null }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      closeDropdown();
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const getStatusBadge = (isAvailable: boolean) => {
    return isAvailable ? (
      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        Active
      </span>
    ) : (
      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
        Inactive
      </span>
    );
  };

  const getSkillBadges = (skills: any[]) => {
    if (!Array.isArray(skills)) return null;

    const displaySkills = skills.slice(0, 2);
    const remainingCount = skills.length - 2;

    return (
      <div className="flex flex-wrap gap-2">
        {displaySkills.map(skill => (
          <span key={skill.id || skill.name} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {skill.name || skill}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500">+{remainingCount} more</span>
        )}
      </div>
    );
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <i className="ri-user-add-line"></i>
          <span>Add Technician</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search technicians..."
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={state.statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="available">Active</option>
                <option value="unavailable">Inactive</option>
              </select>

              {/* Skills Filter */}
              <select
                value={state.skillsFilter}
                onChange={(e) => handleSkillsFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Skills</option>
                {state.availableSkills.map(skill => (
                  <option key={skill.id} value={skill.name}>{skill.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadTechnicians}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-refresh-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(state.technicians || []).map((technician) => (
                <tr key={technician.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(technician.user?.full_name || 'Unknown')}&background=2563eb&color=fff`}
                        alt=""
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {technician.user?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">ID: #{technician.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSkillBadges(technician.skills || [])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(technician.is_available)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{technician.user?.email}</div>
                    <div className="text-gray-500">{technician.user?.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openModal(technician)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        title="Edit technician"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => setState(prev => ({ ...prev, showDeleteModal: true, deletingTechnician: technician }))}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        title="Delete technician"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(technician.id);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="More actions"
                        >
                          <i className="ri-more-2-fill"></i>
                        </button>

                        {state.activeDropdown === technician.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAvailability(technician);
                                  closeDropdown();
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                                  technician.is_available
                                    ? 'text-orange-600 hover:text-orange-700'
                                    : 'text-green-600 hover:text-green-700'
                                }`}
                              >
                                <i className={technician.is_available ? 'ri-pause-circle-line' : 'ri-play-circle-line'}></i>
                                <span>{technician.is_available ? 'Deactivate' : 'Activate'}</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProfileModal(technician);
                                  closeDropdown();
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <i className="ri-user-line"></i>
                                <span>View Profile</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setState(prev => ({
                                    ...prev,
                                    showPasswordResetModal: true,
                                    resettingPasswordTechnician: technician
                                  }));
                                  closeDropdown();
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
                              >
                                <i className="ri-lock-password-line"></i>
                                <span>Reset Password</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setState(prev => ({
                                    ...prev,
                                    showSetPasswordModal: true,
                                    settingPasswordTechnician: technician
                                  }));
                                  closeDropdown();
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 hover:text-purple-700 flex items-center space-x-2"
                              >
                                <i className="ri-key-line"></i>
                                <span>Set New Password</span>
                              </button>

                              <div className="border-t border-gray-100 my-1"></div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setState(prev => ({ ...prev, showDeleteModal: true, deletingTechnician: technician }));
                                  closeDropdown();
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center space-x-2"
                              >
                                <i className="ri-delete-bin-line"></i>
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {state.technicians.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-user-settings-line text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No technicians found</h3>
            <p className="text-gray-500">Get started by adding your first technician.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {state.showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {state.editingTechnician ? 'Edit Technician' : 'Add New Technician'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.employee_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {!state.editingTechnician && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password *</label>
                      <input
                        type="password"
                        required={!state.editingTechnician}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Jobs Per Day</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.max_jobs_per_day}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_jobs_per_day: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_available}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Available for assignments</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills</label>
                  <div className="mt-1 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {state.availableSkills.map(skill => (
                      <label key={skill.id} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.skill_ids.includes(skill.id)}
                          onChange={() => handleSkillToggle(skill.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">{skill.name}</span>
                        {skill.category && (
                          <span className="ml-1 text-xs text-gray-500">({skill.category})</span>
                        )}
                      </label>
                    ))}
                  </div>
                  {state.availableSkills.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No skills available. Please add skills in Settings first.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Certifications</label>
                  <div className="mt-1 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {state.availableCertifications.map(cert => (
                      <label key={cert.id} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.certification_ids.includes(cert.id)}
                          onChange={() => handleCertificationToggle(cert.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">{cert.name}</span>
                        {cert.issuing_organization && (
                          <span className="ml-1 text-xs text-gray-500">({cert.issuing_organization})</span>
                        )}
                      </label>
                    ))}
                  </div>
                  {state.availableCertifications.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No certifications available. Please add certifications in Settings first.</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save Technician
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {state.showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Permanently Delete Technician</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to permanently delete {state.deletingTechnician?.user?.full_name}?
                </p>
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-800 font-medium">⚠️ Warning: This action cannot be undone!</p>
                  <ul className="text-xs text-red-700 mt-2 space-y-1">
                    <li>• Technician record will be permanently removed</li>
                    <li>• User account will be deleted</li>
                    <li>• Skills and certifications will be removed</li>
                    <li>• Job assignments will be unlinked</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, showDeleteModal: false, deletingTechnician: null }))}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Confirmation Modal */}
      {state.showPasswordResetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <i className="ri-lock-password-line text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Reset Password</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Send a password reset email to {state.resettingPasswordTechnician?.user?.full_name}?
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800 font-medium">📧 Email will be sent to:</p>
                  <p className="text-sm text-blue-700 mt-1 font-mono">
                    {state.resettingPasswordTechnician?.user?.email}
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1">
                    <li>• Technician will receive a secure reset link</li>
                    <li>• Link expires in 24 hours</li>
                    <li>• Current password remains valid until reset</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setState(prev => ({
                    ...prev,
                    showPasswordResetModal: false,
                    resettingPasswordTechnician: null
                  }))}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  Send Reset Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set New Password Modal */}
      {state.showSetPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                    <i className="ri-key-line text-purple-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 ml-3">Set New Password</h3>
                </div>
                <button
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      showSetPasswordModal: false,
                      settingPasswordTechnician: null
                    }));
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPassword(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Set a new password for {state.settingPasswordTechnician?.user?.full_name}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-gray-400 hover:text-gray-600`}></i>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-600 font-medium mb-2">Password Requirements:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains at least one number</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 px-7 pb-3">
                <button
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      showSetPasswordModal: false,
                      settingPasswordTechnician: null
                    }));
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPassword(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPassword}
                  disabled={!newPassword || !confirmPassword}
                  className="px-4 py-2 bg-purple-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Set Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {state.showProfileModal && state.viewingTechnician && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Technician Profile</h3>
                <button
                  onClick={closeProfileModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Header with photo and basic info */}
                <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-lg">
                  <img
                    className="h-20 w-20 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(state.viewingTechnician.user?.full_name || 'Unknown')}&background=2563eb&color=fff&size=80`}
                    alt=""
                  />
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900">
                      {state.viewingTechnician.user?.full_name || 'Unknown'}
                    </h4>
                    <p className="text-gray-600">Employee ID: #{state.viewingTechnician.employee_id}</p>
                    <div className="mt-2">
                      {getStatusBadge(state.viewingTechnician.is_available)}
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => {
                        if (state.viewingTechnician) {
                          openModal(state.viewingTechnician);
                          closeProfileModal();
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <i className="ri-edit-line"></i>
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <i className="ri-contacts-line mr-2 text-blue-600"></i>
                      Contact Information
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{state.viewingTechnician.user?.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{state.viewingTechnician.user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <i className="ri-briefcase-line mr-2 text-blue-600"></i>
                      Employment Details
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                        <p className="text-gray-900">
                          {state.viewingTechnician.hourly_rate ? `$${state.viewingTechnician.hourly_rate}/hour` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Max Jobs Per Day</label>
                        <p className="text-gray-900">{state.viewingTechnician.max_jobs_per_day || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <i className="ri-tools-line mr-2 text-blue-600"></i>
                    Skills & Expertise
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {state.viewingTechnician.skills && state.viewingTechnician.skills.length > 0 ? (
                      state.viewingTechnician.skills.map((skill: any, index: number) => (
                        <span key={skill.id || skill.name || index} className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                          {skill.name || skill}
                          {skill.proficiency_level && (
                            <span className="ml-1 text-xs">({skill.proficiency_level}/5)</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No skills listed</p>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <i className="ri-award-line mr-2 text-blue-600"></i>
                    Certifications
                  </h5>
                  <div className="space-y-2">
                    {state.viewingTechnician.certifications && state.viewingTechnician.certifications.length > 0 ? (
                      state.viewingTechnician.certifications.map((cert: any, index: number) => (
                        <div key={cert.id || cert.name || index} className="flex items-center space-x-2">
                          <i className={`ri-checkbox-circle-line ${cert.is_verified ? 'text-green-600' : 'text-gray-400'}`}></i>
                          <span className="text-gray-900">{cert.name || cert}</span>
                          {cert.expiration_date && (
                            <span className="text-xs text-gray-500">
                              (Expires: {new Date(cert.expiration_date).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No certifications listed</p>
                    )}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {(state.viewingTechnician as any).current_jobs || 0}
                    </div>
                    <div className="text-blue-100">Current Jobs</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {(state.viewingTechnician as any).avg_rating ?
                        parseFloat((state.viewingTechnician as any).avg_rating).toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-green-100">Avg Rating</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {new Date(state.viewingTechnician.created_at).getFullYear()}
                    </div>
                    <div className="text-purple-100">Joined</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      toggleAvailability(state.viewingTechnician!);
                      closeProfileModal();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      state.viewingTechnician.is_available
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <i className={state.viewingTechnician.is_available ? 'ri-pause-circle-line' : 'ri-play-circle-line'}></i>
                    <span>{state.viewingTechnician.is_available ? 'Deactivate' : 'Activate'}</span>
                  </button>
                  <button
                    onClick={closeProfileModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;
