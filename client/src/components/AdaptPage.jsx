import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, ArrowLeft } from 'lucide-react';
import '../styles/AdaptPage.css';

function AdaptPage() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

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

  const isFormValid = () => {
    return (
      uploadedFile &&
      formData.dsa.length > 0 &&
      formData.subject !== '' &&
      formData.grade !== ''
    );
  };

  const handleGenerate = () => {
    if (!isFormValid()) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    console.log('Generate with data:', formData);
    console.log('File:', uploadedFile);
    // Navigate to preview or next step
  };

  return (
    <div className="adapt-container">
      {/* Main Content Area */}
      <div className="adapt-main">
        <div className="adapt-upload-section">
          <div className="adapt-header-section">
            <button className="adapt-back-button" onClick={() => navigate('/')}>
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
                <button className="adapt-remove-file" onClick={removeFile}>
                  <X size={20} />
                </button>
              </div>
              <div className="adapt-preview-content">
                <object
                  data={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  type="application/pdf"
                  className="adapt-pdf-preview"
                >
                  <p>Your browser doesn't support PDF preview. Please download the file to view it.</p>
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
                required
              >
                <option value="">Select...</option>
                <option value="history">History</option>
                <option value="science">Science</option>
                <option value="math">Math</option>
                <option value="literature">Literature</option>
              </select>
            </div>

            <div className="adapt-form-group">
              <label>
                Grade/Class <span className="adapt-required">*</span>
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                required
              >
                <option value="">Select...</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
              </select>
            </div>
          </div>
        </div>

        <div className="adapt-action-buttons">
          <button className="adapt-button secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button 
            className="adapt-button primary"
            onClick={handleGenerate}
            disabled={!isFormValid()}
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdaptPage;