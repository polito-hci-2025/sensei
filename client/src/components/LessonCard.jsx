import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, User } from 'lucide-react';
import '../styles/LessonCard.css';

function LessonCard({ lesson, type }) {
  const navigate = useNavigate();

  const handleView = () => {
    if (type === 'shared') {
      navigate(`/shared/view/${lesson.id}`);
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
  
  // Tag DSA (prende il primo se ce ne sono multipli)
  const dsaTag = lesson.tag ? lesson.tag.split(',')[0].trim() : 'General';

  // --- LOGICA CLASSI CSS ---
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

  const getDsaClass = (tag) => {
    if (!tag) return 'default';
    const t = tag.toLowerCase().trim();
    if (t.includes('dyslexia') || t.includes('dislessia')) return 'dyslexia';
    if (t.includes('dyscalculia') || t.includes('discalculia')) return 'dyscalculia';
    if (t.includes('dysgraphia') || t.includes('disgrafia')) return 'dysgraphia';
    if (t.includes('adhd')) return 'adhd';
    return 'default';
  };
  // -------------------------

  return (
    <div className="lesson-card">
      
      {/* HEADER: DSA Tag + Download */}
      <div className="lesson-card-header">
        <span className={`lesson-dsa-badge ${getDsaClass(dsaTag)}`}>
          {dsaTag}
        </span>
        
        <div className="lesson-card-downloads">
           <Download size={14} />
           <span>{lesson.download || 0}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="lesson-card-body">
        {/* Titolo */}
        <h3 className="lesson-title" title={displayTitle}>
          {displayTitle}
        </h3>
        
        {/* Descrizione (NUOVO) */}
        <p className="lesson-description">
          {lesson.description || 'No description available'}
        </p>

        {/* Badge Materia e Classe */}
        <div className="lesson-meta-tags">
          <span className={`lesson-meta-badge subject ${getSubjectClass(lesson.subject)}`}>
            {lesson.subject || 'Generale'}
          </span>
          <span className="lesson-meta-badge grade">
            {lesson.grade ? lesson.grade : 'N/A'}
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="lesson-card-footer">
        <div className="lesson-author">
           <User size={14} style={{ marginRight: 4 }} />
           <span>{lesson.prof ? lesson.prof : 'Unknown'}</span>
        </div>
        
        <button onClick={handleView} className="lesson-view-btn">
          View
        </button>
      </div>
    </div>
  );
}

export default LessonCard;