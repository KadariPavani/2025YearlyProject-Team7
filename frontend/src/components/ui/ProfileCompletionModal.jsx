import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  GraduationCap, CheckCircle, ArrowRight, X, Layers,
  AlertTriangle, Clock, Loader2, User
} from 'lucide-react';
import api from '../../services/api';

const TEMP_DISMISS_KEY = 'profileModal_tempDismiss';

const ProfileCompletionModal = ({ studentData, show, pendingApprovals, placementBatchInfo }) => {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [crtOptions, setCrtOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [crtInterest, setCrtInterest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const user = useMemo(() => studentData?.user || studentData || {}, [studentData]);

  // Already assigned to a placement batch — no modal needed
  const hasBatch = !!user.placementTrainingBatchId ||
                   !!user.crtBatchName ||
                   !!(placementBatchInfo?.placementBatch);

  // Pending CRT approval
  const pendingCrtRequests = useMemo(() =>
    (pendingApprovals?.pending || []).filter(r => r.requestType === 'crt_status_change'),
    [pendingApprovals]
  );
  const hasPendingCrt = pendingCrtRequests.length > 0;

  // Determine modal mode: 'none' | 'pending' | 'select'
  const mode = hasBatch ? 'none' : hasPendingCrt ? 'pending' : 'select';

  const fetchCrtOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const res = await api.get('/api/student/available-crt-options');
      if (res.data.success) {
        setCrtOptions(res.data.data.availableOptions || []);
      }
    } catch (err) {
      console.error('Failed to fetch CRT options:', err);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // Show/hide logic
  useEffect(() => {
    if (!show || mode === 'none') {
      setVisible(false);
      setAnimateIn(false);
      return;
    }

    const tempDismiss = sessionStorage.getItem(TEMP_DISMISS_KEY);
    if (tempDismiss) {
      const elapsed = Date.now() - Number(tempDismiss);
      const cooldown = mode === 'pending' ? 300000 : 30000;
      if (elapsed < cooldown) {
        const timer = setTimeout(() => {
          sessionStorage.removeItem(TEMP_DISMISS_KEY);
          setVisible(true);
          requestAnimationFrame(() => setAnimateIn(true));
        }, cooldown - elapsed);
        return () => clearTimeout(timer);
      }
      sessionStorage.removeItem(TEMP_DISMISS_KEY);
    }

    const showTimer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setAnimateIn(true));
      if (mode === 'select') fetchCrtOptions();
    }, 5000);

    return () => clearTimeout(showTimer);
  }, [show, mode]);

  // Pre-fill from student data
  useEffect(() => {
    if (!user) return;
    if (user.crtInterested === true) {
      setCrtInterest(true);
      setSelectedBatch(user.crtBatchChoice || '');
    } else if (user.crtInterested === false) {
      setCrtInterest(false);
    }
  }, [user]);

  const dismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(TEMP_DISMISS_KEY, String(Date.now()));
    }, 300);
  }, []);

  const handleSaveBatch = async () => {
    if (crtInterest === null) return;
    if (crtInterest === true && !selectedBatch) return;
    setSaving(true);
    try {
      await api.put('/api/student/profile', {
        crtInterested: crtInterest,
        crtBatchChoice: crtInterest ? selectedBatch : '',
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setAnimateIn(false);
        setTimeout(() => setVisible(false), 300);
      }, 1200);
    } catch (err) {
      console.error('Failed to save batch:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  const canDismiss = mode === 'pending' || crtInterest === false;
  const isPending = mode === 'pending';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-400 ease-out ${
        animateIn ? 'bg-black/50 backdrop-blur-[6px]' : 'bg-transparent pointer-events-none'
      }`}
      onClick={canDismiss ? dismiss : undefined}
    >
      <div
        className={`relative w-full sm:max-w-[420px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-400 ease-out transform ${
          animateIn
            ? 'opacity-100 translate-y-0 sm:scale-100'
            : 'opacity-0 translate-y-full sm:translate-y-6 sm:scale-95'
        } max-h-[85vh] sm:max-h-[80vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className={`relative px-4 sm:px-5 pt-5 sm:pt-6 pb-5 sm:pb-6 flex-shrink-0 ${
          isPending
            ? 'bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500'
            : 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600'
        }`}>
          {canDismiss && (
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-white/50 hover:text-white hover:bg-white/10 transition-all rounded-full p-1.5"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 sm:p-2.5 ${
              isPending ? 'bg-white/20' : 'bg-white/15'
            } backdrop-blur-sm`}>
              {isPending ? (
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              ) : (
                <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {isPending ? 'Request Pending Approval' : 'Select Your Training Batch'}
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 leading-snug ${
                isPending ? 'text-amber-100' : 'text-blue-100'
              }`}>
                {isPending
                  ? 'Your CRT preference is awaiting TPO review'
                  : 'Choose your placement training preference'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="px-4 sm:px-5 py-4 sm:py-5">

            {/* ===== PENDING STATE ===== */}
            {isPending && (
              <>
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="relative mb-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-50 flex items-center justify-center ring-4 ring-amber-100">
                      <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-amber-500" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-white">
                      <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white animate-spin" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-[260px] leading-relaxed">
                    Your CRT preference has been submitted and is pending review by the TPO.
                  </p>
                </div>

                {pendingCrtRequests.map((req, i) => (
                  <div key={i} className="p-3 sm:p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl mb-3">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wider">
                        Pending Request
                      </span>
                    </div>

                    {req.requestedChanges && (
                      <div className="space-y-1.5">
                        {req.requestedChanges.crtInterested !== undefined && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-500">CRT Interest</span>
                            <span className="font-medium text-amber-700">
                              {req.requestedChanges.crtInterested ? 'Yes (CRT)' : 'No (Non-CRT)'}
                            </span>
                          </div>
                        )}
                        {req.requestedChanges.crtBatchChoice && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-500">Training Track</span>
                            <span className="font-medium text-amber-700">
                              {req.requestedChanges.crtBatchChoice}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {req.requestedAt && (
                      <p className="text-[10px] sm:text-xs text-amber-500 mt-2.5 pt-2.5 border-t border-amber-200/60">
                        Submitted {new Date(req.requestedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                ))}

                <button
                  onClick={dismiss}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold py-2.5 sm:py-3 px-5 rounded-xl transition-colors text-sm sm:text-base"
                >
                  Got it
                </button>

                <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2.5">
                  You'll be notified once your request is approved
                </p>
              </>
            )}

            {/* ===== BATCH SELECTION ===== */}
            {!isPending && (
              <>
                <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-amber-50 border border-amber-200/80 rounded-xl mb-4">
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-xs text-amber-700 leading-relaxed">
                    You must select a training preference to continue using the dashboard.
                  </p>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2.5">
                  Are you interested in CRT (Campus Recruitment Training)?
                </p>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                  {/* CRT option */}
                  <button
                    onClick={() => {
                      setCrtInterest(true);
                      setSelectedBatch('');
                      if (crtOptions.length === 0) fetchCrtOptions();
                    }}
                    className={`relative flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                      crtInterest === true
                        ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    {crtInterest === true && (
                      <CheckCircle className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                    )}
                    <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${
                      crtInterest === true ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <GraduationCap className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        crtInterest === true ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-xs sm:text-sm ${
                        crtInterest === true ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Yes, CRT
                      </p>
                      <p className="text-[9px] sm:text-[11px] text-gray-400 mt-0.5">Placement training</p>
                    </div>
                  </button>

                  {/* Non-CRT option */}
                  <button
                    onClick={() => {
                      setCrtInterest(false);
                      setSelectedBatch('');
                    }}
                    className={`relative flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                      crtInterest === false
                        ? 'border-amber-500 bg-amber-50 shadow-sm shadow-amber-200'
                        : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    {crtInterest === false && (
                      <CheckCircle className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                    )}
                    <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${
                      crtInterest === false ? 'bg-amber-100' : 'bg-gray-100'
                    }`}>
                      <User className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        crtInterest === false ? 'text-amber-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-xs sm:text-sm ${
                        crtInterest === false ? 'text-amber-700' : 'text-gray-700'
                      }`}>
                        No, Non-CRT
                      </p>
                      <p className="text-[9px] sm:text-[11px] text-gray-400 mt-0.5">Skip training</p>
                    </div>
                  </button>
                </div>

                {/* Training track options */}
                {crtInterest === true && (
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Select Training Track <span className="text-red-500">*</span>
                    </label>

                    {loadingOptions ? (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        <span className="text-xs sm:text-sm text-gray-500">Loading options...</span>
                      </div>
                    ) : crtOptions.filter(o => o !== 'NonCRT').length === 0 ? (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs sm:text-sm text-gray-500">No training tracks available yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 sm:space-y-2">
                        {crtOptions.filter(o => o !== 'NonCRT').map(option => (
                          <button
                            key={option}
                            onClick={() => setSelectedBatch(option)}
                            className={`flex items-center gap-2.5 sm:gap-3 w-full p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                              selectedBatch === option
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                            }`}
                          >
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selectedBatch === option ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                              {selectedBatch === option && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span className={`text-xs sm:text-sm font-medium ${
                              selectedBatch === option ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {option}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handleSaveBatch}
                  disabled={crtInterest === null || (crtInterest === true && !selectedBatch) || saving}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 sm:py-3 px-5 rounded-xl transition-all duration-200 text-sm sm:text-base ${
                    saveSuccess
                      ? 'bg-green-500 text-white'
                      : crtInterest === null || (crtInterest === true && !selectedBatch) || saving
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-600/20'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      Saved!
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2.5">
                  Changes to CRT preference require TPO approval
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
