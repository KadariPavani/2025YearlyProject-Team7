import React, { useState, useEffect, useRef, useMemo } from 'react';

function AddEditStudentForm({ batches = [], initial = {}, onSubmit, onClose }) {
  const initialIdRef = useRef(initial?._id);

  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    rollNo: initial.rollNo || '',
    branch: initial.branch || '',
    college: initial.college || '',
    phonenumber: initial.phonenumber || '',
    batchId: initial.batchId || ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const newInitialId = initial?._id;
    if (newInitialId !== initialIdRef.current) {
      setForm({
        name: initial.name || '',
        email: initial.email || '',
        rollNo: initial.rollNo || '',
        branch: initial.branch || '',
        college: initial.college || '',
        phonenumber: initial.phonenumber || '',
        batchId: initial.batchId || ''
      });
      initialIdRef.current = newInitialId;
    }
  }, [initial]);

  const collegeOptions = useMemo(() => {
    const cols = new Set();
    batches.forEach(b => (b.colleges || []).forEach(c => cols.add(c)));
    return Array.from(cols);
  }, [batches]);

  const [availableColleges, setAvailableColleges] = useState(collegeOptions);

  useEffect(() => {
    setAvailableColleges(collegeOptions);
  }, [collegeOptions]);

  const branches = ['AID','CSM','CAI','CSD','CSC'];

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleBatchChange = (batchId) => {
    handleChange('batchId', batchId);
    const batch = batches.find(b => String(b._id) === String(batchId));
    if (batch && batch.colleges && batch.colleges.length > 0) {
      setAvailableColleges(batch.colleges);
      if (form.college && !batch.colleges.includes(form.college)) {
        handleChange('college', '');
      }
    } else {
      setAvailableColleges(collegeOptions);
    }
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!form.name || !form.email || !form.rollNo || !form.branch || !form.college || !form.phonenumber || !form.batchId) {
      alert('Please fill all required fields: name, email, roll number, branch, college, phone number, and batch');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (form.batchId) {
      const batch = batches.find(b => String(b._id) === String(form.batchId));
      if (batch && batch.colleges && batch.colleges.length > 0) {
        if (!form.college || !batch.colleges.includes(form.college)) {
          alert('Selected college does not belong to the chosen batch. Please select the correct college.');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await onSubmit(form);
      setSubmitting(false);
      if (res && res.success) {
        onClose && onClose();
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch (err) {
      setSubmitting(false);
      alert(err.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Name" className="w-full px-3 py-2 border rounded" />
        <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded" />
        <input value={form.rollNo} onChange={(e) => handleChange('rollNo', e.target.value)} placeholder="Roll No" className="w-full px-3 py-2 border rounded" />
        <select value={form.branch} onChange={(e) => handleChange('branch', e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="">Select Branch</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input value={form.phonenumber} onChange={(e) => handleChange('phonenumber', e.target.value)} placeholder="Phone" className="w-full px-3 py-2 border rounded" />
        <select value={form.college} onChange={(e) => handleChange('college', e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="">Select College</option>
          {availableColleges.length === 0 ? (
            <option value="" disabled>No colleges available (select a batch first)</option>
          ) : (
            availableColleges.map(c => <option key={c} value={c}>{c}</option>)
          )}
        </select>

        <select value={form.batchId} onChange={(e) => handleBatchChange(e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="">Select Batch</option>
          {batches.map(batch => (
            <option key={batch._id} value={batch._id}>{batch.batchNumber} {batch.colleges ? `(${batch.colleges.join(',')})` : ''}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => onClose && onClose()} className="px-3 py-1.5 border rounded">Cancel</button>
        <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-blue-600 text-white rounded">{submitting ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default AddEditStudentForm;
