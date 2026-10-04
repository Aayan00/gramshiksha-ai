import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { School, UserProfile, AuditEvent } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import {
  Building2,
  Users,
  ShieldCheck,
  History,
  Edit2,
  Plus,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react'

export const SchoolAdminPage: React.FC = () => {
  const { user, refreshProfile } = useAuth()
  const { success, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'audit'>('profile')
  const [school, setSchool] = useState<School | null>(null)
  const [usersList, setUsersList] = useState<UserProfile[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  // School Edit Form
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    udise_code: '',
    panchayat_name: '',
    district: '',
    state: '',
    contact_email: '',
    contact_phone: '',
    academic_year: '2024-2025',
  })

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    role: 'teacher',
    display_name: '',
    email: '',
    phone: '',
  })

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const [schoolData, usersData, auditData] = await Promise.all([
        api.getSchool(),
        api.listSchoolUsers(),
        api.listAuditLogs(),
      ])
      setSchool(schoolData)
      setUsersList(usersData)
      setAuditLogs(auditData)

      setSchoolForm({
        name: schoolData.name || '',
        udise_code: schoolData.udise_code || '',
        panchayat_name: schoolData.panchayat_name || '',
        district: schoolData.district || '',
        state: schoolData.state || '',
        contact_email: schoolData.contact_email || '',
        contact_phone: schoolData.contact_phone || '',
        academic_year: schoolData.academic_year || '2024-2025',
      })
    } catch (err: any) {
      toastError(err.message || 'Failed to load administration data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updated = await api.updateSchool(schoolForm)
      setSchool(updated)
      success('School profile updated successfully!')
      refreshProfile()
    } catch (err: any) {
      toastError(err.message || 'Failed to update school profile')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createSchoolUser(newUserForm)
      success(`Added user profile for ${newUserForm.display_name}!`)
      setIsAddUserOpen(false)
      loadAdminData()
    } catch (err: any) {
      toastError(err.message || 'Failed to add user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-2">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Restricted Administrator Area</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">School Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school identity, Gram Panchayat affiliation, user access, and inspect the real-time governance audit log.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            School Profile
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            Staff Accounts
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-600" />
            Audit Logs
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : activeTab === 'profile' ? (
        /* School Profile Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-3xl">
          <h2 className="text-base font-bold text-slate-900 mb-1">Official School Details</h2>
          <p className="text-xs text-slate-500 mb-6">
            Update national UDISE code, Gram Panchayat, and regional education cluster details.
          </p>

          <form onSubmit={handleUpdateSchool} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official School Name *</label>
              <input
                type="text"
                required
                value={schoolForm.name}
                onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">UDISE+ Code</label>
                <input
                  type="text"
                  value={schoolForm.udise_code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, udise_code: e.target.value })}
                  placeholder="e.g. 27251401201"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gram Panchayat Name</label>
                <input
                  type="text"
                  value={schoolForm.panchayat_name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, panchayat_name: e.target.value })}
                  placeholder="e.g. Shirur Gram Panchayat"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={schoolForm.district}
                  onChange={(e) => setSchoolForm({ ...schoolForm, district: e.target.value })}
                  placeholder="Pune"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={schoolForm.state}
                  onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={schoolForm.academic_year}
                  onChange={(e) => setSchoolForm({ ...schoolForm, academic_year: e.target.value })}
                  placeholder="2024-2025"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={schoolForm.contact_email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, contact_email: e.target.value })}
                  placeholder="zp.school@gramshiksha.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Phone</label>
                <input
                  type="text"
                  value={schoolForm.contact_phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, contact_phone: e.target.value })}
                  placeholder="+91 2138 222100"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save School Changes</span>
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'users' ? (
        /* Staff & Roles Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Provisioned Staff Profiles</h2>
              <p className="text-xs text-slate-500">Authorized personnel who have authenticated access to this school.</p>
            </div>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.display_name}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          u.role === 'school_admin'
                            ? 'purple'
                            : u.role === 'teacher'
                            ? 'green'
                            : 'blue'
                        }
                      >
                        {u.role === 'school_admin'
                          ? 'Headmaster'
                          : u.role === 'teacher'
                          ? 'Teacher'
                          : 'Staff'}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-600">{u.email || '-'}</td>
                    <td className="p-3 font-mono text-slate-600">{u.phone || '-'}</td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-600">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Trail Log Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Governance & Audit Trail</h2>
              <p className="text-xs text-slate-500">Immutable ledger of administrative actions, approvals, and updates.</p>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
              No audit events logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((ev) => (
                <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px]">
                        {ev.action}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="font-semibold text-slate-800">
                        {ev.entity_type} {ev.entity_id ? `(${ev.entity_id.substring(0, 8)}...)` : ''}
                      </span>
                    </div>
                    {ev.details && Object.keys(ev.details).length > 0 && (
                      <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200">
                        {JSON.stringify(ev.details)}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
                    <div>{new Date(ev.created_at).toLocaleTimeString()}</div>
                    <div>{new Date(ev.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Staff Account Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add Staff Profile"
        subtitle="Provision access for a teacher or administrative staff member."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role *</label>
            <select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="teacher">Teacher (शिक्षक)</option>
              <option value="school_admin">Headmaster / Administrator</option>
              <option value="staff">Panchayat Education Officer / Staff</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newUserForm.display_name}
              onChange={(e) => setNewUserForm({ ...newUserForm, display_name: e.target.value })}
              placeholder="e.g. Smt. Vandana Shirole"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="vandana@school.org"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                placeholder="+91 98220 12345"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
