import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog.jsx';
import '../styles/PreviewPage.css';
import API from '../API/API.mjs';

const PreviewPage = ({ type: typeProp } = {}) => {
  const { type: typeParam, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const type = typeProp ?? typeParam;

  const draftWork = location.state?.work ?? null;
  const isDraftCreatedPreview = type === 'created' && (id === undefined || id === null) && !!draftWork;
  
  const [fileData, setFileData] = useState({
    title: '',
    subject: '',
    grade: 0,
    tag: '',
    description: '',
    shared: 0
  });

  const [isShared, setIsShared] = useState(false);
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);
  const [adaptedPdfUrl, setAdaptedPdfUrl] = useState(null);
  
  useEffect(() => {
    if (isDraftCreatedPreview) {
          console.log('draftwork:', draftWork);

      setIsShared(false);
      setFileData((prev) => ({
        ...prev,
        tag: Array.isArray(draftWork?.dsaTypes) ? draftWork.dsaTypes.join(', ') : '',
      }));
      return;
    }

//per adapt 
    if (type === 'adapted' && id === 'new') {
      const url = sessionStorage.getItem('adaptedPdfUrl') || null;
      const metaRaw = sessionStorage.getItem('adaptedPdfData') || '{}';
      let meta = {};
      try { meta = JSON.parse(metaRaw); } catch {}

      setAdaptedPdfUrl(url);
      setIsShared(false);

      setFileData(prev => ({
        ...prev,
        title: `${(meta.originalFileName || 'Adapted material').replace(/\.pdf$/i, '')} - adapted`,
        subject: meta.subject || '',
        grade: meta.grade || 0,
        tag: Array.isArray(meta.dsa) ? meta.dsa.join(', ') : '',
        description: prev.description || ''
      }));
      return;
    }

    if (!id) return;
    fetchFileData();
  }, [id, type, isDraftCreatedPreview]);

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
        const sharedValue = fileData.shared ? 1 : 0;
        const description = fileData.description || ' '; 
        if(isDraftCreatedPreview){
          console.log('Creating new PDF with data:', fileData);
          const newCreated = await API.createPDF({...fileData, shared: sharedValue});
          console.log('Newly created PDF:', newCreated);
          for(const q of draftWork.questions){
            await API.createContentPDF(newCreated.id_pdf, q.content, q.questionType, JSON.stringify(q.answers || []));
          }
          for(const p of draftWork.paragraphs){
            await API.createContentPDF(newCreated.id_pdf, p.html, p.type, null);
          }
          alert('File created!');
        }else{
        await API.updateInfo(Number(id), fileData.title, description, fileData.subject, fileData.grade, sharedValue);
        alert('Changes saved successfully!');
        }
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

  const handleBack = () => {
    setIsBackConfirmOpen(true);
  };

  const renderContent = () => {
    if (isDraftCreatedPreview) {
      const paragraphs = Array.isArray(draftWork?.paragraphs) ? draftWork.paragraphs : [];
      const questions = Array.isArray(draftWork?.questions) ? draftWork.questions : [];

      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{fileData.title || 'Untitled assignment'}</h3>
            <div className="preview-placeholder-content">
              {paragraphs.length > 0 && (
                <>
                  {paragraphs.map((p, idx) => (
                    <div key={p.id ?? `p-${idx}`} style={{ marginBottom: '1rem' }}>
                      <div dangerouslySetInnerHTML={{ __html: p.html || '' }} />
                    </div>
                  ))}
                </>
              )}

              {questions.map((q, idx) => (
                <div key={q.id ?? `q-${idx}`} style={{ marginBottom: '1rem' }}>
                  <p>{idx + 1}. {q.content}</p>

                  {q.questionType === 'multiple_choice' && Array.isArray(q.answers) && q.answers.length > 0 && (
                    <div className="preview-checkbox-group">
                      {q.answers.map((a, aIdx) => (
                        <label key={`${q.id ?? idx}-a-${aIdx}`}>
                          <input type="checkbox" disabled /> {a}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.questionType === 'true_false' && (
                    <div className="preview-checkbox-row">
                      <label><input type="checkbox" disabled /> T</label>
                      <label><input type="checkbox" disabled /> F</label>
                    </div>
                  )}

                  {q.questionType === 'short_answer' && (
                    <p>___ ___ ___</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (type === 'created') {
      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{fileData.title}</h3>
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
      if (id === 'new' && adaptedPdfUrl) {
        return (
          <div className="preview-content-area">
            <div className="preview-content-card">
              <h3>{fileData.title}</h3>
              <div className="preview-placeholder-content">
                <object
                  data={`${adaptedPdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  type="application/pdf"
                  className="adapt-pdf-preview"
                >
                  <p>Your browser doesn't support PDF preview.</p>
                </object>
              </div>
            </div>
          </div>
        );
      }

      // Fallback for DB-backed adapted items
      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{(fileData.title || '').split(' - ')[0]}</h3>
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
            <h3>{fileData.title}</h3>
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
            <div className="preview-info-value">{fileData.title}</div>
          </div>

          <div className="preview-info-group">
            <label>Adapted for:</label>
            <div className="preview-info-value">{fileData.tag}</div>
          </div>

          <div className="preview-info-row">
            <div className="preview-info-group preview-half">
              <label>Subject:</label>
              <div className="preview-info-value">{fileData.subject}</div>
            </div>
            <div className="preview-info-group preview-half">
              <label>Class:</label>
              <div className="preview-info-value">{fileData.grade}</div>
            </div>
          </div>

          <div className="preview-info-group">
            <label>Description:</label>
            <div className="preview-info-value preview-description">{fileData.description}</div>
          </div>

          <div className="preview-info-group">
            <div className="preview-info-value preview-author">{fileData.prof}</div>
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
              value={fileData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          <div className="preview-info-group">
            <label>Adapted for:</label>
            <div className="preview-info-value">{fileData.tag}</div>
          </div>

            <div className="preview-info-row">
                <div className="preview-info-group preview-half">
                    <label>Subject:</label>
                    <select
                    className="preview-select"
                    value={fileData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
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
                        value={fileData.grade}
                        onChange={(e) => handleInputChange('grade', parseInt(e.target.value, 10))}
                    >
                        <option value={1}>1°</option>
                        <option value={2}>2°</option>
                        <option value={3}>3°</option>
                        <option value={4}>4°</option>
                        <option value={5}>5°</option>
                    </select>
                </div>
            </div>

            <div className="preview-info-group">
                <label>Description (optional):</label>
                    <textarea
                    className="preview-textarea"
                    value={fileData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    />
            </div>

          <div className="preview-checkbox-option">
            <input
              type="checkbox"
              id="shareCheckbox"
              checked={fileData.shared}
              onChange={(e) => handleInputChange('shared', e.target.checked ? 1 : 0)}
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
          <h2>Document Info</h2>
          
          <div className="preview-info-group">
            <label>Document Name:</label>
            <input
              type="text"
              className="preview-input"
              value={fileData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          <div className="preview-info-group">
            <label>Created for:</label>
            <div className="preview-info-value">{fileData.tag}</div>
          </div>

          <div className="preview-info-row">
            <div className="preview-info-group preview-half">
              <label>Subject:</label>
              <select
                className="preview-select"
                value={fileData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
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
                value={fileData.grade}
                onChange={(e) => handleInputChange('grade', parseInt(e.target.value, 10))}
              >
                <option value={1}>1°</option>
                <option value={2}>2°</option>
                <option value={3}>3°</option>
                <option value={4}>4°</option>
                <option value={5}>5°</option>
              </select>
            </div>
          </div>

          <div className="preview-info-group">
            <label>Description (optional):</label>
            <textarea
              className="preview-textarea"
              value={fileData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="preview-checkbox-option">
            <input
              type="checkbox"
              id="shareCheckbox"
              checked={fileData.shared}
              onChange={(e) => handleInputChange('shared', e.target.checked)}
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
    <div className="preview-main-wrapper">

    <div className="preview-container">
        <ConfirmDialog
            open={isBackConfirmOpen}
            title="Leave page?"
            message="Are you sure you want to go back?"
            confirmText="Go back"
            cancelText="Stay"
            onCancel={() => setIsBackConfirmOpen(false)}
            onConfirm={() => {
                setIsBackConfirmOpen(false);
                navigate(-1);
            }}
        />
      <header className="preview-header-left">
            <button
                type="button"
                className="cp-back-btn"
                onClick={handleBack}
                aria-label="Go back"
            >
            <ArrowLeft size={22} />
          </button>
        <div className="preview-header-right">
        </div>
      </header>


            <div className="preview-main">
                {renderContent()}
                {renderInfoPanel()}
            </div>
        </div>
    </div>
  );
};

export default PreviewPage;