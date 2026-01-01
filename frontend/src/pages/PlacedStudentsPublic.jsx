import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PlacedStudentsPublic() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/public/placed-students?limit=1000');
        if (mounted) {
          if (res.data && res.data.success) {
            setStudents(res.data.data.students || []);
          } else {
            setError(res.data?.message || 'Failed to fetch');
          }
        }
      } catch (err) {
        console.error('Error fetching all placed students:', err);
        if (mounted) setError('Error fetching data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  // derive filter lists
  const batches = Array.from(new Set(students.map(s => s.batchName || 'Unknown Batch'))).sort();
  const companies = Array.from(new Set(students.map(s => s.companyName || 'Unknown Company'))).sort();

  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const filtered = students.filter(s => {
    const matchesSearch = search.trim() === '' || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.rollNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === 'all' || (s.batchName || 'Unknown Batch') === batchFilter;
    const matchesCompany = companyFilter === 'all' || (s.companyName || 'Unknown Company') === companyFilter;
    return matchesSearch && matchesBatch && matchesCompany;
  });

  // group by batch
  const grouped = filtered.reduce((acc, s) => {
    const b = s.batchName || 'Unknown Batch';
    acc[b] = acc[b] || [];
    acc[b].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">All Placed Students</h1>
          <a href="/" className="text-sm text-blue-600 hover:underline">Back to Home</a>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll" className="px-3 py-2 border rounded" />
          <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="px-3 py-2 border rounded">
            <option value="all">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-3 py-2 border rounded">
            <option value="all">All Companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-8 text-center">Loading…</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : students.length === 0 ? (
          <div className="py-8 text-center text-gray-600">No placed students found</div>
        ) : (
          Object.keys(grouped).sort().map(batchName => (
            <div key={batchName} className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Batch: {batchName} ({grouped[batchName].length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {grouped[batchName].map((s, idx) => (
                  <div key={`${s.studentId || idx}-${idx}`} className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center">
                    <img src={s.profileImageUrl || 'https://ui-avatars.com/api/?background=1e40af&color=fff&name=' + encodeURIComponent(s.name)} alt={s.name} className="w-24 h-24 rounded-full object-cover mb-3" />
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-gray-600">{s.companyName}</div>
                    <div className="text-xs text-gray-500 mt-1">Roll: {s.rollNumber}</div>
                    <div className="text-xs text-gray-500 mt-1">Hometown: {s.hometown || 'NA'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
