import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Lock, Save, Plus, Pencil, X, Check,
  GraduationCap, Building2, LogOut, AlertCircle, CheckCircle,
  IndianRupee, Eye, EyeOff, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('pastStudentToken')}`
});

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('pastStudentToken')}`
});

// ── reusable labeled input ────────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', placeholder, readOnly, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all
        ${readOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed text-gray-400' : 'bg-white border-gray-200'}`}
    />
  </div>
);

// ── tab button ────────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all
      ${active ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'}`}
  >
    <Icon className="h-4 w-4" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// ── placement offer card ──────────────────────────────────────────────────────
const OfferCard = ({ offer, onEdit, isHighest }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all
    ${isHighest ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
    <div className="flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isHighest ? 'bg-purple-100' : 'bg-gray-100'}`}>
        <Building2 className={`h-5 w-5 ${isHighest ? 'text-purple-600' : 'text-gray-500'}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{offer.company}</p>
        <p className="text-xs text-gray-500">{offer.role || '—'}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className={`text-sm font-bold flex items-center gap-0.5 ${isHighest ? 'text-purple-600' : 'text-green-600'}`}>
        <IndianRupee className="h-3.5 w-3.5" />{offer.package} LPA
      </span>
      {isHighest && (
        <span className="text-[10px] font-semibold bg-purple-600 text-white px-2 py-0.5 rounded-full">Best</span>
      )}
      <button
        onClick={() => onEdit(offer)}
        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  </div>
);

// ── inline placement form ─────────────────────────────────────────────────────
const PlacementForm = ({ initial = {}, onSave, onCancel, title }) => {
  const [form, setForm] = useState({ company: '', role: '', package: '', ...initial });
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3 mt-2">
      <p className="text-sm font-semibold text-purple-700">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Company" value={form.company} onChange={set('company')} placeholder="e.g. Google" required />
        <Field label="Role" value={form.role} onChange={set('role')} placeholder="e.g. Software Engineer" />
        <Field label="Package (LPA)" type="number" value={form.package} onChange={set('package')} placeholder="e.g. 12.5" required />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Check className="h-3.5 w-3.5" /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:text-gray-800 text-sm px-4 py-2 rounded-lg transition-all"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const PastStudentPortal = () => {
  const navigate      = useNavigate();
  const fileInputRef  = useRef(null);

  const [tab, setTab]                 = useState('profile');
  const [profile, setProfile]         = useState(null);
  const [placement, setPlacement]     = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // placement state
  const [showAddOffer, setShowAddOffer]     = useState(false);
  const [editingOffer, setEditingOffer]     = useState(null);
  const [editPrimary, setEditPrimary]       = useState(false);

  // password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw]     = useState({ current: false, next: false, confirm: false });

  // notification
  const [toast2, setToast2] = useState({ show: false, msg: '', type: 'success' });
  const notify = (msg, type = 'success') => {
    setToast2({ show: true, msg, type });
    setTimeout(() => setToast2(p => ({ ...p, show: false })), 3000);
  };

  // ── auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem('pastStudentToken')) {
      navigate('/past-student-login');
      return;
    }
    fetchProfile();
    fetchPlacement();
  }, []);

  const logout = () => {
    localStorage.removeItem('pastStudentToken');
    localStorage.removeItem('pastStudentData');
    navigate('/past-student-login');
  };

  // ── fetchers ────────────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    const res  = await fetch(`${API}/api/past-student/profile`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      setProfile(data.data);
      setProfileForm({
        name:            data.data.name || '',
        phonenumber:     data.data.phonenumber || '',
        email:           data.data.email?.includes('imported.placeholder') ? '' : (data.data.email || ''),
        bio:             data.data.bio || '',
        gender:          data.data.gender || '',
        currentLocation: data.data.currentLocation || '',
        hometown:        data.data.hometown || ''
      });
    } else {
      navigate('/past-student-login');
    }
  };

  const fetchPlacement = async () => {
    const res  = await fetch(`${API}/api/past-student/placement`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setPlacement(data.data);
  };

  // ── profile image upload ────────────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify('File size must be less than 5 MB', 'error'); return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      notify('Please upload a JPEG or PNG image', 'error'); return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);
    setUploadingImage(true);

    try {
      const res  = await fetch(`${API}/api/past-student/profile-image`, {
        method:  'POST',
        headers: authHeaders(),   // no Content-Type — let browser set multipart boundary
        body:    formData
      });
      const data = await res.json();
      if (data.success) {
        setProfile(p => ({ ...p, profileImageUrl: data.data }));
        notify('Profile photo updated!');
      } else {
        notify(data.message || 'Upload failed', 'error');
      }
    } catch {
      notify('Connection error', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // ── save profile ────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const res  = await fetch(`${API}/api/past-student/profile`, {
        method:  'PUT',
        headers: jsonHeaders(),
        body:    JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        notify('Profile updated successfully!');
      } else {
        notify(data.message || 'Update failed', 'error');
      }
    } catch {
      notify('Connection error', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── save placement ──────────────────────────────────────────────────────────
  const savePlacement = async (form, addNew = false, offerId = null) => {
    try {
      const res  = await fetch(`${API}/api/past-student/placement`, {
        method:  'PUT',
        headers: jsonHeaders(),
        body:    JSON.stringify({ ...form, addNew, offerId })
      });
      const data = await res.json();
      if (data.success) {
        setPlacement(p => ({ ...p, ...data.data }));
        notify('Placement updated!');
        setShowAddOffer(false);
        setEditingOffer(null);
        setEditPrimary(false);
      } else {
        notify(data.message || 'Failed', 'error');
      }
    } catch {
      notify('Connection error', 'error');
    }
  };

  // ── change password ─────────────────────────────────────────────────────────
  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { notify('Passwords do not match', 'error'); return; }
    if (pwForm.next.length < 6)         { notify('Min 6 characters', 'error'); return; }
    setPwSaving(true);
    try {
      const res  = await fetch(`${API}/api/past-student/change-password`, {
        method:  'PUT',
        headers: jsonHeaders(),
        body:    JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next })
      });
      const data = await res.json();
      if (data.success) {
        notify('Password changed!');
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        notify(data.message || 'Failed', 'error');
      }
    } catch {
      notify('Connection error', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const pfp = profile.profileImageUrl;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── top toast ── */}
      {toast2.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast2.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast2.type === 'success'
            ? <CheckCircle className="h-4 w-4" />
            : <AlertCircle className="h-4 w-4" />
          }
          {toast2.msg}
        </div>
      )}

      {/* ── header ── */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/IFlogo.png" alt="Infoverse" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-sm font-bold text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-400">{profile.rollNo} · {profile.college} · {profile.branch}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── tab bar ── */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200 w-fit">
          <Tab active={tab === 'profile'}   onClick={() => setTab('profile')}   icon={User}     label="My Profile" />
          <Tab active={tab === 'placement'} onClick={() => setTab('placement')} icon={Briefcase} label="My Placement" />
          <Tab active={tab === 'password'}  onClick={() => setTab('password')}  icon={Lock}     label="Change Password" />
        </div>

        {/* ════════════════════════════════════════ PROFILE TAB ══ */}
        {tab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Profile photo card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center self-start">
              {/* Avatar with pencil overlay */}
              <div className="relative w-28 h-28 mx-auto mb-4 group">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 shadow-inner">
                  {pfp
                    ? <img src={pfp} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <User className="h-14 w-14 text-purple-600" />
                  }
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-1 right-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                  title="Upload photo"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-1">{profile.name}</h2>
              <p className="text-sm text-gray-500 mb-1">{profile.rollNo}</p>
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                {profile.college} · {profile.branch}
              </span>
              <p className="text-xs text-gray-400 mt-2">Passing Year: {profile.yearOfPassing}</p>

              <p className="text-xs text-gray-400 mt-4">
                Click the <strong className="text-gray-600">pencil icon</strong> to upload a photo.<br />
                Max 5 MB · JPG / PNG
              </p>
            </div>

            {/* Edit fields card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:col-span-2 space-y-5">
              <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name"    value={profileForm.name}        onChange={v => setProfileForm(p => ({ ...p, name: v }))}        placeholder="Your full name" />
                <Field label="Phone Number" value={profileForm.phonenumber}  onChange={v => setProfileForm(p => ({ ...p, phonenumber: v }))}  placeholder="10-digit number" />
                <Field label="Email Address" type="email" value={profileForm.email} onChange={v => setProfileForm(p => ({ ...p, email: v }))} placeholder="your@email.com" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={profileForm.gender || ''}
                    onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Field label="Current Location" value={profileForm.currentLocation} onChange={v => setProfileForm(p => ({ ...p, currentLocation: v }))} placeholder="City, State" />
                <Field label="Hometown"          value={profileForm.hometown}        onChange={v => setProfileForm(p => ({ ...p, hometown: v }))}        placeholder="City, State" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profileForm.bio || ''}
                  onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  placeholder="Short description about yourself..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                />
                <p className="text-xs text-gray-400 text-right">{(profileForm.bio || '').length}/500</p>
              </div>

              {/* Read-only academic fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                <Field label="College"         value={profile.college}       readOnly />
                <Field label="Branch"          value={profile.branch}        readOnly />
                <Field label="Year of Passing" value={profile.yearOfPassing} readOnly />
              </div>

              <button
                onClick={saveProfile}
                disabled={profileSaving}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                {profileSaving
                  ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-purple-200 border-t-white" />
                  : <Save className="h-4 w-4" />
                }
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ PLACEMENT TAB ══ */}
        {tab === 'placement' && (
          <div className="space-y-4">

            {/* Primary placement */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Current Placement</h3>
                {placement?.placementDetails?.company && !editPrimary && (
                  <button
                    onClick={() => { setEditPrimary(true); setShowAddOffer(false); setEditingOffer(null); }}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 border border-gray-200 hover:border-purple-300 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
              </div>

              {placement?.placementDetails?.company ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{placement.placementDetails.company}</p>
                      <p className="text-sm text-gray-500">{placement.placementDetails.role || '—'}</p>
                      <p className="text-base font-semibold text-purple-600 mt-1 flex items-center gap-0.5">
                        <IndianRupee className="h-4 w-4" />{placement.placementDetails.package} LPA
                      </p>
                    </div>
                  </div>
                  {editPrimary && (
                    <PlacementForm
                      title="Edit Primary Placement"
                      initial={{ company: placement.placementDetails.company, role: placement.placementDetails.role, package: placement.placementDetails.package }}
                      onSave={form => savePlacement(form, false, null)}
                      onCancel={() => setEditPrimary(false)}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No placement recorded yet.</p>
                  {!showAddOffer && (
                    <button
                      onClick={() => setShowAddOffer(true)}
                      className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add your first placement
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* All offers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">All Company Offers</h3>
                <button
                  onClick={() => { setShowAddOffer(true); setEditingOffer(null); setEditPrimary(false); }}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Offer
                </button>
              </div>

              {showAddOffer && (
                <PlacementForm
                  title="Add New Offer"
                  onSave={form => savePlacement(form, true, null)}
                  onCancel={() => setShowAddOffer(false)}
                />
              )}

              <div className="space-y-2 mt-2">
                {placement?.allOffers?.length > 0 ? (
                  placement.allOffers.map((offer, i) => {
                    const isHighest = offer.package === placement.placementDetails?.package &&
                                      offer.company === placement.placementDetails?.company;
                    return (
                      <div key={offer._id || i}>
                        <OfferCard
                          offer={offer}
                          isHighest={isHighest}
                          onEdit={o => { setEditingOffer(o); setShowAddOffer(false); setEditPrimary(false); }}
                        />
                        {editingOffer?._id && editingOffer._id === offer._id && (
                          <PlacementForm
                            title="Edit Offer"
                            initial={editingOffer}
                            onSave={form => savePlacement(form, false, editingOffer._id)}
                            onCancel={() => setEditingOffer(null)}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No offers recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ PASSWORD TAB ══ */}
        {tab === 'password' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Change Password</h3>

            {[
              { label: 'Current Password', key: 'current' },
              { label: 'New Password',     key: 'next' },
              { label: 'Confirm New Password', key: 'confirm' }
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={label}
                    className="w-full px-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={changePassword}
              disabled={pwSaving}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              {pwSaving
                ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-purple-200 border-t-white" />
                : <Lock className="h-4 w-4" />
              }
              {pwSaving ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastStudentPortal;
