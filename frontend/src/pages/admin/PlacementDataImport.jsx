import React, { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/common/Header';
import BottomNav from '../../components/common/BottomNav';
import ToastNotification from '../../components/ui/ToastNotification';

const PlacementDataImport = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importData, setImportData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      if (!isExcel) {
        showToast('Please select an Excel file (.xlsx or .xls)', 'error');
        return;
      }
      setFile(selectedFile);
      setImportData(null);
      setPreview(null);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast('Please select a file first', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/placement-import/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setImportData(response.data.data);
        showToast('File validated successfully!', 'success');
      } else {
        showToast(response.data.message || 'Upload failed', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Upload failed', 'error');
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPreview(response.data.data);
        showToast('Preview loaded', 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Preview failed', 'error');
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setImportResult(response.data.data);
        showToast('Import completed successfully!', 'success');

        // Clear form after successful import
        setTimeout(() => {
          setFile(null);
          setImportData(null);
          setPreview(null);
        }, 3000);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Import failed', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/placement-import/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Placement_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Template downloaded', 'success');
    } catch (error) {
      showToast('Failed to download template', 'error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportData(null);
    setPreview(null);
    setImportResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Past Placement Data</h1>
          <p className="text-gray-600">Upload an Excel file with past placement data to update student records.</p>
        </div>

        {/* Download Template */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">First time importing?</h3>
              <p className="text-sm text-blue-800 mb-3">Download the template to ensure your data is in the correct format.</p>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </button>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Step 1: Upload Excel File</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
              className="mt-4 w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload and Validate
                </>
              )}
            </button>
          )}
        </div>

        {/* Validation Summary */}
        {importData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Step 2: Review Validation Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importData.summary.total}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importData.summary.valid}</div>
                <div className="text-sm text-gray-600">Valid Rows</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importData.summary.invalid}</div>
                <div className="text-sm text-gray-600">Invalid Rows</div>
              </div>
            </div>

            {/* Errors */}
            {importData.errors && importData.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-red-600 mb-2">Validation Errors</h3>
                <div className="max-h-60 overflow-y-auto border border-red-200 rounded-lg">
                  {importData.errors.map((error, idx) => (
                    <div key={idx} className="p-3 border-b border-red-100 last:border-0">
                      <div className="text-sm">
                        <span className="font-medium">Row {error.row}:</span>
                        <span className="text-red-600 ml-2">{error.error}</span>
                        {error.rollNo && error.rollNo !== 'N/A' && (
                          <span className="text-gray-500 ml-2">(Roll No: {error.rollNo})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Data */}
            {importData.preview && importData.preview.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Preview (First 20 rows)</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">College</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Branch</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">CTC</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importData.preview.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{row.rollNo}</td>
                          <td className="px-4 py-2 text-sm">{row.name}</td>
                          <td className="px-4 py-2 text-sm">{row.college}</td>
                          <td className="px-4 py-2 text-sm">{row.branch}</td>
                          <td className="px-4 py-2 text-sm">{row.company}</td>
                          <td className="px-4 py-2 text-sm">{row.ctc} LPA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={handlePreview}
              className="w-full mb-3 flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              View Detailed Preview
            </button>

            {importData.summary.valid > 0 && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm and Import {importData.summary.valid} Records
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full mt-3 flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel / Start Over
            </button>
          </div>
        )}

        {/* Preview Details */}
        {preview && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Detailed Preview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{preview.summary.toCreate}</div>
                <div className="text-sm text-gray-600">New Students to Create</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{preview.summary.toUpdate}</div>
                <div className="text-sm text-gray-600">Existing Students to Update</div>
              </div>
            </div>

            {preview.toCreate && preview.toCreate.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-blue-600 mb-2">New Students (First 20)</h3>
                <div className="overflow-x-auto border border-blue-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Package</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.toCreate.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{row.rollNo}</td>
                          <td className="px-4 py-2 text-sm">{row.name}</td>
                          <td className="px-4 py-2 text-sm">{row.company}</td>
                          <td className="px-4 py-2 text-sm">{row.package} LPA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {preview.toUpdate && preview.toUpdate.length > 0 && (
              <div>
                <h3 className="font-semibold text-orange-600 mb-2">Students to Update (First 20)</h3>
                <div className="overflow-x-auto border border-orange-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Current Company</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">New Company</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.toUpdate.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{row.rollNo}</td>
                          <td className="px-4 py-2 text-sm">{row.name}</td>
                          <td className="px-4 py-2 text-sm">{row.currentData.company}</td>
                          <td className="px-4 py-2 text-sm font-medium text-orange-600">{row.newData.company}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-green-900">Import Completed Successfully!</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">{importResult.created}</div>
                <div className="text-sm text-gray-600">Students Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{importResult.updated}</div>
                <div className="text-sm text-gray-600">Students Updated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{importResult.total}</div>
                <div className="text-sm text-gray-600">Total Imported</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default PlacementDataImport;
