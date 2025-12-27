import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, User } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import API from '../API/API.mjs';

import '../styles/PreviewPage.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
const SERVER_URL = 'http://localhost:3001';

function SharedPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatTitle = (title) => {
    if (!title) return '';
    return title.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // --- Mappa colori per la pagina di dettaglio ---
  const getSubjectColorStyle = (subject) => {
    if (!subject) return {};
    const s = subject.toLowerCase().trim();
    
    // Stessi colori usati nel CSS
    const styles = {
      history:   { background: '#e8e5f0', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.35)' },
      math:      { background: '#fce7f3', color: '#db2777', border: '1px solid rgba(219, 39, 119, 0.35)' },
      geography: { background: '#e0f2fe', color: '#0891b2', border: '1px solid rgba(8, 145, 178, 0.35)' },
      science:   { background: '#dbeafe', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.35)' },
      music:     { background: '#fef3e6', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.35)' },
      english:   { background: '#f3e8ff', color: '#6b21a8', border: '1px solid rgba(107, 33, 168, 0.35)' },
    };

    if (s === 'storia') return styles.history;
    if (s === 'matematica') return styles.math;
    if (s === 'geografia') return styles.geography;
    if (s === 'scienze') return styles.science;
    if (s === 'musica') return styles.music;
    if (s === 'inglese') return styles.english;

    return styles[s] || {};
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await API.getSharedWorkById(id);
        setWork(data);
        if (data && data.title) {
          const cleanFileName = data.title.replace(/\.pdf$/i, '');
          setPdfUrl(`${SERVER_URL}/shared/${cleanFileName}.pdf`);
        }
      } catch (err) {
        console.error("Errore caricamento:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const handleDownload = async () => {
    if (!work || !pdfUrl || isDownloading) return;
    try {
      setIsDownloading(true);
      await API.download(id);
      setWork(prev => ({ ...prev, download: (prev.download || 0) + 1 }));
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Errore download");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const prettyName = formatTitle(work.title);
      link.download = `${prettyName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Errore download:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="preview-main-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="#7c3aed"/>
      </div>
    );
  }

  if (!work) return <div className="preview-main-wrapper">Documento non trovato.</div>;

  const displayTitle = formatTitle(work.title);
  const subjectStyle = getSubjectColorStyle(work.subject); // Calcola lo stile

  return (
    <div className="preview-main-wrapper">
      <div className="preview-container">
        <header className="preview-header-left">
          <button className="preview-back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '1.25rem', fontWeight: 700 }}>
              {displayTitle}
            </h2>
          </div>
        </header>

        <div className="preview-main">
          <div className="preview-content-area">
             <div className="preview-pdf-wrap">
               <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="preview-pdf-loading">Caricamento PDF...</div>}
                  error={<div style={{padding:20, color: 'red'}}>Anteprima non disponibile.</div>}
                  className="react-pdf__Document"
               >
                 <div className="preview-pdf-pages">
                   {Array.from(new Array(numPages), (el, index) => (
                      <Page 
                        key={`page_${index + 1}`} 
                        pageNumber={index + 1} 
                        className="pdf-page-shadow"
                        width={600}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        canvasBackground="white" 
                        customTextRenderer={false}
                        style={{ marginBottom: '1rem' }} 
                      />
                   ))}
                 </div>
               </Document>
             </div>
          </div>

          <div className="preview-info-panel">
            <h2>Document Info</h2>
            
            <div className="preview-info-group">
              <label>Document Name:</label>
              <div className="preview-info-value">{displayTitle}</div>
            </div>

            <div className="preview-info-group">
               <label>Adapted for:</label>
               <div className="preview-info-value">
                 {work.tag ? work.tag.split(',').join(', ') : '-'}
               </div>
            </div>

            <div className="preview-info-row">
              <div className="preview-info-group">
                <label>Subject:</label>
                {/* APPLICAZIONE COLORE QUI */}
                <div className="preview-info-value" style={subjectStyle}>
                    {work.subject}
                </div>
              </div>

              <div className="preview-info-group">
                <label>Class:</label>
                <div className="preview-info-value">{work.grade}</div>
              </div>
            </div>

            <div className="preview-info-group">
              <label>Description:</label>
              <div className="preview-info-value preview-description">
                {work.description || 'No description provided.'}
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                    <User size={16} />
                    <span style={{ fontWeight: 600 }}>{work.prof || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                    <Download size={16} />
                    <span><strong>{work.download}</strong> downloads</span>
                </div>
            </div>

            <div className="preview-action-buttons">
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="preview-button download"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                {isDownloading ? 'Downloading...' : 'Download'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedPreviewPage;