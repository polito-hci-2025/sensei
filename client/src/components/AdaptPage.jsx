import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import '../styles/AdaptPage.css';

function AdaptPage() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Confirmation dialogs state
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    dsa: [],
    subject: '',
    grade: ''
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');
    setUploadedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      file: file
    });

    // Create preview URL for PDF
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const handleCheckboxChange = (value) => {
    setFormData(prev => ({
      ...prev,
      dsa: prev.dsa.includes(value)
        ? prev.dsa.filter(item => item !== value)
        : [...prev.dsa, value]
    }));
  };

  const hasUnsavedChanges = () => {
    return uploadedFile || formData.dsa.length > 0 || formData.subject || formData.grade;
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setIsBackConfirmOpen(true);
    } else {
      navigate('/');
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setIsCancelConfirmOpen(true);
    } else {
      navigate('/');
    }
  };

  const isFormValid = () => {
    return (
      uploadedFile &&
      formData.dsa.length > 0 &&
      formData.subject !== '' &&
      formData.grade !== ''
    );
  };

  const handleGenerate = async () => {
    if (!isFormValid()) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 Starting PDF adaptation...');
      
      const formDataToSend = new FormData();
      formDataToSend.append('file', uploadedFile.file);
      formDataToSend.append('dsa', JSON.stringify(formData.dsa));
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('grade', formData.grade);

      console.log('📤 Sending request to backend...');

      const response = await fetch('http://localhost:3001/api/adapt/generate', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate adapted PDF');
      }

      console.log('✅ Received response from backend');

      const blob = await response.blob();
      const adaptedPdfUrl = URL.createObjectURL(blob);

      console.log('📄 PDF generated successfully');

      // Salva il PDF adattato in sessionStorage
      sessionStorage.setItem('adaptedPdfUrl', adaptedPdfUrl);
      sessionStorage.setItem('adaptedPdfData', JSON.stringify({
        originalFileName: uploadedFile.name,
        dsa: formData.dsa,
        subject: formData.subject,
        grade: formData.grade,
        timestamp: new Date().toISOString()
      }));

      // Navigate to existing PreviewPage
      navigate('/adapted/preview/new');
      
    } catch (err) {
      console.error('❌ Error generating PDF:', err);
      setError(err.message || 'Failed to generate adapted material. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adapt-container">
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={isBackConfirmOpen}
        title="Leave page?"
        message="You have unsaved changes. Are you sure you want to go back? All progress will be lost."
        confirmText="Go back"
        cancelText="Stay"
        onCancel={() => setIsBackConfirmOpen(false)}
        onConfirm={() => {
          setIsBackConfirmOpen(false);
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
          navigate('/');
        }}
      />
      
      <ConfirmDialog
        open={isCancelConfirmOpen}
        title="Cancel adaptation?"
        message="You have unsaved changes. Are you sure you want to cancel? All progress will be lost."
        confirmText="Yes, cancel"
        cancelText="No, continue"
        onCancel={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          setIsCancelConfirmOpen(false);
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
          navigate('/');
        }}
      />

      {/* Main Content Area */}
      <div className="adapt-main">
        <div className="adapt-upload-section">
          <div className="adapt-header-section">
            <button 
              className="adapt-back-button" 
              onClick={handleBack}
              disabled={loading}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h2>Upload Your Material</h2>
          </div>
          
          {error && (
            <div className="adapt-error-message">
              {error}
            </div>
          )}
          
          {!uploadedFile ? (
            <div
              className={`adapt-upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="adapt-upload-icon" size={48} />
              <p className="adapt-upload-text">
                Drag & drop your PDF file here
              </p>
              <p className="adapt-upload-subtext">or</p>
              <label className="adapt-browse-button">
                Browse File
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
              </label>
              <p className="adapt-file-info-text">Only PDF files are accepted</p>
            </div>
          ) : (
            <div className="adapt-preview-area">
              <div className="adapt-preview-header">
                <div className="adapt-file-icon">
                  <FileText size={24} />
                </div>
                <div className="adapt-file-info">
                  <p className="adapt-file-name">{uploadedFile.name}</p>
                  <p className="adapt-file-size">{uploadedFile.size}</p>
                </div>
                <button 
                  className="adapt-remove-file" 
                  onClick={removeFile}
                  disabled={loading}
                  aria-label="Remove file"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="adapt-preview-content">
                <object
                  data={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  type="application/pdf"
                  className="adapt-pdf-preview"
                >
                  <p>Your browser doesn't support PDF preview.</p>
                </object>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="adapt-sidebar">
        <div className="adapt-sidebar-content">
          <div className="adapt-form-group">
            <label>
              DSA Type <span className="adapt-required">*</span>
            </label>
            <div className="adapt-checkbox-grid">
              {['Dyslexia', 'Dysgraphia', 'Dyscalculia', 'Dysorthography'].map(item => (
                <label key={item} className="adapt-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.dsa.includes(item)}
                    onChange={() => handleCheckboxChange(item)}
                    disabled={loading}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="adapt-form-row">
            <div className="adapt-form-group">
              <label>
                Subject <span className="adapt-required">*</span>
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                disabled={loading}
              >
                <option value="">Select...</option>
                <option value="History">History</option>
                <option value="Science">Science</option>
                <option value="Math">Math</option>
                <option value="Literature">Literature</option>
              </select>
            </div>

            <div className="adapt-form-group">
              <label>
                Grade/Class <span className="adapt-required">*</span>
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                disabled={loading}
              >
                <option value="">Select...</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>
        </div>

        <div className="adapt-action-buttons">
          <button 
            className="adapt-button secondary" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="adapt-button primary"
            onClick={handleGenerate}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="adapt-spinner" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdaptPage;