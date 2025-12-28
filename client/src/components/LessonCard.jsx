import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Download } from 'lucide-react';
import '../styles/LessonCard.css';

function LessonCard({ lesson, type }) {
  const navigate = useNavigate();

  const handleView = () => {
    if (type === 'shared') {
      navigate(`/shared/preview/${lesson.id}`);
    } else {
      navigate(`/create/preview/${lesson.id}`);
    }
  };

  const formatTitle = (title) => {
    if (!title) return '';
    return title
      .replace(/\.pdf$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const displayTitle = formatTitle(lesson.title);

  // --- LOGICA COLORI MATERIE ---
  const getSubjectClass = (subject) => {
    if (!subject) return 'default';
    const s = subject.toLowerCase().trim();
    
    if (s === 'history' || s === 'storia') return 'history';
    if (s === 'math' || s === 'matematica') return 'math';
    if (s === 'geography' || s === 'geografia') return 'geography';
    if (s === 'science' || s === 'scienze') return 'science';
    if (s === 'music' || s === 'musica') return 'music';
    if (s === 'english' || s === 'inglese') return 'english';
    
    return 'default';
  };
  // -----------------------------

  return (
    <div className="lesson-card">
      <div className="lesson-card-header">
        <div className="lesson-icon-box">
          <FileText size={24} className="lesson-icon-svg" />
        </div>
        
        {/* Assegnazione classe dinamica */}
        <span className={`lesson-badge ${getSubjectClass(lesson.subject)}`}>
          {lesson.subject || 'Generale'}
        </span>
      </div>

      <div className="lesson-card-body">
        <h3 className="lesson-title" title={displayTitle}>
          {displayTitle}
        </h3>
        <p className="lesson-subtitle">
          Classe {lesson.grade} • {lesson.tag ? lesson.tag.split(',')[0] : 'Nessun tag'}
        </p>
      </div>

      <div className="lesson-card-footer">
        <div className="lesson-author">
          <User size={14} style={{ marginRight: 4 }} />
          {lesson.prof || 'Prof. Sconosciuto'}
        </div>
        
        {type === 'shared' && (
          <div className="lesson-downloads" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#6b7280' }}>
            <Download size={14} />
            {lesson.download || 0}
          </div>
        )}

        <button onClick={handleView} className="lesson-view-btn">
          View
        </button>
      </div>
    </div>
  );
}

export default LessonCard;