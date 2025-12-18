import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const [myWorks, setMyWorks] = useState([
    {
      id: 1,
      title: 'Giulio cesare quiz',
      status: 'created',
      shared: false,
      dsaTypes: ['Dyslexia'],
      questions: [
        {
          id: 101,
          type: 'question',
          questionType: 'true_false',
          content: 'Giulio Cesare attraversò il Rubicone nel 49 a.C.?',
          answers: [],
          title: 'Question 1',
        },
        {
          id: 102,
          type: 'question',
          questionType: 'multiple_choice',
          content: 'Qual era la carica politica di Giulio Cesare?',
          answers: ['Console', 'Imperatore', 'Senatore'],
          title: 'Question 2',
        },
      ],
      paragraphs: [
        {
          id: 201,
          type: 'paragraph',
          title: 'Paragraph 1',
          html: '<p><strong>Giulio Cesare</strong> è stato un generale e politico romano.</p>',
        },
      ],
    },
    { id: 2, title: 'WW2 Lesson', status: 'adapted', shared: true, dsaTypes: [], questions: [], paragraphs: [] },
    {
      id: 3,
      title: 'History Quiz',
      status: 'created',
      shared: false,
      dsaTypes: ['Dysgraphia'],
      questions: [
        {
          id: 103,
          type: 'question',
          questionType: 'short_answer',
          content: 'Spiega in una frase cos’è una fonte storica.',
          answers: [],
          title: 'Question 1',
        },
      ],
      paragraphs: [],
    },
  ]);

  const [openWorkMenuId, setOpenWorkMenuId] = useState(null);
  const [workMenuPos, setWorkMenuPos] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetWork, setDeleteTargetWork] = useState(null);

  const closeWorkMenu = () => {
    setOpenWorkMenuId(null);
    setWorkMenuPos(null);
  };

  useEffect(() => {
    const onPointerDown = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) {
        closeWorkMenu();
        return;
      }

      const insideMenu = target.closest('.homepage-work-menu');
      const insideButton = target.closest('.homepage-work-card-menu');
      if (insideMenu || insideButton) return;
      closeWorkMenu();
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const openWork = openWorkMenuId ? myWorks.find((w) => w.id === openWorkMenuId) : null;

  const mostDownloaded = [
    {
      id: 1,
      title: 'Napoleon',
      subtitle: 'Lesson with visual support',
      category: 'Dyslexia',
      subject: 'History',
      grade: 'Grade 3',
      author: 'Prof Morello',
      downloads: 56
    },
    {
      id: 2,
      title: 'Roman History',
      subtitle: 'Roman Empire Lesson',
      category: 'Dyslexia',
      subject: 'History',
      grade: 'Grade 1',
      author: 'Prof Mileto',
      downloads: 42
    },
    {
      id: 3,
      title: 'Solar System',
      subtitle: 'Introduction to solar system',
      category: 'Dysgraphia',
      subject: 'Science',
      grade: 'Grade 2',
      author: 'Prof Morello',
      downloads: 100
    }
  ];

  const recentlyShared = [
    {
      id: 1,
      title: 'Leopardi',
      subtitle: "Giacomo Leopardi's life and works",
      category: 'Dyslexia',
      subject: 'Italian',
      grade: 'Grade 5',
      author: 'Prof Morello',
      downloads: 15
    },
    {
      id: 2,
      title: 'Second Grade Eq...',
      subtitle: 'Exercises',
      category: 'Dyscalculia',
      subject: 'Math',
      grade: 'Grade 2',
      author: 'Prof Morello',
      downloads: 5
    },
    {
      id: 3,
      title: 'Industrial Revolut...',
      subtitle: 'Lesson',
      category: 'Dyslexia',
      subject: 'History',
      grade: 'Grade 4',
      author: 'Prof Verdi',
      downloads: 9
    }
  ];

  const getCategoryClass = (category) => {
    const classes = {
      'Dyslexia': 'dyslexia',
      'Dysgraphia': 'dysgraphia',
      'Dyscalculia': 'dyscalculia'
    };
    return classes[category] || 'dyslexia';
  };

  const LessonCard = ({ lesson }) => (
    <div 
      className={`homepage-lesson-card ${getCategoryClass(lesson.category)}`}
    >
      <div className="homepage-lesson-card-header">
        <span className="homepage-lesson-card-category">{lesson.category}</span>
        <div className="homepage-lesson-card-downloads">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
          </svg>
          <span>{lesson.downloads}</span>
        </div>
      </div>
      
      <h3>{lesson.title}</h3>
      <p className="homepage-lesson-card-subtitle">{lesson.subtitle}</p>
      
      <div className="homepage-lesson-card-tags">
        <span className={`homepage-lesson-card-tag category-${lesson.category.toLowerCase()}`}>{lesson.subject}</span>
        <span className="homepage-lesson-card-tag grade">{lesson.grade}</span>
      </div>
      
      <div className="homepage-lesson-card-footer">
        <span className="homepage-lesson-card-author">by {lesson.author}</span>
        <button 
          className="homepage-lesson-card-button"
          onClick={() => navigate(`/view/${lesson.id}`)}
        >
          View
        </button>
      </div>
    </div>
  );

  const MyWorkCard = ({ work }) => (
    <div
      className="homepage-work-card"
      onClick={() => navigate(`/edit/${work.id}`)}
    >
      <button
        className="homepage-work-card-menu"
        onClick={(e) => {
          e.stopPropagation();

          if (openWorkMenuId === work.id) {
            closeWorkMenu();
            return;
          }

          const rect = e.currentTarget.getBoundingClientRect();
          const menuWidth = 170;
          const menuHeight = 4 * 40 + 16;
          const gap = 8;

          let top = rect.bottom + gap;
          if (top + menuHeight > window.innerHeight - gap) {
            top = rect.top - gap - menuHeight;
          }

          let left = rect.right - menuWidth;
          left = Math.max(gap, Math.min(left, window.innerWidth - menuWidth - gap));

          setWorkMenuPos({ top, left, width: menuWidth });
          setOpenWorkMenuId(work.id);
        }}
        aria-haspopup="menu"
        aria-expanded={openWorkMenuId === work.id}
        aria-label="Open work menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
          <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
        </svg>
      </button>

      <div>
        <h4>{work.title}</h4>
        <span>{work.status}</span>
      </div>
    </div>
  );

  return (
    <div className="homepage-container">
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Delete work?"
        message={`Are you sure you want to delete “${deleteTargetWork?.title ?? ''}”?`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteTargetWork(null);
        }}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          if (deleteTargetWork) {
            setMyWorks((prev) => prev.filter((w) => w.id !== deleteTargetWork.id));
          }
          setDeleteTargetWork(null);
        }}
      />
      {/* Sidebar */}
      <div className="homepage-sidebar">
        <div className="homepage-works-section">
          <h2>My Works</h2>
          
          <div className="homepage-works-list" onScroll={closeWorkMenu}>
            {myWorks.map(work => (
              <MyWorkCard key={work.id} work={work} />
            ))}
          </div>
        </div>

        <div className="homepage-action-buttons">
          <button 
            onClick={() => navigate('/create')}
            className="homepage-action-button create"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
            CREATE
          </button>
          <button 
            onClick={() => navigate('/adapt')}
            className="homepage-action-button adapt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
            </svg>
            ADAPT
          </button>
          <button 
            onClick={() => navigate('/shared')}
            className="homepage-action-button shared"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
            </svg>
            SHARED
          </button>
        </div>
      </div>

      {openWork && workMenuPos &&
        createPortal(
          <div
            className="homepage-work-menu"
            role="menu"
            aria-label="Work actions"
            style={{ top: `${workMenuPos.top}px`, left: `${workMenuPos.left}px`, width: `${workMenuPos.width}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="homepage-work-menu-item"
              role="menuitem"
              onClick={() => {
                closeWorkMenu();
                if (openWork.status === 'created') {
                  navigate('/create', { state: { work: openWork } });
                } else {
                  navigate(`/edit/${openWork.id}`);
                }
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="homepage-work-menu-item"
              role="menuitem"
              onClick={() => {
                // Prototype: no-op for now
                closeWorkMenu();
              }}
            >
              Download
            </button>
            <button
              type="button"
              className="homepage-work-menu-item"
              role="menuitem"
              onClick={() => {
                closeWorkMenu();
                setDeleteTargetWork(openWork);
                setIsDeleteConfirmOpen(true);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="homepage-work-menu-item"
              role="menuitem"
              onClick={() => {
                // Prototype: no-op for now
                closeWorkMenu();
              }}
            >
              {openWork.shared ? 'Unshared' : 'Shared'}
            </button>
          </div>,
          document.body
        )}

      {/* Main Content */}
      <div className="homepage-main-content">
        {/* Most Downloaded */}
        <section className="homepage-section">
          <h2>Most downloaded</h2>
          <div className="homepage-lessons-grid">
            {mostDownloaded.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>

        {/* Recently Shared */}
        <section className="homepage-section">
          <h2>Recently shared</h2>
          <div className="homepage-lessons-grid">
            {recentlyShared.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;