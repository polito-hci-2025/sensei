import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, FileText, User, Calendar, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import API from '../API/API.mjs';
import '../styles/SharePage.css';

// Configurazione Worker PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function SharePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [copied, setCopied] = useState(false);

  // URL del Server (assicurati corrisponda al tuo backend)
  const SERVER_URL = 'http://localhost:3001';

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await API.getSharedWorkById(id);
        if (!data) throw new Error("Documento non trovato");
        setWork(data);
      } catch (err) {
        console.error(err);
        setError("Questo documento non è disponibile.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Costruzione URL PDF
  const pdfUrl = work ? `${SERVER_URL}/shared/${work.title}.pdf` : null;

  if (loading) {
    return (
      <div className="share-loading">
        <Loader2 className="share-spinner" size={48} />
        <p>Caricamento documento...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="share-error">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2>Ops! Documento non trovato.</h2>
        <button onClick={() => navigate(-1)} className="share-back-link">
          Torna indietro
        </button>
      </div>
    );
  }

  return (
    <div className="share-container">
      
      {/* HEADER: Freccia Indietro + Azioni */}
      <header className="share-header">
        <div className="share-header-left">
          <button onClick={() => navigate(-1)} className="share-back-btn" aria-label="Torna indietro">
            <ArrowLeft size={24} />
          </button>
          <h1 className="share-header-title">Shared View</h1>
        </div>

        <div className="share-header-right">
           <button className={`share-action-btn ${copied ? 'success' : ''}`} onClick={handleCopyLink}>
              <Share2 size={18} />
              {copied ? "Link Copiato!" : "Copia Link"}
           </button>
           
           <a href={pdfUrl} download target="_blank" rel="noreferrer" className="share-download-btn">
              <Download size={18} />
              Scarica
           </a>
        </div>
      </header>

      {/* CONTENUTO PRINCIPALE */}
      <div className="share-content">
        
        {/* COLONNA SINISTRA: PDF VIEWER */}
        <main className="share-pdf-section">
          <div className="share-pdf-wrapper">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="pdf-loading">Caricamento PDF...</div>}
              error={<div className="pdf-error">Impossibile caricare l'anteprima del PDF.</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page 
                  key={`page_${index + 1}`} 
                  pageNumber={index + 1} 
                  className="share-pdf-page"
                  width={750} 
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              ))}
            </Document>
          </div>
        </main>

        {/* COLONNA DESTRA: DETTAGLI */}
        <aside className="share-info-sidebar">
          <div className="share-info-card">
            <div className="share-icon-wrapper">
              <FileText size={32} />
            </div>
            
            <h2 className="share-work-title">{work.title}</h2>
            
            <div className="share-meta-list">
              <div className="share-meta-item">
                <span className="label">Materia</span>
                <span className="value">{work.subject}</span>
              </div>
              <div className="share-meta-item">
                <span className="label">Classe</span>
                <span className="value">{work.grade}</span>
              </div>
              <div className="share-meta-item">
                <span className="label">Autore</span>
                <span className="value flex-center">
                   <User size={14} style={{marginRight: 6}}/> 
                   {work.prof}
                </span>
              </div>
              <div className="share-meta-item">
                <span className="label">Downloads</span>
                <span className="value">{work.download}</span>
              </div>
            </div>

            {work.description && (
              <div className="share-description-box">
                <h3>Descrizione</h3>
                <p>{work.description}</p>
              </div>
            )}

            {work.tag && (
              <div className="share-tags">
                {work.tag.split(',').map((tag, i) => (
                  <span key={i} className="share-tag-badge">{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}

export default SharePage;