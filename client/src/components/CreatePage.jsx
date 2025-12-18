import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, FileText, HelpCircle, Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/CreatePage.css';

const getWords = (text) => {
  if (!text) return [];
  return text
    .toString()
    .match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g) ?? [];
};

const splitSentences = (text) => {
  if (!text) return [];
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const buildDraftSuggestions = ({
  selectedType,
  text,
  questionType,
  answers,
  selectedDsaTypes,
}) => {
  const suggestions = [];
  const dsaMode = Array.isArray(selectedDsaTypes) && selectedDsaTypes.length > 0;

  const plain = (text || '').trim();
  const words = getWords(plain);
  const sentences = splitSentences(plain);
  const sentenceWordCounts = sentences.map((s) => getWords(s).length);
  const maxSentenceWords = sentenceWordCounts.length ? Math.max(...sentenceWordCounts) : 0;
  const avgSentenceWords = sentenceWordCounts.length
    ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
    : 0;

 
  if (!selectedType) return [];
  if (words.length === 0) return [];

  const maxSentenceThreshold = dsaMode ? 7 : 12;
  const avgSentenceThreshold = dsaMode ? 7 : 12;

  if (sentences.length > 0 && maxSentenceWords >= maxSentenceThreshold) {
    suggestions.push(`Some sentences are long (${maxSentenceWords} words). Try splitting them.`);
  }

  if (sentences.length >= 2 && avgSentenceWords >= avgSentenceThreshold) {
    suggestions.push(
      `Average sentence length is high (${Math.round(avgSentenceWords)} words). Consider simplifying.`
    );
  }

  const questionMarks = (plain.match(/\?/g) || []).length;
  if (selectedType === 'question') {
    
    // Prototype: trigger "too long" very early to make the feedback visible.
    const longQuestionThreshold = dsaMode ? 5 : 8;
    if (words.length > longQuestionThreshold) {
      suggestions.push('The question is quite long. Try shortening it or splitting it into two questions.');
    }

    if (questionMarks === 0 && questionType !== 'true_false') {
      suggestions.push('Consider ending the question with a “?” for clarity.');
    }
    if (questionMarks > 1) {
      suggestions.push('There are multiple question marks. Try rewriting as one clear question.');
    }

    if (questionType === 'multiple_choice') {
      const nonEmpty = (answers || []).map((a) => (a || '').trim()).filter(Boolean);
      if (nonEmpty.length >= 2) {
        const lengths = nonEmpty.map((a) => getWords(a).length);
        const maxLen = Math.max(...lengths);
        const minLen = Math.min(...lengths);
        if (maxLen - minLen >= 6) {
          suggestions.push('Multiple-choice answers have very different lengths. Try to keep them similar.');
        }
      }
    }
  }

  if (selectedType === 'paragraph') {
    

    const boldHintThreshold = dsaMode ? 20 : 35;
    if (words.length >= boldHintThreshold) {
      suggestions.push('Consider highlighting key terms in bold to guide attention.');
    }

    const longParagraphThreshold = dsaMode ? 40 : 80;
    if (words.length >= longParagraphThreshold) {
      suggestions.push('This paragraph is quite long. Consider splitting into two paragraphs.');
    }
  }

  if (dsaMode) {
    suggestions.push('For DSA: prefer short sentences and simple vocabulary.');
    suggestions.push('For DSA: use bullet lists when possible.');
  }

  // Small hygiene hints
  if (/\s{2,}/.test(text || '')) {
    suggestions.push('There are multiple spaces. Consider cleaning spacing.');
  }

  return suggestions.slice(0, 6);
};

function ParagraphQuillEditor({ value, onChange, placeholder }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: '1' }, { header: '2' }, { font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      clipboard: { matchVisual: false },
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current) return;
    if (quillRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      modules,
      placeholder,
    });

    quillRef.current = quill;

    // Initial content
    quill.clipboard.dangerouslyPasteHTML(value || '', 'silent');

    const handleTextChange = () => {
      const html = quill.root.innerHTML;
      onChange(html);
    };

    quill.on('text-change', handleTextChange);

    return () => {
      try {
        quill.off('text-change', handleTextChange);
      } catch {
        // ignore
      }

      // Snow theme inserts a toolbar as a sibling BEFORE the container.
      // Since React doesn't own that node, we must remove it on unmount.
      const maybeToolbar = quill.container?.previousSibling;
      if (maybeToolbar && maybeToolbar.classList?.contains('ql-toolbar')) {
        maybeToolbar.remove();
      }

      quillRef.current = null;
    };
  }, [modules, onChange, placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const current = quill.root.innerHTML;
    const next = value || '';
    if (current !== next) {
      const selection = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(next, 'silent');
      if (selection) quill.setSelection(selection);
    }
  }, [value]);

  return <div className="cp-quill" ref={containerRef} />;
}

function CreatePage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [paragraphs, setParagraphs] = useState([]);
  const [draftText, setDraftText] = useState('');
  const [draftParagraphHtml, setDraftParagraphHtml] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedDsaTypes, setSelectedDsaTypes] = useState([]);
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [draftQuestionType, setDraftQuestionType] = useState('true_false');
  const [draftAnswers, setDraftAnswers] = useState(['', '']);

  const dsaTypes = ['Dysgraphia', 'Dyslexia', 'Dyscalculia', 'Dysorthography'];

  useEffect(() => {
    if (selectedType === 'paragraph') return;

    // Defensive cleanup: Quill mutates the DOM and may leave toolbars around
    // if the editor unmounts during rapid switches.
    document
      .querySelectorAll('.cp-center-area .ql-toolbar, .cp-center-area .ql-container')
      .forEach((el) => el.remove());

    document
      .querySelectorAll('.cp-center-area .cp-quill')
      .forEach((el) => {
        el.innerHTML = '';
      });
  }, [selectedType]);

  const toggleDsaType = (type) => {
    setSelectedDsaTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleBack = () => {
    setIsBackConfirmOpen(true);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setDraftText('');
    setDraftParagraphHtml('');
    setEditingId(null);
    if (type === 'question') {
      setDraftQuestionType('true_false');
      setDraftAnswers(['', '']);
    }
  };

  const stripHtmlToText = (html) =>
    (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const handleSaveDraft = () => {
    if (selectedType === 'question') {
      const questionText = draftText.trim();
      const answers =
        draftQuestionType === 'multiple_choice'
          ? draftAnswers.map((a) => a.trim()).filter((a) => a.length > 0)
          : [];

      if (questionText.length === 0) {
        return;
      }

      if (draftQuestionType === 'multiple_choice' && answers.length < 2) {
        return;
      }

      if (editingId) {
        setQuestions(
          questions.map((q) =>
            q.id === editingId
              ? { ...q, questionType: draftQuestionType, content: questionText, answers }
              : q
          )
        );
      } else {
        const newQuestion = {
          id: Date.now(),
          type: 'question',
          questionType: draftQuestionType,
          content: questionText,
          answers,
          title: `Question ${questions.length + 1}`,
        };
        setQuestions([...questions, newQuestion]);
      }
    }

    if (selectedType === 'paragraph') {
      const plain = stripHtmlToText(draftParagraphHtml);
      if (plain.length === 0) return;

      if (editingId) {
        setParagraphs((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, html: draftParagraphHtml } : p))
        );
      } else {
        const newParagraph = {
          id: Date.now(),
          type: 'paragraph',
          html: draftParagraphHtml,
          title: `Paragraph ${paragraphs.length + 1}`,
        };
        setParagraphs((prev) => [...prev, newParagraph]);
      }
    }

    setSelectedType(null);
    setDraftText('');
    setDraftParagraphHtml('');
    setEditingId(null);
    setDraftQuestionType('true_false');
    setDraftAnswers(['', '']);
  };

  const handleEditQuestion = (question) => {
    setSelectedType(question.type);
    setDraftText(question.content);
    setEditingId(question.id);
    setDraftQuestionType(question.questionType || 'true_false');
    setDraftAnswers(Array.isArray(question.answers) && question.answers.length > 0 ? question.answers : ['', '']);
  };

  const handleEditParagraph = (paragraph) => {
    setSelectedType(paragraph.type);
    setEditingId(paragraph.id);
    setDraftParagraphHtml(paragraph.html || '');
    setDraftText('');
    setDraftQuestionType('true_false');
    setDraftAnswers(['', '']);
  };

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDeleteParagraph = (id) => {
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteDraft = () => {
    if (editingId) {
      if (selectedType === 'question') handleDeleteQuestion(editingId);
      if (selectedType === 'paragraph') handleDeleteParagraph(editingId);
    }
    setSelectedType(null);
    setDraftText('');
    setDraftParagraphHtml('');
    setEditingId(null);
    setDraftQuestionType('true_false');
    setDraftAnswers(['', '']);
  };

  const handleQuestionTypeChange = (value) => {
    setDraftQuestionType(value);
    if (value === 'multiple_choice' && (!draftAnswers || draftAnswers.length === 0)) {
      setDraftAnswers(['', '']);
    }
  };

  const handleChangeAnswer = (index, value) => {
    setDraftAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const handleAddAnswer = () => {
    setDraftAnswers((prev) => [...prev, '']);
  };

  const handleDeleteAnswer = (index) => {
    setDraftAnswers((prev) => prev.filter((_, i) => i !== index));
  };

  const nonEmptyAnswerCount = draftAnswers.map((a) => a.trim()).filter(Boolean).length;

  const getQuestionValidationMessage = () => {
    if (draftText.trim().length === 0) return 'Question text is required.';
    if (draftQuestionType === 'multiple_choice' && nonEmptyAnswerCount < 2) {
      return `Multiple choice requires at least 2 answers (currently ${nonEmptyAnswerCount}).`;
    }
    return '';
  };

  const questionValidationMessage = selectedType === 'question' ? getQuestionValidationMessage() : '';
  const canSaveQuestion = selectedType === 'question' && questionValidationMessage === '';

  const canSaveParagraph = selectedType === 'paragraph' && stripHtmlToText(draftParagraphHtml).length > 0;

  const currentDraftPlainText = useMemo(() => {
    if (selectedType === 'paragraph') return stripHtmlToText(draftParagraphHtml);
    if (selectedType === 'question') return draftText || '';
    return '';
  }, [selectedType, draftParagraphHtml, draftText]);

  const suggestions = useMemo(
    () =>
      buildDraftSuggestions({
        selectedType,
        text: currentDraftPlainText,
        questionType: draftQuestionType,
        answers: draftAnswers,
        selectedDsaTypes,
      }),
    [selectedType, currentDraftPlainText, draftQuestionType, draftAnswers, selectedDsaTypes]
  );

  const shouldShowSuggestions = selectedType && currentDraftPlainText.trim().length > 0;

  const getEditingQuestionNumber = () => {
    if (!editingId) return null;
    const index = questions.findIndex((q) => q.id === editingId);
    return index >= 0 ? index + 1 : null;
  };

  const getEditingParagraphNumber = () => {
    if (!editingId) return null;
    const index = paragraphs.findIndex((p) => p.id === editingId);
    return index >= 0 ? index + 1 : null;
  };

  const handleRequestDeleteCurrent = () => {
    const kind = selectedType;
    const number = kind === 'paragraph' ? getEditingParagraphNumber() : getEditingQuestionNumber();
    setDeleteTarget(editingId ? { kind, id: editingId, number } : { kind, id: null, number: null });
    setIsDeleteConfirmOpen(true);
  };

  const handleRequestDeleteFromOverview = (kind, id, number) => {
    setDeleteTarget({ kind, id, number });
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    const targetId = deleteTarget?.id ?? null;
    const kind = deleteTarget?.kind ?? null;

    if (targetId === null) {
      handleDeleteDraft();
      return;
    }

    if (kind === 'paragraph') handleDeleteParagraph(targetId);
    else handleDeleteQuestion(targetId);

    if (editingId === targetId) {
      setSelectedType(null);
      setDraftText('');
      setDraftParagraphHtml('');
      setEditingId(null);
      setDraftQuestionType('true_false');
      setDraftAnswers(['', '']);
    }
  };

  return (
    <div className="cp-container">
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
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title={deleteTarget?.kind === 'paragraph' ? 'Delete paragraph?' : 'Delete question?'}
        message={`Are you sure you want to delete ${deleteTarget?.kind === 'paragraph' ? 'Paragraph' : 'Question'} ${deleteTarget?.number ?? ''}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          handleConfirmDelete();
          setDeleteTarget(null);
        }}
      />
      {/* Main Content Area */}
      <div className="cp-main-content">
        {/* Left Sidebar */}
        <div className="cp-left-sidebar">
          <button
            type="button"
            className="cp-back-btn"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="cp-dsa-section">
            <div className="cp-dsa-title">DSA Type</div>
            <div className="cp-dsa-options">
              {dsaTypes.map((type) => {
                const isSelected = selectedDsaTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    className={`cp-dsa-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleDsaType(type)}
                    aria-pressed={isSelected}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cp-overview-section cp-overview-empty">
            <span className="cp-overview-label">Overview</span>

            {questions.map((question, index) => (
              <div key={question.id} className="cp-question-item">
                <button
                  className="cp-saved-question"
                  onClick={() => handleEditQuestion(question)}
                >
                  Question {index + 1}
                </button>
                <button
                  className="cp-delete-btn"
                  onClick={() => handleRequestDeleteFromOverview('question', question.id, index + 1)}
                  aria-label={`Delete question ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {paragraphs.map((paragraph, index) => (
              <div key={paragraph.id} className="cp-question-item">
                <button
                  className="cp-saved-question"
                  onClick={() => handleEditParagraph(paragraph)}
                >
                  Paragraph {index + 1}
                </button>
                <button
                  className="cp-delete-btn"
                  onClick={() => handleRequestDeleteFromOverview('paragraph', paragraph.id, index + 1)}
                  aria-label={`Delete paragraph ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="cp-left-actions">
            <button className="cp-btn-primary" onClick={() => handleSelectType('question')}>
              <Plus size={18} /> Add Question
            </button>
            <button className="cp-btn-primary" onClick={() => handleSelectType('paragraph')}>
              <Plus size={18} /> Add Paragraph
            </button>
            <button className="cp-btn-secondary">
              <Save size={18} /> Save Assignment
            </button>
          </div>
        </div>

        {/* Center Area */}
        <div className="cp-center-area">
          {!selectedType ? (
            <div className="cp-empty-state">
              <div className="cp-empty-state-icon">
                <FileText size={64} />
              </div>
              <h2 className="cp-empty-state-title">Start creating your content</h2>
              <p className="cp-empty-state-text">Select a content type to begin:</p>
              <div className="cp-empty-state-buttons">
                <button 
                  className="cp-btn-large cp-btn-question"
                  onClick={() => handleSelectType('question')}
                >
                  <HelpCircle size={24} />
                  Add Question
                </button>
                <button 
                  className="cp-btn-large cp-btn-paragraph"
                  onClick={() => handleSelectType('paragraph')}
                >
                  <FileText size={24} />
                  Add Paragraph
                </button>
              </div>
            </div>
          ) : selectedType === 'question' ? (
            <div className="cp-editor-area">
              <h3 className="cp-editor-title">
                Question {editingId ? getEditingQuestionNumber() : questions.length + 1}
              </h3>

              <div className="cp-editor-content">
                <div className="cp-field">
                  <label className="cp-field-label" htmlFor="cp-question-type">Question Type</label>
                  <select
                    id="cp-question-type"
                    className="cp-select"
                    value={draftQuestionType}
                    onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>

                <div className="cp-field">
                  <label className="cp-field-label" htmlFor="cp-question-text">Question Text</label>
                  <textarea
                    id="cp-question-text"
                    className={
                      draftQuestionType === 'short_answer'
                        ? 'cp-content-textarea cp-content-textarea--large'
                        : 'cp-content-textarea cp-content-textarea--small'
                    }
                    placeholder="Write the question..."
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                  />

                  {!canSaveQuestion && questionValidationMessage && (
                    <div className="cp-error-text">{questionValidationMessage}</div>
                  )}
                </div>

                {draftQuestionType === 'multiple_choice' && (
                  <div className="cp-field">
                    <div className="cp-field-label">Answers</div>
                    <div className="cp-answers">
                      {draftAnswers.map((answer, index) => (
                        <div key={index} className="cp-answer-row">
                          <input
                            className="cp-answer-input"
                            type="text"
                            value={answer}
                            onChange={(e) => handleChangeAnswer(index, e.target.value)}
                            placeholder={`Answer ${index + 1}`}
                          />
                          <button
                            type="button"
                            className="cp-answer-delete"
                            onClick={() => handleDeleteAnswer(index)}
                            aria-label={`Delete answer ${index + 1}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="cp-btn-secondary cp-add-answer" onClick={handleAddAnswer}>
                      <Plus size={18} /> Add Answer
                    </button>
                  </div>
                )}
              </div>

              <div className="cp-editor-footer">
                <button className="cp-btn-primary" onClick={handleSaveDraft} disabled={!canSaveQuestion}>
                  <Save size={18} />
                  Save Question
                </button>
                <button className="cp-btn-secondary" onClick={handleRequestDeleteCurrent}>
                  <Trash2 size={18} />
                  Delete Question
                </button>
              </div>
            </div>
          ) : (
            <div className="cp-editor-area">
              <h3 className="cp-editor-title">
                Paragraph {editingId ? getEditingParagraphNumber() : paragraphs.length + 1}
              </h3>

              <div className="cp-editor-content">
                <ParagraphQuillEditor
                  value={draftParagraphHtml}
                  onChange={setDraftParagraphHtml}
                  placeholder="Write the paragraph..."
                />
              </div>

              <div className="cp-editor-footer">
                <button className="cp-btn-primary" onClick={handleSaveDraft} disabled={!canSaveParagraph}>
                  <Save size={18} />
                  Save Paragraph
                </button>
                <button className="cp-btn-secondary" onClick={handleRequestDeleteCurrent}>
                  <Trash2 size={18} />
                  Delete Paragraph
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Suggestions */}
        <div className="cp-right-sidebar">
          <div className="cp-suggestions-header">
            <h3 className="cp-suggestions-title">Suggestions</h3>
          </div>
          <div className="cp-suggestions-content">
            {!shouldShowSuggestions ? (
              <div className="cp-suggestions-placeholder">
                <p className="cp-placeholder-text">Suggestions available soon...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="cp-suggestions-placeholder">
                <p className="cp-placeholder-text">No suggestions right now.</p>
              </div>
            ) : (
              <>
                <p className="cp-suggestions-label">For the current draft</p>
                {suggestions.map((s, idx) => (
                  <div key={`${idx}-${s}`} className="cp-suggestion-item" role="note">
                    {s}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="cp-bottom-bar">
        <div className="cp-bottom-bar-left">
          <button className="cp-btn-change-font">Change Font</button>
        </div>
        <div className="cp-bottom-bar-right">
          <button className="cp-btn-suggestions">
            Try to shorten the question
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePage;
