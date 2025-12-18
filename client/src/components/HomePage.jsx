import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import API from '../API/API.mjs';
import ConfirmDialog from './ConfirmDialog';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const formatPdfDisplayName = (value) => {
    if (value == null) return '';
    const base = value.toString().split(/[/\\]/).pop() ?? '';
    return base
      .replace(/\.pdf$/i, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const [myWorks, setMyWorks] = useState([]);
  const [isLoadingMyWorks, setIsLoadingMyWorks] = useState(true);
  const [myWorksError, setMyWorksError] = useState('');

  const [sharedWorks, setSharedWorks] = useState([]);
  const [isLoadingSharedWorks, setIsLoadingSharedWorks] = useState(true);
  const [sharedWorksError, setSharedWorksError] = useState('');

  const [openWorkMenuId, setOpenWorkMenuId] = useState(null);
  const [workMenuPos, setWorkMenuPos] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetWork, setDeleteTargetWork] = useState(null);

  const closeWorkMenu = () => {
    setOpenWorkMenuId(null);
    setWorkMenuPos(null);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoadingMyWorks(true);
        setMyWorksError('');
        const works = await API.getAllMyWorks();
        if (cancelled) return;

        setMyWorks(
          works.map((w) => ({
            id: w.id,
            title: w.title,
            displayTitle: formatPdfDisplayName(w.title),
            status: w.status,
            shared: w.shared,
            subject: w.subject,
            grade: w.grade,
            tag: w.tag,
            description: w.description,
            download: w.download,
            prof: w.prof,
          }))
        );
      } catch (err) {
        if (cancelled) return;
        setMyWorksError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setIsLoadingMyWorks(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadShared = async () => {
      try {
        setIsLoadingSharedWorks(true);
        setSharedWorksError('');
        const works = await API.getAllShared();
        if (cancelled) return;
        setSharedWorks(works);
      } catch (err) {
        if (cancelled) return;
        setSharedWorksError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setIsLoadingSharedWorks(false);
      }
    };

    loadShared();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const normalizeCreatePdfType = (value) => (value ?? '').toString().trim().toLowerCase();

  const tryParseAnswers = (value) => {
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];

    const trimmed = value.trim();
    if (trimmed.length === 0) return [];

    // Back-compat: if someone stored JSON, accept it.
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return trimmed
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  };

  const toQuestionType = (rawType, answers) => {
    const t = normalizeCreatePdfType(rawType);

    if (t === 'true/false' || t === 'true_false' || t === 'truefalse') return 'true_false';
    if (t === 'short' || t === 'short_answer' || t === 'shortanswer') return 'short_answer';
    if (t === 'multi' || t === 'multiple_choice' || t === 'multiplechoice') return 'multiple_choice';

    const count = Array.isArray(answers) ? answers.length : 0;
    return count >= 2 ? 'multiple_choice' : 'short_answer';
  };

  const navigateToWorkEditor = async (work) => {
    if (!work) return;

    if (work.status === 'created') {
      try {
        const contents = await API.getAllContentByPdf(work.id);
        const paragraphs = [];
        const questions = [];

        for (const c of contents) {
          const t = normalizeCreatePdfType(c.type);
          if (t === 'paragraph') {
            paragraphs.push({
              id: c.id,
              type: 'paragraph',
              title: `Paragraph ${paragraphs.length + 1}`,
              html: c.content,
            });
          } else {
            const parsedAnswers = tryParseAnswers(c.answers);
            const questionType = toQuestionType(c.type, parsedAnswers);
            questions.push({
              id: c.id,
              type: 'question',
              title: `Question ${questions.length + 1}`,
              questionType,
              content: c.content,
              answers: questionType === 'multiple_choice' ? parsedAnswers : [],
            });
          }
        }

        navigate('/create', {
          state: {
            work: {
              ...work,
              questions,
              paragraphs,
              dsaTypes: [],
            },
          },
        });
      } catch {
        navigate('/create', {
          state: {
            work: {
              ...work,
              questions: [],
              paragraphs: [],
              dsaTypes: [],
            },
          },
        });
      }
      return;
    }

    navigate(`/edit/${work.id}`);
  };

  const splitDsaTags = (value) => {
    if (value == null) return [];
    return value
      .toString()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const sharedLessonCards = sharedWorks.map((w) => {
    const categories = splitDsaTags(w.tag);
    const primaryCategory = categories[0] || w.tag || 'Dyslexia';

    return {
      id: w.id,
      title: formatPdfDisplayName(w.title),
      subtitle: w.description || '',
      category: primaryCategory,
      categories: categories.length > 0 ? categories : [primaryCategory],
      subject: w.subject,
      grade: w.grade,
      author: w.prof || 'Unknown',
      downloads: w.download || 0,
    };
  });

  // Shared works: most downloaded at the top.
  const mostDownloaded = [...sharedLessonCards]
    .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
    .slice(0, 3);

  // Shared works: "recent" by higher ID, but shown with higher ID at the bottom.
  const recentlyShared = [...sharedLessonCards]
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    .slice(0, 3)
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  const getCategoryClass = (category) => {
    const key = (category ?? '').toString().trim().toLowerCase();
    const classes = {
      dyslexia: 'dyslexia',
      dysgraphia: 'dysgraphia',
      dyscalculia: 'dyscalculia',
    };
    return classes[key] || 'dyslexia';
  };

  const normalizeSubject = (value) => (value ?? '').toString().trim().toLowerCase();

  const getSubjectClass = (subject) => {
    const s = normalizeSubject(subject);
    if (s === 'history') return 'history';
    if (s === 'math') return 'math';
    if (s === 'geography') return 'geography';
    if (s === 'science') return 'science';
    if (s === 'music') return 'music';
    return 'default';
  };

  const LessonCard = ({ lesson }) => (
    <div 
      className={`homepage-lesson-card ${getCategoryClass(lesson.Type)}`}
    >
      <div className="homepage-lesson-card-header">
        <div className="homepage-lesson-card-categories">
          {(Array.isArray(lesson.categories) && lesson.categories.length > 0
            ? lesson.categories
            : [lesson.category]
          ).map((c, idx) => (
            <span
              key={`${lesson.id}-dsa-${idx}-${c}`}
              className={`homepage-lesson-card-category category-${getCategoryClass(c)}`}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="homepage-lesson-card-downloads">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
          </svg>
          <span>{lesson.Download}</span>
        </div>
      </div>
      
      <h3>{lesson.NamePDF}</h3>
      <p className="homepage-lesson-card-subtitle">{lesson.Description}</p>
      
      <div className="homepage-lesson-card-tags">
        <span className={`homepage-lesson-card-tag subject-${getSubjectClass(lesson.subject)}`}>{lesson.subject}</span>
        <span className="homepage-lesson-card-tag grade">{lesson.grade}</span>
      </div>
      
      <div className="homepage-lesson-card-footer">
        <span className="homepage-lesson-card-author">by {lesson.Prof}</span>
        <button 
          className="homepage-lesson-card-button"
          onClick={() => navigate(`/shared/preview/${lesson.id}`)}
        >
          View
        </button>
      </div>
    </div>
  );

  const MyWorkCard = ({ work }) => (
    <div
      className="homepage-work-card"
      onClick={() => { navigate(`/${work.Type}/preview/${work.id_pdf}`); closeWorkMenu(); }}
        
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
        <h4>{work.displayTitle || formatPdfDisplayName(work.title)}</h4>
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
        onConfirm={async () => {
          setIsDeleteConfirmOpen(false);
          if (!deleteTargetWork) return;

          const id = deleteTargetWork.id;
          setDeleteTargetWork(null);

          try {
            await API.deleteMyWork(id);
            setMyWorks((prev) => prev.filter((w) => w.id !== id));
          } catch (err) {
            setMyWorksError(err?.message ?? String(err));
          }
        }}
      />
      {/* Sidebar */}
      <div className="homepage-sidebar">
        <div className="homepage-works-section">
          <h2>My Works</h2>
          
          <div className="homepage-works-list" onScroll={closeWorkMenu}>
            {isLoadingMyWorks && <div className="homepage-empty">Loading...</div>}
            {!isLoadingMyWorks && myWorksError && <div className="homepage-empty">{myWorksError}</div>}
            {!isLoadingMyWorks && !myWorksError && myWorks.length === 0 && (
              <div className="homepage-empty">No works yet</div>
            )}
            {!isLoadingMyWorks && !myWorksError && myWorks.map((work) => (
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
              onClick={async () => {
                closeWorkMenu();
                await navigateToWorkEditor(openWork);
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
              onClick={async () => {
                closeWorkMenu();
                if (!openWork) return;

                const nextShared = openWork.shared ? 0 : 1;

                try {
                  await API.updateInfo(
                    openWork.id,
                    openWork.title,
                    openWork.description,
                    openWork.subject,
                    openWork.grade,
                    nextShared
                  );

                  setMyWorks((prev) =>
                    prev.map((w) =>
                      w.id === openWork.id
                        ? {
                            ...w,
                            shared: Boolean(nextShared),
                          }
                        : w
                    )
                  );

                  // Refresh shared list to reflect DB changes.
                  setIsLoadingSharedWorks(true);
                  setSharedWorksError('');
                  const refreshed = await API.getAllShared();
                  setSharedWorks(refreshed);
                } catch (err) {
                  setMyWorksError(err?.message ?? String(err));
                } finally {
                  setIsLoadingSharedWorks(false);
                }
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
            {isLoadingSharedWorks && <div className="homepage-empty">Loading...</div>}
            {!isLoadingSharedWorks && sharedWorksError && (
              <div className="homepage-empty">{sharedWorksError}</div>
            )}
            {!isLoadingSharedWorks && !sharedWorksError && mostDownloaded.length === 0 && (
              <div className="homepage-empty">No shared works yet</div>
            )}
            {!isLoadingSharedWorks && !sharedWorksError && mostDownloaded.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>

        {/* Recently Shared */}
        <section className="homepage-section">
          <h2>Recently shared</h2>
          <div className="homepage-lessons-grid">
            {isLoadingSharedWorks && <div className="homepage-empty">Loading...</div>}
            {!isLoadingSharedWorks && sharedWorksError && (
              <div className="homepage-empty">{sharedWorksError}</div>
            )}
            {!isLoadingSharedWorks && !sharedWorksError && recentlyShared.length === 0 && (
              <div className="homepage-empty">No shared works yet</div>
            )}
            {!isLoadingSharedWorks && !sharedWorksError && recentlyShared.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;