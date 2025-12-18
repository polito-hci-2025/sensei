import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import '../styles/PreviewPage.css';
import API from '../API/API.mjs';

const PreviewPage = () => {
  const { type, id } = useParams(); 
  console.log(type, id);
  const navigate = useNavigate();
  
  const [fileData, setFileData] = useState({
    NamePDF: '',
    Subject: '',
    Grade: '',
    Tag: '',
    Description: '',
    Shared: false
  });

  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    // Qui caricherai i dati dal backend
    fetchFileData();
  }, [id, type]);

  const fetchFileData = async () => {
    try {

        let data = null;
        if(type=== 'shared'){
            data = await API.getSharedWorkById(id);
            setIsShared(type === 'shared');
        }else {
            data = await API.getMyWorkById(id);
        }
        setFileData(data);

    } catch (error) {
        console.error('Error fetching file data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (!isShared) {
      setFileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
        await API.updateInfo(id, fileData.NamePDF, fileData.Description, fileData.Subject, fileData.Grade, fileData.Shared);
        alert('Modifiche salvate con successo!');
        navigate('/');
    } catch (error) {
        console.error('Error saving data:', error);
    }
  };

  const handleDownload = async () => {
    try{
        await API.download(id);
        alert('Download completed!');
    } catch (error) {
        console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Sei sicuro di voler eliminare questo file?')) {
      try {
        await API.deleteMyWork(id);
        navigate('/');
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const renderContent = () => {
    if (type === 'created') {
      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{fileData.name}</h3>
            <div className="preview-placeholder-content">
              <p>1. ___ ___ ___</p>
              <div className="preview-checkbox-group">
                <label><input type="checkbox" disabled /> ___</label>
                <label><input type="checkbox" disabled /> ___</label>
              </div>
              <div className="preview-checkbox-group">
                <label><input type="checkbox" disabled /> ___</label>
                <label><input type="checkbox" disabled /> ___</label>
              </div>
              <p>2. ___ ___ ___</p>
              <div className="preview-checkbox-row">
                <label><input type="checkbox" disabled /> T</label>
                <label><input type="checkbox" disabled /> F</label>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === 'adapted') {
      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{fileData.NamePDF.split(' - ')[0]}</h3>
            <div className="preview-placeholder-lines">
              <div className="preview-line"></div>
              <div className="preview-line"></div>
              <div className="preview-line"></div>
              <div className="preview-line"></div>
              <div className="preview-line"></div>
            </div>
          </div>
        </div>
      );
    } else {
      // shared
      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{fileData.NamePDF}</h3>
            <div className="preview-placeholder-lines">
              <div className="preview-line"></div>
              <div className="preview-line"></div>
              <div className="preview-line"></div>
              <div className="preview-line"></div>
              <div className="preview-line"></div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderInfoPanel = () => {
    if (isShared) {
      return (
        <div className="preview-info-panel">
          <h2>Document Info</h2>
          
          <div className="preview-info-group">
            <label>Document Name:</label>
            <div className="preview-info-value">{fileData.NamePDF}</div>
          </div>

          <div className="preview-info-group">
            <label>Adapted for:</label>
            <div className="preview-info-value">{fileData.Tag}</div>
          </div>

          <div className="preview-info-row">
            <div className="preview-info-group preview-half">
              <label>Subject:</label>
              <div className="preview-info-value">{fileData.Subject}</div>
            </div>
            <div className="preview-info-group preview-half">
              <label>Class:</label>
              <div className="preview-info-value">{fileData.Grade}</div>
            </div>
          </div>

          <div className="preview-info-group">
            <label>Description:</label>
            <div className="preview-info-value preview-description">{fileData.Description}</div>
          </div>

          <div className="preview-info-group">
            <div className="preview-info-value preview-author">{fileData.Prof}</div>
          </div>

          <div className="preview-action-buttons">
            <button className="preview-button download" onClick={handleDownload}>
              Download
            </button>
          </div>
        </div>
      );
    } else if (type === 'adapted') {
      return (
        <div className="preview-info-panel">
          <h2>Document Info</h2>
          
          <div className="preview-info-group">
            <label>Document Name:</label>
            <input
              type="text"
              className="preview-input"
              value={fileData.NamePDF}
              onChange={(e) => handleInputChange('NamePDF', e.target.value)}
            />
          </div>

          <div className="preview-info-group">
            <label>Adapted for:</label>
            <input
              type="text"
              className="preview-input"
              value={fileData.Tag}
              onChange={(e) => handleInputChange('Tag', e.target.value)}
            />
          </div>

          <div className="preview-info-group">
            <label>Description (optional):</label>
            <textarea
              className="preview-textarea"
              value={fileData.Description}
              onChange={(e) => handleInputChange('Description', e.target.value)}
            />
          </div>

            <div className="preview-info-row">
                <div className="preview-info-group preview-half">
                    <label>Subject:</label>
                    <select
                    className="preview-select"
                    value={fileData.Subject}
                    onChange={(e) => handleInputChange('Subject', e.target.value)}
                    >
                    <option value="History">History</option>
                    <option value="Math">Math</option>
                    <option value="Science">Science</option>
                    <option value="Literature">Literature</option>
                    </select>
                </div>
                <div className="preview-info-group preview-half">
                    <label>Grade:</label>
                    <select
                    className="preview-select"
                        value={fileData.Grade}
                        onChange={(e) => handleInputChange('Grade', e.target.value)}
                    >
                        <option value="1°">1°</option>
                        <option value="2°">2°</option>
                        <option value="3°">3°</option>
                        <option value="4°">4°</option>
                        <option value="5°">5°</option>
                    </select>
                </div>
            </div>

          <div className="preview-checkbox-option">
            <input
              type="checkbox"
              id="shareCheckbox"
              checked={fileData.Shared}
              onChange={(e) => handleInputChange('Shared', e.target.checked)}
            />
            <label htmlFor="shareCheckbox">Share with community on save</label>
          </div>

          <div className="preview-action-buttons">
            <button className="preview-button download" onClick={handleDownload}>
              Download
            </button>
            <button className="preview-button save" onClick={handleSave}>
              Save
            </button>
            <button className="preview-button delete" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      );
    } else {
      // created
      return (
        <div className="preview-info-panel">
          <h2>Assignment Info</h2>
          
          <div className="preview-info-group">
            <label>Assignment Name:</label>
            <input
              type="text"
              className="preview-input"
              value={fileData.NamePDF}
              onChange={(e) => handleInputChange('NamePDF', e.target.value)}
            />
          </div>

          <div className="preview-info-group">
            <label>Adapted for:</label>
            <input
              type="text"
              className="preview-input"
              value={fileData.Tag}
              onChange={(e) => handleInputChange('Tag', e.target.value)}
            />
          </div>

          <div className="preview-info-row">
            <div className="preview-info-group preview-half">
              <label>Subject:</label>
              <select
                className="preview-select"
                value={fileData.Subject}
                onChange={(e) => handleInputChange('Subject', e.target.value)}
              >
                <option value="History">History</option>
                <option value="Math">Math</option>
                <option value="Science">Science</option>
                <option value="Literature">Literature</option>
              </select>
            </div>
            <div className="preview-info-group preview-half">
              <label>Grade:</label>
              <select
                className="preview-select"
                value={fileData.Grade}
                onChange={(e) => handleInputChange('Grade', e.target.value)}
              >
                <option value="1°">1°</option>
                <option value="2°">2°</option>
                <option value="3°">3°</option>
                <option value="4°">4°</option>
                <option value="5°">5°</option>
              </select>
            </div>
          </div>

          <div className="preview-info-group">
            <label>Description (optional):</label>
            <textarea
              className="preview-textarea"
              value={fileData.Description}
              onChange={(e) => handleInputChange('Description', e.target.value)}
            />
          </div>

          <div className="preview-checkbox-option">
            <input
              type="checkbox"
              id="shareCheckbox"
              checked={fileData.Shared}
              onChange={(e) => handleInputChange('Shared', e.target.checked)}
            />
            <label htmlFor="shareCheckbox">Share with community</label>
          </div>

          <div className="preview-action-buttons">
            <button className="preview-button download" onClick={handleDownload}>
              Download
            </button>
            <button className="preview-button save" onClick={handleSave}>
              Save
            </button>
            <button className="preview-button delete" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="preview-container">
      <header className="preview-header">
        <div className="preview-header-left">
        </div>
        <div className="preview-header-right">
        </div>
      </header>


        <div className="preview-main-wrapper">
            <div className="preview-main">
                {renderContent()}
                {renderInfoPanel()}
            </div>
        </div>
    </div>
  );
};

export default PreviewPage;