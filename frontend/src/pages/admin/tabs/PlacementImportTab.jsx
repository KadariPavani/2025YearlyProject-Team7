import React, { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import axios from 'axios';

const PlacementImportTab = ({ showToast }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importData, setImportData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const toast = (message, type = 'info') => {
    if (showToast) showToast(type, message);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      if (!isExcel) {
        toast('Please select an Excel file (.xlsx or .xls)', 'error');
        return;
      }
      setFile(selectedFile);
      setImportData(null);
      setPreview(null);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) { toast('Please select a file first', 'error'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/placement-import/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setImportData(response.data.data);
        toast('File validated successfully!', 'success');
      } else {
        toast(response.data.message || 'Upload failed', 'error');
      }
    } catch (error) {
      toast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async () => {
    if (!importData?.importId) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/placement-import/${importData.importId}/preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPreview(response.data.data);
        toast('Preview loaded', 'success');
      }
    } catch (error) {
      toast(error.response?.data?.message || 'Preview failed', 'error');
    }
  };

  const handleConfirm = async () => {
    if (!importData?.importId) return;
    setConfirming(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/placement-import/${importData.importId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setImportResult(response.data.data);
        toast('Import completed successfully!', 'success');
        setTimeout(() => { setFile(null); setImportData(null); setPreview(null); }, 3000);
      }
    } catch (error) {
      toast(error.response?.data?.message || 'Import failed', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/placement-import/template`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Placement_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast('Template downloaded', 'success');
    } catch {
      toast('Failed to download template', 'error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportData(null);
    setPreview(null);
    setImportResult(null);
  };

  const handleDeleteAllPastStudents = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/placement-import/past-students`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast(response.data.message, 'success');
      } else {
        toast(response.data.message || 'Delete failed', 'error');
      }
    } catch (error) {
      toast(error.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Import Past Placement Data</h3>
          <p className="text-sm text-gray-500 mt-0.5">Upload an Excel file with past placement data to update student records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete All Past Students</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Template</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Delete All Past Students?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">This will permanently:</p>
            <ul className="text-sm text-gray-500 list-disc list-inside mb-4 space-y-1">
              <li>Delete all students imported via the past placement Excel</li>
              <li>Clear placement records from existing active students</li>
              <li>Wipe import history so the same file can be re-uploaded</li>
            </ul>
            <p className="text-sm font-semibold text-red-600 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllPastStudents}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Download the template first to ensure your data is in the correct format before uploading.
        </p>
      </div>

      {/* Step 1 – Upload */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Step 1: Upload Excel File</h4>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" id="tab-file-upload" />
          <label
            htmlFor="tab-file-upload"
            className="cursor-pointer inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            Choose File
          </label>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {file && !importData && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Validating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload and Validate
              </>
            )}
          </button>
        )}
      </div>

      {/* Step 2 – Validation results */}
      {importData && (
        <div className="border border-gray-200 rounded-lg p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Step 2: Review Validation Results</h4>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{importData.summary.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total Rows</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{importData.summary.valid}</div>
              <div className="text-xs text-gray-500 mt-1">Valid Rows</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{importData.summary.invalid}</div>
              <div className="text-xs text-gray-500 mt-1">Invalid Rows</div>
            </div>
          </div>

          {importData.errors?.length > 0 && (
            <div className="mb-5">
              <h5 className="text-sm font-semibold text-red-600 mb-2">Validation Errors</h5>
              <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg divide-y divide-red-100">
                {importData.errors.map((error, idx) => (
                  <div key={idx} className="px-3 py-2 text-sm">
                    <span className="font-medium">Row {error.row}:</span>
                    <span className="text-red-600 ml-2">{error.error}</span>
                    {error.rollNo && error.rollNo !== 'N/A' && (
                      <span className="text-gray-400 ml-2">(Roll No: {error.rollNo})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {importData.preview?.length > 0 && (
            <div className="mb-5">
              <h5 className="text-sm font-semibold text-gray-600 mb-2">Preview (First 20 rows)</h5>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Roll No', 'Name', 'College', 'Branch', 'Company', 'CTC'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importData.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{row.rollNo}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.college}</td>
                        <td className="px-3 py-2">{row.branch}</td>
                        <td className="px-3 py-2">{row.company}</td>
                        <td className="px-3 py-2">{row.ctc} LPA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handlePreview}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              View Detailed Preview
            </button>

            {importData.summary.valid > 0 && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm and Import {importData.summary.valid} Records
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Cancel / Start Over
            </button>
          </div>
        </div>
      )}

      {/* Detailed preview */}
      {preview && (
        <div className="border border-gray-200 rounded-lg p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Detailed Preview</h4>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{preview.summary.toCreate}</div>
              <div className="text-xs text-gray-500 mt-1">New Students to Create</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{preview.summary.toUpdate}</div>
              <div className="text-xs text-gray-500 mt-1">Existing Students to Update</div>
            </div>
          </div>

          {preview.toCreate?.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-blue-600 mb-2">New Students (First 20)</h5>
              <div className="overflow-x-auto border border-blue-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      {['Roll No', 'Name', 'Company', 'Package'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.toCreate.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{row.rollNo}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.company}</td>
                        <td className="px-3 py-2">{row.package} LPA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.toUpdate?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-orange-600 mb-2">Students to Update (First 20)</h5>
              <div className="overflow-x-auto border border-orange-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-orange-50">
                    <tr>
                      {['Roll No', 'Name', 'Current Company', 'New Company'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.toUpdate.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{row.rollNo}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.currentData.company}</td>
                        <td className="px-3 py-2 font-medium text-orange-600">{row.newData.company}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="text-sm font-semibold text-green-900">Import Completed Successfully!</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{importResult.created}</div>
              <div className="text-xs text-gray-500 mt-1">Students Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{importResult.updated}</div>
              <div className="text-xs text-gray-500 mt-1">Students Updated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{importResult.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total Imported</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementImportTab;
