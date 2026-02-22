import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Download, TrendingUp, Building2, DollarSign, Users, Award, Search, ChevronDown, ChevronUp,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

/* ─── Public header ───────────────────────────────────── */
function PublicHeader({ totalCount }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img src="/IFlogo.png" alt="InfoVerse" className="h-10 w-10 object-contain" />
          </div>
          <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </header>
  );
}

/* ─── Main ────────────────────────────────────────────── */
export default function PlacedStudentsPublic() {
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [statistics, setStatistics] = useState({ companyWise: [], packageWise: [] });
  const [statsLoading, setStatsLoading] = useState(false);
  const [showStats, setShowStats]   = useState(true);
  const [search, setSearch]         = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [yearFilter, setYearFilter]       = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [typeFilter, setTypeFilter]       = useState('all');

  // table UI state
  const [sortBy, setSortBy] = useState('package'); // default: sort by package desc
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedRows, setExpandedRows] = useState({});

  const fetchRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (fetchRef.current) fetchRef.current.abort();
      const controller = new AbortController();
      fetchRef.current = controller;
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/public/placed-students`, {
          params: { limit: 1000 },
          signal: controller.signal,
          withCredentials: true,
        });
        if (res.data?.success) setStudents(res.data.data.students || []);
        else setError(res.data?.message || 'Failed to fetch');
      } catch (err) {
        if (err?.code === 'ERR_CANCELED') return;
        setError(`Error: ${err?.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
        if (fetchRef.current === controller) fetchRef.current = null;
      }
    };

    const fetchStatistics = async () => {
      try {
        setStatsLoading(true);
        const res = await axios.get(`${API_BASE}/api/public/placed-students-statistics`, { withCredentials: true });
        if (res.data?.success) setStatistics(res.data.data);
      } catch { /* silent */ }
      finally { setStatsLoading(false); }
    };

    fetchAll();
    fetchStatistics();
    return () => { if (fetchRef.current) fetchRef.current.abort(); };
  }, []);

  const handleDownload = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/public/download-placements-excel`, {
        responseType: 'blob', withCredentials: true,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'All_Placements.xlsx');
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { alert('Failed to download Excel file'); }
  };

  /* derived */
  const companies = Array.from(new Set(students.map(s => s.companyName || 'Unknown'))).sort();
  const years     = Array.from(new Set(students.map(s => s.yearOfPassing).filter(Boolean))).sort((a, b) => b - a);

  const filtered = students.filter(s => {
    const q = search.trim().toLowerCase();
    const matchSearch  = !q || s.name?.toLowerCase().includes(q) || (s.rollNo || '').toLowerCase().includes(q);
    const matchCompany = companyFilter === 'all' || (s.companyName || 'Unknown') === companyFilter;
    const matchYear    = yearFilter === 'all' || s.yearOfPassing == yearFilter;
    const matchType    = typeFilter === 'all' || (s.type || 'PLACEMENT') === typeFilter;
    let   matchPkg     = true;
    if (packageFilter !== 'all' && s.package) {
      const p = parseFloat(s.package);
      if      (packageFilter === '0-3')   matchPkg = p >= 0  && p < 3;
      else if (packageFilter === '3-5')   matchPkg = p >= 3  && p < 5;
      else if (packageFilter === '5-10')  matchPkg = p >= 5  && p < 10;
      else if (packageFilter === '10-20') matchPkg = p >= 10 && p < 20;
      else if (packageFilter === '20+')   matchPkg = p >= 20;
    }
    return matchSearch && matchCompany && matchYear && matchPkg && matchType;
  });

  /* table view uses `filtered` (no year grouping) */

  // Avg/Highest Package computed from PLACEMENT-type only
  const placementStudents = students.filter(s => (s.type || 'PLACEMENT') === 'PLACEMENT');
  const withPkg    = placementStudents.filter(s => s.package);
  const avgPkg     = withPkg.length > 0
    ? (withPkg.reduce((sum, s) => sum + (parseFloat(s.package) || 0), 0) / withPkg.length).toFixed(1)
    : '0';
  const maxPkg     = placementStudents.length > 0
    ? Math.max(...placementStudents.map(s => parseFloat(s.package) || 0)).toFixed(1)
    : '0';

  // table helpers & derived data (sorting + pagination)
  const toggleRow = id => setExpandedRows(p => ({ ...p, [id]: !p[id] }));

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') return dir * String(a.name || '').localeCompare(String(b.name || ''));
    if (sortBy === 'roll') return dir * String(a.rollNo || '').localeCompare(String(b.rollNo || ''));
    if (sortBy === 'branch') return dir * String(a.branch || '').localeCompare(String(b.branch || ''));
    if (sortBy === 'company') {
      const ca = (a.companyName || (a.allOffers && a.allOffers[0]?.company) || '').toString();
      const cb = (b.companyName || (b.allOffers && b.allOffers[0]?.company) || '').toString();
      return dir * ca.localeCompare(cb);
    }
    if (sortBy === 'year') return dir * ((Number(a.yearOfPassing) || 0) - (Number(b.yearOfPassing) || 0));
    if (sortBy === 'package') return dir * ((parseFloat(a.package) || 0) - (parseFloat(b.package) || 0));
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
  const paginated = sortedFiltered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, companyFilter, yearFilter, packageFilter, typeFilter, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  return (
    <>
      <PublicHeader totalCount={students.length} />

      <div className="min-h-screen bg-gray-50 pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Page title ── */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Placed Students</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Sorted by highest package within each batch year</p>
            </div>
            <button
              onClick={handleDownload}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Download Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>

          {/* ── Statistics ── */}
          {!statsLoading && (statistics.companyWise.length > 0 || statistics.packageWise.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Placement Statistics
                </h2>
                <button
                  onClick={() => setShowStats(v => !v)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showStats ? 'Hide' : 'Show'}
                </button>
              </div>

              {showStats && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { icon: Users,     label: 'Total Placements', value: students.length,   bg: 'bg-blue-50',   text: 'text-blue-600',   icon2: 'text-blue-500' },
                      { icon: Building2, label: 'Companies',         value: companies.length,  bg: 'bg-green-50',  text: 'text-green-600',  icon2: 'text-green-500' },
                      { icon: DollarSign,label: 'Avg Package',       value: `${avgPkg} LPA`,  bg: 'bg-purple-50', text: 'text-purple-600', icon2: 'text-purple-500' },
                      { icon: Award,     label: 'Highest Package',   value: `${maxPkg} LPA`,  bg: 'bg-orange-50', text: 'text-orange-600', icon2: 'text-orange-500' },
                    ].map(({ icon: Icon, label, value, bg, text, icon2 }) => (
                      <div key={label} className={`${bg} rounded-lg p-3 sm:p-4`}>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${icon2}`} />
                          <span className="text-[10px] sm:text-sm text-gray-500 leading-tight">{label}</span>
                        </div>
                        <div className={`text-lg sm:text-2xl font-bold ${text}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Charts (desktop) + compact tables (mobile) */}
                  {/* Desktop: charts visible at md+ */}
                  <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {statistics.companyWise.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-gray-700 mb-3">Top Companies</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={statistics.companyWise}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="company" angle={-30} textAnchor="end" height={72} fontSize={12} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {statistics.packageWise.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-gray-700 mb-3">Package Distribution</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={statistics.packageWise} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="range" type="category" width={80} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Mobile: compact tabular summaries */}
                  <div className="md:hidden grid grid-cols-1 gap-4">
                    {statistics.companyWise.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-700">Top Companies</h3>
                          <span className="text-xs text-gray-400">Top {Math.min(6, statistics.companyWise.length)}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <tbody>
                              {statistics.companyWise.slice(0, 6).map((c, i) => (
                                <tr key={c.company} className="border-t last:border-b">
                                  <td className="py-2 text-gray-700">{i + 1}. {c.company}</td>
                                  <td className="py-2 text-right font-semibold text-gray-900 w-20">{c.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {statistics.packageWise.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-700">Package Distribution</h3>
                          <span className="text-xs text-gray-400">Summary</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <tbody>
                              {statistics.packageWise.map((p, idx) => (
                                <tr key={p.range || idx} className="border-t last:border-b">
                                  <td className="py-2 text-gray-700">{p.range}</td>
                                  <td className="py-2 text-right font-semibold text-gray-900 w-20">{p.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Filters ── */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or roll"
                className="w-full pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select value={yearFilter}    onChange={e => setYearFilter(e.target.value)}    className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="all">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="all">All Companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="all">All Types</option>
              <option value="PLACEMENT">Placement</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="TRAINING">Training</option>
            </select>
            <select value={packageFilter} onChange={e => setPackageFilter(e.target.value)} className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="all">All Packages</option>
              <option value="0-3">0 – 3 LPA</option>
              <option value="3-5">3 – 5 LPA</option>
              <option value="5-10">5 – 10 LPA</option>
              <option value="10-20">10 – 20 LPA</option>
              <option value="20+">20+ LPA</option>
            </select>
          </div>

          {/* result count */}
          <p className="text-sm text-gray-500 mb-6">
            Showing <span className="font-medium text-gray-700">{filtered.length}</span> of{' '}
            <span className="font-medium text-gray-700">{students.length}</span> placements
          </p>

          {/* ── States ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
              <p className="text-sm text-gray-500">Loading placements…</p>
            </div>
          )}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600 text-sm max-w-md mx-auto">{error}</div>
          )}
          {!loading && !error && students.length === 0 && (
            <div className="bg-gray-100 rounded-lg p-10 text-center text-gray-500 text-sm">No placed students found.</div>
          )}
          {!loading && !error && students.length > 0 && filtered.length === 0 && (
            <div className="bg-gray-100 rounded-lg p-10 text-center text-gray-500 text-sm">No students match your filters.</div>
          )}

          {/* ── Table view (desktop) + responsive cards (mobile) ── */}
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{filtered.length === 0 ? 0 : Math.min((page - 1) * pageSize + 1, filtered.length)}</span>
                  {' – '}
                  <span className="font-medium text-gray-900">{Math.min(page * pageSize, filtered.length)}</span>
                  {' of '}
                  <span className="font-medium text-gray-900">{filtered.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-gray-500 hidden sm:inline">Rows</label>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-1.5 sm:px-2 py-1 border rounded text-xs sm:text-sm bg-white">
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Desktop table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Student</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Roll</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Branch</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Year</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('package')}>
                        Compensation {sortBy === 'package' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Offers</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-gray-500">No students to display.</td>
                      </tr>
                    )}

                    {paginated.map((s, idx) => {
                      const offers = s.allOffers && s.allOffers.length > 0 ? [...s.allOffers].sort((a, b) => (parseFloat(b.package) || 0) - (parseFloat(a.package) || 0)) : null;
                      const primary = offers ? offers[0] : { company: s.companyName || '—', package: s.package };
                      const id = s.studentId || s._id || `${s.rollNo || s.name}-${idx}`;
                      const isExpanded = !!expandedRows[id];
                      const sType = s.type || 'PLACEMENT';
                      const typeBadgeStyle = { PLACEMENT: 'bg-green-100 text-green-700', INTERNSHIP: 'bg-blue-100 text-blue-700', TRAINING: 'bg-orange-100 text-orange-700' };
                      const compText = sType === 'PLACEMENT'
                        ? `${parseFloat(s.package || 0).toFixed(1)} LPA`
                        : `${s.stipend || 0} K/month`;

                      return (
                        <React.Fragment key={id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img src={s.profileImageUrl || `https://ui-avatars.com/api/?background=dbeafe&color=1d4ed8&name=${encodeURIComponent(s.name)}&bold=true&size=64`} alt={s.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100" />
                                <div>
                                  <div className="font-medium text-gray-900">{s.name}</div>
                                  <div className="text-xs text-gray-400">{s.email || ''}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{s.rollNo || '—'}</td>
                            <td className="px-4 py-3 text-gray-700">{s.branch || '—'}</td>
                            <td className="px-4 py-3 text-gray-700">{s.yearOfPassing || '—'}</td>
                            <td className="px-4 py-3 text-gray-700">{primary.company}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadgeStyle[sType] || typeBadgeStyle.PLACEMENT}`}>{sType}</span>
                            </td>
                            <td className="px-4 py-3 text-blue-600 font-semibold">{compText}</td>
                            <td className="px-4 py-3">
                              {offers && offers.length > 1 ? (
                                <button onClick={() => toggleRow(id)} className="text-xs text-blue-600 hover:underline flex items-center gap-2">
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  {offers.length} offers
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500">1</span>
                              )}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="px-4 py-3 bg-gray-50">
                                <div className="flex flex-wrap gap-3">
                                  {offers.map((o, i) => {
                                    const oType = o.type || 'PLACEMENT';
                                    const oComp = oType === 'PLACEMENT'
                                      ? `${parseFloat(o.package || 0).toFixed(1)} LPA`
                                      : `${o.stipend || 0} K/month`;
                                    return (
                                      <div key={i} className="px-3 py-2 bg-white border rounded shadow-sm text-xs flex items-center gap-3">
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${typeBadgeStyle[oType] || typeBadgeStyle.PLACEMENT}`}>{oType}</span>
                                        <div className="text-sm font-medium text-gray-700">{o.company}</div>
                                        <div className="text-xs text-blue-600 font-semibold">{oComp}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards (sm and below) */}
              <div className="md:hidden">
                <div className="space-y-3">
                  {paginated.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-500">No students to display.</div>
                  )}

                  {paginated.map((s, idx) => {
                    const offers = s.allOffers && s.allOffers.length > 0 ? [...s.allOffers].sort((a, b) => (parseFloat(b.package) || 0) - (parseFloat(a.package) || 0)) : null;
                    const primary = offers ? offers[0] : { company: s.companyName || '—', package: s.package };
                    const id = s.studentId || s._id || `${s.rollNo || s.name}-${idx}`;
                    const isExpanded = !!expandedRows[id];
                    const sType = s.type || 'PLACEMENT';
                    const typeBadgeStyle = { PLACEMENT: 'bg-green-100 text-green-700', INTERNSHIP: 'bg-blue-100 text-blue-700', TRAINING: 'bg-orange-100 text-orange-700' };
                    const compText = sType === 'PLACEMENT'
                      ? `${parseFloat(s.package || 0).toFixed(1)} LPA`
                      : `${s.stipend || 0} K/month`;

                    return (
                      <div key={id} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
                        {/* Row 1: avatar + name + package */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={s.profileImageUrl || `https://ui-avatars.com/api/?background=dbeafe&color=1d4ed8&name=${encodeURIComponent(s.name)}&bold=true&size=64`}
                            alt={s.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 break-words">{s.name}</p>
                              <span className="text-sm font-bold text-[#5791ED] shrink-0">{compText}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-[10px] text-gray-400 truncate">{[s.rollNo, s.branch].filter(Boolean).join(' · ') || '—'}</p>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${typeBadgeStyle[sType] || typeBadgeStyle.PLACEMENT}`}>{sType}</span>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: company + year + offers toggle */}
                        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between gap-2 min-w-0">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{primary.company}</p>
                            <p className="text-[10px] text-gray-400">{s.yearOfPassing || '—'}</p>
                          </div>
                          {offers && offers.length > 1 ? (
                            <button
                              onClick={() => toggleRow(id)}
                              className="shrink-0 flex items-center gap-1 text-[10px] text-[#5791ED] font-medium"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {offers.length} offers
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 shrink-0">1 offer</span>
                          )}
                        </div>

                        {/* Expanded offers */}
                        {isExpanded && offers && (
                          <div className="mt-2 space-y-1.5">
                            {offers.map((o, i) => {
                              const oType = o.type || 'PLACEMENT';
                              const oComp = oType === 'PLACEMENT'
                                ? `${parseFloat(o.package || 0).toFixed(1)} LPA`
                                : `${o.stipend || 0} K/month`;
                              return (
                                <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-lg min-w-0 gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${typeBadgeStyle[oType] || typeBadgeStyle.PLACEMENT}`}>{oType}</span>
                                    <p className="text-xs text-gray-700 truncate">{o.company}</p>
                                  </div>
                                  <p className="text-xs font-semibold text-[#5791ED] shrink-0">{oComp}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination (shared) */}
              <div className="flex items-center justify-between mt-4 gap-2">
                <div className="text-xs sm:text-sm text-gray-500">Page <span className="font-medium text-gray-900">{page}</span> / <span className="font-medium text-gray-900">{totalPages}</span></div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2.5 sm:px-3 py-1 bg-white border rounded text-xs sm:text-sm disabled:opacity-50">Prev</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2.5 sm:px-3 py-1 bg-white border rounded text-xs sm:text-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
