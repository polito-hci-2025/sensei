const STORAGE_KEY = 'sensei.createdDraft.v1';
const STORAGE_VERSION = 1;

const defaultDraft = () => ({
  version: STORAGE_VERSION,
  work: {
    id: null,
    dsaTypes: [],
    questions: [],
    paragraphs: [],
    title: '',
    subject: '',
    grade: 0,
    tag: '',
    description: '',
    shared: false,
  },
  ui: {
    selectedType: null,
    draftText: '',
    draftParagraphHtml: '',
    editingId: null,
    draftQuestionType: 'true_false',
    draftAnswers: ['', ''],
  },
});

const safeJsonParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const normalizeWork = (workLike) => {
  const safe = workLike ?? {};
  return {
    id: safe.id ?? null,
    dsaTypes: Array.isArray(safe.dsaTypes) ? safe.dsaTypes : [],
    questions: Array.isArray(safe.questions) ? safe.questions : [],
    paragraphs: Array.isArray(safe.paragraphs) ? safe.paragraphs : [],
    title: (safe.title ?? '').toString(),
    subject: (safe.subject ?? '').toString(),
    grade: Number(safe.grade) || 0,
    tag: (safe.tag ?? '').toString(),
    description: (safe.description ?? '').toString(),
    shared: !!safe.shared,
  };
};

const normalizeUi = (uiLike) => {
  const safe = uiLike ?? {};
  return {
    selectedType: safe.selectedType ?? null,
    draftText: (safe.draftText ?? '').toString(),
    draftParagraphHtml: (safe.draftParagraphHtml ?? '').toString(),
    editingId: safe.editingId ?? null,
    draftQuestionType: (safe.draftQuestionType ?? 'true_false').toString(),
    draftAnswers: Array.isArray(safe.draftAnswers) ? safe.draftAnswers : ['', ''],
  };
};

export const loadCreatedDraft = () => {
  const raw = (() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  const parsed = safeJsonParse(raw);
  if (!parsed) return null;

  // Back-compat: if we ever stored just the work object.
  const maybeWorkOnly = parsed?.questions || parsed?.paragraphs || parsed?.dsaTypes;
  if (maybeWorkOnly && !parsed.work) {
    return {
      ...defaultDraft(),
      work: normalizeWork(parsed),
    };
  }

  if (!parsed.work) return null;

  return {
    ...defaultDraft(),
    version: parsed.version ?? STORAGE_VERSION,
    work: normalizeWork(parsed.work),
    ui: normalizeUi(parsed.ui),
  };
};

export const saveCreatedDraft = (draft) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore (storage might be disabled)
  }
};

export const clearCreatedDraft = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const updateCreatedDraft = (patch) => {
  const existing = loadCreatedDraft() ?? defaultDraft();

  const next = {
    ...existing,
    ...patch,
    work: normalizeWork({
      ...existing.work,
      ...(patch?.work ?? {}),
    }),
    ui: normalizeUi({
      ...existing.ui,
      ...(patch?.ui ?? {}),
    }),
  };

  saveCreatedDraft(next);
  return next;
};
