import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog.jsx';
import '../styles/PreviewPage.css';
import API from '../API/API.mjs';
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext.jsx';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const formatPdfDisplayName = (value) => {
  if (value == null) return '';
  const base = value.toString().split(/[/\\]/).pop() ?? '';
  return base
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const PreviewPage = ({ type: typeProp } = {}) => {
  const { type: typeParam, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsDirty, clearDirty } = useUnsavedChanges();
  const type = typeProp ?? typeParam;

  const draftWork = location.state?.work ?? null;
  const isDraftCreatedPreview = type === 'created' && (id === undefined || id === null) && !!draftWork;
  
  const [fileData, setFileData] = useState({
    title: '',
    subject: '',
    grade: 0,
    tag: '',
    description: '',
    shared: false
  });

  const [isShared, setIsShared] = useState(false);
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);
  const [isDirtyLocal, setIsDirtyLocal] = useState(false);

  const [createdPdfUrl, setCreatedPdfUrl] = useState('');
  const [createdPdfNumPages, setCreatedPdfNumPages] = useState(null);
  const [createdPdfError, setCreatedPdfError] = useState('');
  const createdPdfScrollRef = useRef(null);

  const [storedCreatedPdfInput, setStoredCreatedPdfInput] = useState(null);

  const [adaptedPdfUrl, setAdaptedPdfUrl] = useState('');
  const [adaptedPdfNumPages, setAdaptedPdfNumPages] = useState(null);
  const [adaptedPdfError, setAdaptedPdfError] = useState('');
  const adaptedPdfScrollRef = useRef(null);

  const [sharedPdfUrl, setSharedPdfUrl] = useState('/pdf/1_Anomaly_Segmentation.pdf');
  const [sharedPdfNumPages, setSharedPdfNumPages] = useState(null);
  const [sharedPdfError, setSharedPdfError] = useState('');
  const sharedPdfScrollRef = useRef(null);

  const sharedDisplayTitle = useMemo(() => {
    if (type !== 'shared') return '';
    return formatPdfDisplayName(fileData.title);
  }, [type, fileData.title]);

  const draftPdfInput = useMemo(() => {
    if (!isDraftCreatedPreview) return null;
    const paragraphs = Array.isArray(draftWork?.paragraphs) ? draftWork.paragraphs : [];
    const questions = Array.isArray(draftWork?.questions) ? draftWork.questions : [];

    return {
      createdFor: (fileData.tag || '').trim(),
      paragraphs: paragraphs.map((p) => ({
        id: p?.id ?? 0,
        title: (p?.title || '').toString(),
        html: (p?.html || '').toString(),
      })),
      questions: questions.map((q) => ({
        id: q?.id ?? 0,
        questionType: q?.questionType ?? 'true_false',
        content: (q?.content || '').toString(),
        answers: Array.isArray(q?.answers) ? q.answers.map((a) => (a ?? '').toString()) : [],
      })),
    };
  }, [isDraftCreatedPreview, draftWork, fileData.tag]);

  useEffect(() => {
    if (type !== 'created' || isDraftCreatedPreview) {
      setStoredCreatedPdfInput(null);
      return;
    }

    if (!id) {
      setStoredCreatedPdfInput(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const rows = await API.getAllContentByPdf(Number(id));
        if (cancelled) return;

        const paragraphs = [];
        const questions = [];

        for (const row of Array.isArray(rows) ? rows : []) {
          const rowType = (row?.type || '').toString();
          const rowId = row?.id ?? 0;
          if (rowType === 'paragraph') {
            paragraphs.push({
              id: rowId,
              title: '',
              html: (row?.content || '').toString(),
            });
            continue;
          }

          let answers = [];
          const rawAnswers = row?.answers;
          if (Array.isArray(rawAnswers)) {
            answers = rawAnswers.map((a) => (a ?? '').toString());
          } else if (typeof rawAnswers === 'string' && rawAnswers.trim()) {
            try {
              const parsed = JSON.parse(rawAnswers);
              if (Array.isArray(parsed)) answers = parsed.map((a) => (a ?? '').toString());
            } catch {
              // ignore
            }
          }

          questions.push({
            id: rowId,
            questionType: rowType || 'true_false',
            content: (row?.content || '').toString(),
            answers,
          });
        }

        setStoredCreatedPdfInput({
          createdFor: (fileData.tag || '').trim(),
          paragraphs,
          questions,
        });
      } catch (err) {
        if (cancelled) return;
        setStoredCreatedPdfInput({ createdFor: '', paragraphs: [], questions: [] });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [type, id, isDraftCreatedPreview, fileData.tag]);

  const createdPdfInput = useMemo(() => {
    if (type !== 'created') return null;
    return isDraftCreatedPreview ? draftPdfInput : storedCreatedPdfInput;
  }, [type, isDraftCreatedPreview, draftPdfInput, storedCreatedPdfInput]);

  const createdPdfKey = useMemo(() => {
    if (!createdPdfInput) return '';
    return JSON.stringify(createdPdfInput);
  }, [createdPdfInput]);

  useEffect(() => {
    if (type !== 'created' || !createdPdfInput) return;

    let cancelled = false;
    let lastUrl = '';

    const sanitizeText = (text) => {
      const s = (text || '').toString();
      if (!s) return '';
      // Map common “smart” punctuation / symbols to WinAnsi-safe ASCII
      const mapped = s
        .replace(/\u00A0/g, ' ')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[—–]/g, '-')
        .replace(/…/g, '...')
        .replace(/•/g, '-')
        .replace(/\t/g, ' ');
      // Drop characters outside Latin-1 range to avoid WinAnsi encoding errors
      return mapped.replace(/[^\x00-\xFF]/g, '');
    };

    const htmlToBlocks = (html) => {
      const raw = (html || '').toString();
      if (!raw) return [];

      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

      const parseCssFontSize = (value) => {
        const v = (value || '').toString().trim().toLowerCase();
        if (!v) return null;
        const num = parseFloat(v);
        if (!Number.isFinite(num)) return null;
        if (v.endsWith('px')) return num * 0.75;
        if (v.endsWith('pt')) return num;
        // default assume px-ish
        return num * 0.75;
      };

      const normalizeFontSize = (size) => {
        if (!Number.isFinite(size)) return null;
        return clamp(Math.round(size * 10) / 10, 8, 28);
      };

      const makeRun = (text, style) => ({
        text: sanitizeText(text),
        bold: !!style.bold,
        italic: !!style.italic,
        underline: !!style.underline,
        fontSize: normalizeFontSize(style.fontSize) ?? null,
      });

      const blocks = [];
      let currentRuns = [];

      const pushParagraph = () => {
        const combined = currentRuns
          .map((r) => ({ ...r, text: (r.text || '').replace(/\s+/g, ' ') }))
          .filter((r) => r.text && r.text.length > 0);
        if (combined.length) blocks.push({ type: 'paragraph', runs: combined });
        currentRuns = [];
      };

      let doc;
      try {
        doc = new DOMParser().parseFromString(raw, 'text/html');
      } catch {
        const fallback = sanitizeText(raw.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
        return fallback ? [{ type: 'paragraph', runs: [makeRun(fallback, {})] }] : [];
      }

      const walk = (node, style) => {
        if (!node) return;

        if (node.nodeType === 3) {
          const t = (node.nodeValue || '');
          if (t) currentRuns.push(makeRun(t, style));
          return;
        }

        if (node.nodeType !== 1) return;
        const el = node;
        const tag = (el.tagName || '').toLowerCase();

        if (tag === 'br') {
          pushParagraph();
          return;
        }

        if (tag === 'img') {
          const src = el.getAttribute('src') || '';
          const alt = el.getAttribute('alt') || '';
          pushParagraph();
          if (src) blocks.push({ type: 'image', src, alt: sanitizeText(alt) });
          return;
        }

        const nextStyle = { ...style };
        if (tag === 'strong' || tag === 'b') nextStyle.bold = true;
        if (tag === 'em' || tag === 'i') nextStyle.italic = true;
        if (tag === 'u') nextStyle.underline = true;

        // Font size from Quill classes
        const className = (el.getAttribute('class') || '').toString();
        if (className.includes('ql-size-small')) nextStyle.fontSize = 9;
        if (className.includes('ql-size-large')) nextStyle.fontSize = 14;
        if (className.includes('ql-size-huge')) nextStyle.fontSize = 18;

        // Font size from inline style
        const inlineSize = parseCssFontSize(el.style?.fontSize);
        if (inlineSize) nextStyle.fontSize = inlineSize;

        // Header tags
        if (tag === 'h1') {
          nextStyle.bold = true;
          nextStyle.fontSize = 20;
        }
        if (tag === 'h2') {
          nextStyle.bold = true;
          nextStyle.fontSize = 16;
        }
        if (tag === 'h3') {
          nextStyle.bold = true;
          nextStyle.fontSize = 14;
        }

        if (tag === 'p' || tag === 'div' || tag === 'h1' || tag === 'h2' || tag === 'h3') {
          // Treat as paragraph container
          Array.from(el.childNodes || []).forEach((child) => walk(child, nextStyle));
          pushParagraph();
          return;
        }

        if (tag === 'li') {
          currentRuns.push(makeRun('- ', style));
          Array.from(el.childNodes || []).forEach((child) => walk(child, nextStyle));
          pushParagraph();
          return;
        }

        // Default: inline container
        Array.from(el.childNodes || []).forEach((child) => walk(child, nextStyle));
      };

      const body = doc.body;
      if (!body) return [];
      Array.from(body.childNodes || []).forEach((child) => walk(child, { bold: false, italic: false, underline: false }));
      pushParagraph();

      return blocks;
    };

    const pickFont = ({ bold, italic }, fonts) => {
      if (bold && italic) return fonts.boldItalic;
      if (bold) return fonts.bold;
      if (italic) return fonts.italic;
      return fonts.regular;
    };

    const tokenizeRuns = (runs, defaultSize) => {
      const tokens = [];
      for (const run of runs) {
        const text = (run?.text || '').toString();
        if (!text) continue;
        const fontSize = Number.isFinite(run?.fontSize) ? run.fontSize : defaultSize;
        const parts = text.split(/(\s+)/);
        for (const part of parts) {
          if (part.length === 0) continue;
          tokens.push({
            text: part,
            bold: !!run.bold,
            italic: !!run.italic,
            underline: !!run.underline,
            fontSize,
          });
        }
      }
      return tokens;
    };

    const layoutStyledTokens = ({ tokens, fonts, maxWidth }) => {
      const lines = [];
      let lineTokens = [];
      let width = 0;
      let maxSize = 0;

      const pushLine = () => {
        const hasNonSpace = lineTokens.some((t) => (t.text || '').trim().length > 0);
        if (hasNonSpace) lines.push({ tokens: lineTokens, maxSize });
        lineTokens = [];
        width = 0;
        maxSize = 0;
      };

      for (const token of tokens) {
        const f = pickFont(token, fonts);
        const size = token.fontSize;
        const tokenWidth = f.widthOfTextAtSize(token.text, size);

        // If token doesn't fit, break line (but avoid starting with whitespace)
        const wouldExceed = width + tokenWidth > maxWidth;
        if (wouldExceed && lineTokens.length > 0) {
          pushLine();
        }

        // Trim leading whitespace on a new line
        if (lineTokens.length === 0 && /^\s+$/.test(token.text)) {
          continue;
        }

        lineTokens.push({ ...token, font: f, width: tokenWidth });
        width += tokenWidth;
        maxSize = Math.max(maxSize, size);
      }
      if (lineTokens.length) pushLine();
      return lines;
    };

    const buildPdfBytes = async (input) => {
      const pdfDoc = await PDFDocument.create();
      const fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
      };

      const pageWidth = 595.28; // A4
      const pageHeight = 841.89;
      const marginX = 48;
      const marginTop = 56;
      const marginBottom = 56;
      const maxWidth = pageWidth - marginX * 2;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - marginTop;

      const ensureSpace = (needed) => {
        if (y - needed < marginBottom) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - marginTop;
        }
      };

      const drawLine = ({ text, size = 12, bold = false, gap = 4, align = 'left', startX = marginX, maxWidthOverride = null }) => {
        const f = bold ? fonts.bold : fonts.regular;
        const safe = sanitizeText(text);
        const available = maxWidthOverride ?? (pageWidth - startX - marginX);
        const measured = f.widthOfTextAtSize(safe, size);
        const x = align === 'center' ? startX + Math.max(0, (available - measured) / 2) : startX;

        ensureSpace(size + gap);
        y -= size;
        page.drawText(safe, {
          x,
          y,
          size,
          font: f,
          color: rgb(0, 0, 0),
        });
        y -= gap;
      };

      const drawStyledParagraph = ({ runs, defaultSize = 11, lineGap = 4, paragraphGap = 8 }) => {
        const tokens = tokenizeRuns(runs, defaultSize);
        const lines = layoutStyledTokens({ tokens, fonts, maxWidth });

        for (const line of lines) {
          const lineSize = line.maxSize || defaultSize;
          ensureSpace(lineSize + lineGap);
          y -= lineSize;

          let x = marginX;
          const underlineSegments = [];

          for (const t of line.tokens) {
            const txt = t.text;
            page.drawText(txt, {
              x,
              y,
              size: t.fontSize,
              font: t.font,
              color: rgb(0, 0, 0),
            });

            if (t.underline && txt.trim().length > 0) {
              underlineSegments.push({ x1: x, x2: x + t.width });
            }
            x += t.width;
          }

          if (underlineSegments.length) {
            const underlineY = y - 1.5;
            for (const seg of underlineSegments) {
              page.drawLine({
                start: { x: seg.x1, y: underlineY },
                end: { x: seg.x2, y: underlineY },
                thickness: 0.8,
                color: rgb(0, 0, 0),
              });
            }
          }

          y -= lineGap;
        }
        y -= paragraphGap;
      };

      const drawStyledParagraphAt = ({
        runs,
        defaultSize = 11,
        lineGap = 4,
        paragraphGap = 8,
        startX = marginX,
        maxWidthOverride = null,
        align = 'left',
      }) => {
        const tokens = tokenizeRuns(runs, defaultSize);
        const lines = layoutStyledTokens({ tokens, fonts, maxWidth: maxWidthOverride ?? maxWidth });

        for (const line of lines) {
          const lineSize = line.maxSize || defaultSize;
          ensureSpace(lineSize + lineGap);
          y -= lineSize;

          const available = maxWidthOverride ?? maxWidth;
          const lineWidth = (line.tokens || []).reduce((sum, t) => sum + (t.width || 0), 0);
          let x = align === 'center' ? startX + Math.max(0, (available - lineWidth) / 2) : startX;
          const underlineSegments = [];

          for (const t of line.tokens) {
            const txt = t.text;
            page.drawText(txt, {
              x,
              y,
              size: t.fontSize,
              font: t.font,
              color: rgb(0, 0, 0),
            });

            if (t.underline && txt.trim().length > 0) {
              underlineSegments.push({ x1: x, x2: x + t.width });
            }
            x += t.width;
          }

          if (underlineSegments.length) {
            const underlineY = y - 1.5;
            for (const seg of underlineSegments) {
              page.drawLine({
                start: { x: seg.x1, y: underlineY },
                end: { x: seg.x2, y: underlineY },
                thickness: 0.8,
                color: rgb(0, 0, 0),
              });
            }
          }

          y -= lineGap;
        }
        y -= paragraphGap;
      };

      const drawMultipleChoiceTwoColumns = ({ answers }) => {
        const list = Array.isArray(answers)
          ? answers.map((a) => sanitizeText(a)).filter((a) => (a || '').trim().length > 0)
          : [];
        if (list.length === 0) return;

        const gap = 18;
        const colWidth = (maxWidth - gap) / 2;
        // Center the whole 2-column block inside the text area.
        const blockWidth = colWidth * 2 + gap;
        const blockStartX = marginX + Math.max(0, (maxWidth - blockWidth) / 2);
        const leftX = blockStartX;
        const rightX = blockStartX + colWidth + gap;

        for (let i = 0; i < list.length; i += 2) {
          const left = list[i];
          const right = list[i + 1] ?? '';

          const leftTokens = tokenizeRuns(
            [{ text: sanitizeText(`[ ] ${left}`), bold: false, italic: false, underline: false, fontSize: 11 }],
            11
          );
          const rightTokens = right
            ? tokenizeRuns(
                [{ text: sanitizeText(`[ ] ${right}`), bold: false, italic: false, underline: false, fontSize: 11 }],
                11
              )
            : [];

          const leftLines = layoutStyledTokens({ tokens: leftTokens, fonts, maxWidth: colWidth });
          const rightLines = rightTokens.length
            ? layoutStyledTokens({ tokens: rightTokens, fonts, maxWidth: colWidth })
            : [];

          const maxLines = Math.max(leftLines.length, rightLines.length, 1);
          for (let li = 0; li < maxLines; li += 1) {
            const l = leftLines[li] ?? { tokens: [], maxSize: 11 };
            const r = rightLines[li] ?? { tokens: [], maxSize: 11 };
            const lineSize = Math.max(l.maxSize || 11, r.maxSize || 11, 11);

            ensureSpace(lineSize + 3);
            y -= lineSize;

            // left (center within its column)
            {
              const lineWidth = (l.tokens || []).reduce((sum, t) => sum + (t.width || 0), 0);
              let x = leftX + Math.max(0, (colWidth - lineWidth) / 2);
              for (const t of l.tokens) {
                page.drawText(t.text, { x, y, size: t.fontSize, font: t.font, color: rgb(0, 0, 0) });
                x += t.width;
              }
            }

            // right (center within its column)
            if (r.tokens.length > 0) {
              const lineWidth = (r.tokens || []).reduce((sum, t) => sum + (t.width || 0), 0);
              let x = rightX + Math.max(0, (colWidth - lineWidth) / 2);
              for (const t of r.tokens) {
                page.drawText(t.text, { x, y, size: t.fontSize, font: t.font, color: rgb(0, 0, 0) });
                x += t.width;
              }
            }

            y -= 3;
          }

          y -= 2;
        }
        y -= 4;
      };

      const resolveImage = async (src) => {
        const s = (src || '').toString();
        if (!s) return null;

        const isData = s.startsWith('data:');
        let blob;

        if (isData) {
          try {
            const res = await fetch(s);
            blob = await res.blob();
          } catch {
            return null;
          }
        } else {
          // Same-origin fetch only (others may fail due to CORS)
          try {
            const res = await fetch(s, { mode: 'cors' });
            if (!res.ok) return null;
            blob = await res.blob();
          } catch {
            return null;
          }
        }

        const mime = (blob.type || '').toLowerCase();
        if (!mime.includes('png') && !mime.includes('jpeg') && !mime.includes('jpg')) return null;

        const bytes = new Uint8Array(await blob.arrayBuffer());
        let embedded;
        try {
          embedded = mime.includes('png') ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        } catch {
          return null;
        }

        // Dimensions via browser image decode
        const dim = await new Promise((resolve) => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.src = url;
        });
        if (!dim || !dim.w || !dim.h) return null;

        return { embedded, width: dim.w, height: dim.h };
      };

      const drawImageBlock = async ({ src, alt }) => {
        const resolved = await resolveImage(src);
        if (!resolved) {
          drawLine({ text: alt ? `[Image: ${alt}]` : '[Image could not be loaded]', size: 11, bold: false, gap: 8 });
          return;
        }

        const { embedded, width: iw, height: ih } = resolved;
        const maxW = maxWidth;
        const availableH = Math.max(100, y - marginBottom - 10);

        let scale = maxW / iw;
        let dw = iw * scale;
        let dh = ih * scale;

        if (dh > availableH) {
          scale = availableH / ih;
          dw = iw * scale;
          dh = ih * scale;
        }

        ensureSpace(dh + 10);
        // recompute if a new page was created
        const availableH2 = Math.max(100, y - marginBottom - 10);
        if (dh > availableH2) {
          scale = availableH2 / ih;
          dw = iw * scale;
          dh = ih * scale;
        }

        y -= dh;
        page.drawImage(embedded, {
          x: marginX,
          y,
          width: dw,
          height: dh,
        });
        y -= 10;
      };

      // Content in insertion order (paragraphs + questions interleaved)
      const paragraphs = Array.isArray(input.paragraphs) ? input.paragraphs : [];
      const questions = Array.isArray(input.questions) ? input.questions : [];

      const orderedItems = [
        ...paragraphs.map((p) => ({ kind: 'paragraph', id: p?.id ?? 0, value: p })),
        ...questions.map((q) => ({ kind: 'question', id: q?.id ?? 0, value: q })),
      ]
        .filter((it) => it.value)
        .sort((a, b) => {
          const ai = Number(a.id) || 0;
          const bi = Number(b.id) || 0;
          if (ai === bi) return a.kind.localeCompare(b.kind);
          return ai - bi;
        });

      let questionCounter = 0;
      for (const item of orderedItems) {
        if (item.kind === 'paragraph') {
          const p = item.value;
          const title = sanitizeText((p?.title || '').trim());
          const blocks = htmlToBlocks(p?.html);

          if (title) {
            drawStyledParagraph({
              runs: [{ text: title, bold: true, italic: false, underline: false, fontSize: 12 }],
              defaultSize: 12,
              lineGap: 4,
              paragraphGap: 6,
            });
          }

          const bs = Array.isArray(blocks) ? blocks : [];
          // eslint-disable-next-line no-await-in-loop
          for (const b of bs) {
            if (b.type === 'paragraph') {
              drawStyledParagraph({ runs: b.runs, defaultSize: 11, lineGap: 4, paragraphGap: 6 });
            } else if (b.type === 'image') {
              // eslint-disable-next-line no-await-in-loop
              await drawImageBlock(b);
            }
          }
          continue;
        }

        // question
        const q = item.value;
        questionCounter += 1;

        const label = sanitizeText(`${questionCounter}. ${q?.content || ''}`.trim());
        drawStyledParagraphAt({
          runs: [{ text: label, bold: true, italic: false, underline: false, fontSize: 12 }],
          defaultSize: 12,
          lineGap: 4,
          paragraphGap: 6,
          align: 'center',
        });

        if (q?.questionType === 'multiple_choice') {
          drawMultipleChoiceTwoColumns({ answers: q.answers });
        } else if (q?.questionType === 'true_false') {
          drawLine({ text: '[ ] T      [ ] F', size: 11, bold: false, gap: 8, align: 'center', startX: marginX, maxWidthOverride: maxWidth });
        } else if (q?.questionType === 'short_answer') {
          // Draw a centered answer line
          const lineWidth = Math.min(maxWidth, 420);
          ensureSpace(16);
          const x1 = marginX + (maxWidth - lineWidth) / 2;
          const x2 = x1 + lineWidth;
          y -= 10;
          page.drawLine({
            start: { x: x1, y },
            end: { x: x2, y },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
          y -= 6;
        }

        y -= 12;
      }

      if (orderedItems.length === 0) {
        drawLine({ text: 'No content yet.', size: 12, bold: false, gap: 6 });
      }

      return pdfDoc.save();
    };

    const run = async () => {
      try {
        setCreatedPdfError('');
        setCreatedPdfNumPages(null);
        const bytes = await buildPdfBytes(createdPdfInput);
        if (cancelled) return;
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        lastUrl = url;
        setCreatedPdfUrl(url);
      } catch (err) {
        if (cancelled) return;
        const msg = err?.message ? `Could not build PDF preview: ${err.message}` : 'Could not build PDF preview.';
        setCreatedPdfError(msg);
        setCreatedPdfUrl('');
        setCreatedPdfNumPages(null);
      }
    };

    run();

    return () => {
      cancelled = true;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
    };
  }, [type, createdPdfKey]);

  useEffect(() => {
    if (type !== 'created') return;
    const el = createdPdfScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [type, createdPdfUrl]);

  useEffect(() => {
    if (type !== 'adapted') return;

    let lastBlobUrl = '';

    if (id === 'new') {
      const url = sessionStorage.getItem('adaptedPdfUrl') || '';
      const metaRaw = sessionStorage.getItem('adaptedPdfData') || '{}';
      let meta = {};
      try {
        meta = JSON.parse(metaRaw);
      } catch {
        meta = {};
      }

      if (!url) {
        setAdaptedPdfError('No adapted PDF found. Please regenerate it from the Adapt page.');
        setAdaptedPdfUrl('');
        setAdaptedPdfNumPages(null);
        return;
      }
      setAdaptedPdfError('');
      setAdaptedPdfUrl(url);
      setAdaptedPdfNumPages(null);
      lastBlobUrl = url;

      setIsShared(false);
      setFileData((prev) => ({
        ...prev,
        title: `${(meta.originalFileName || 'Adapted material').toString().replace(/\.pdf$/i, '')} - adapted`,
        subject: meta.subject || '',
        grade: meta.grade || 0,
        tag: Array.isArray(meta.dsa) ? meta.dsa.join(', ') : '',
        description: prev.description || '',
      }));
    }

    return () => {
      if (lastBlobUrl && lastBlobUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(lastBlobUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [type, id]);

  useEffect(() => {
    if (isDraftCreatedPreview) {
      setIsShared(false);
      setFileData((prev) => ({
        ...prev,
        tag: Array.isArray(draftWork?.dsaTypes) ? draftWork.dsaTypes.join(', ') : '',
      }));
      setIsDirtyLocal(false);
      return;
    }

    // adapted/new is sessionStorage-backed; do not fetch from API
    if (type === 'adapted' && id === 'new') {
      setIsShared(false);
      return;
    }

    if (!id) return;
    fetchFileData();
  }, [id, type, isDraftCreatedPreview]);

  useEffect(() => {
    if (type !== 'shared') return;

    const fallbackFile = '1_Anomaly_Segmentation.pdf';
    const rawTitle = (fileData.title || '').trim();

    const base = rawTitle.replace(/\.pdf$/i, '').trim();
    const candidates = [];
    if (base) {
      candidates.push(`${base}.pdf`);
      candidates.push(`${base.replace(/\s+/g, '_')}.pdf`);
      candidates.push(`${base.replace(/_/g, ' ')}.pdf`);
    }
    candidates.push(fallbackFile);

    const controller = new AbortController();
    let cancelled = false;

    const looksLikePdf = (res) => {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      return ct.includes('application/pdf');
    };

    const existsPdf = async (url) => {
      try {
        const head = await fetch(url, { method: 'HEAD', signal: controller.signal });
        if (head.ok && looksLikePdf(head)) return true;
        if (head.ok && !looksLikePdf(head)) return false;
      } catch {
        // ignore
      }

      try {
        const get = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          signal: controller.signal,
        });
        if ((get.status === 206 || get.status === 200) && looksLikePdf(get)) return true;
      } catch {
        // ignore
      }
      return false;
    };

    const resolve = async () => {
      for (const name of candidates) {
        const url = `/pdf/${encodeURIComponent(name)}`;
        const ok = await existsPdf(url);
        if (cancelled) return;
        if (ok) {
          setSharedPdfUrl(url);
          setSharedPdfError('');
          setSharedPdfNumPages(null);
          return;
        }
      }
      if (!cancelled) setSharedPdfUrl(`/pdf/${encodeURIComponent(fallbackFile)}`);
    };

    resolve();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [type, fileData.title]);

  useEffect(() => {
    if (type !== 'adapted') return;
    if (!id || id === 'new') return;

    const fallbackFile = '1_Anomaly_Segmentation.pdf';
    const rawTitle = (fileData.title || '').trim();

    const base = rawTitle.replace(/\.pdf$/i, '').trim();
    const candidates = [];
    if (base) {
      candidates.push(`${base}.pdf`);
      candidates.push(`${base.replace(/\s+/g, '_')}.pdf`);
      candidates.push(`${base.replace(/_/g, ' ')}.pdf`);
    }
    candidates.push(fallbackFile);

    const controller = new AbortController();
    let cancelled = false;

    const looksLikePdf = (res) => {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      return ct.includes('application/pdf');
    };

    const existsPdf = async (url) => {
      try {
        const head = await fetch(url, { method: 'HEAD', signal: controller.signal });
        if (head.ok && looksLikePdf(head)) return true;
        if (head.ok && !looksLikePdf(head)) return false;
      } catch {
        // ignore
      }

      try {
        const get = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          signal: controller.signal,
        });
        if ((get.status === 206 || get.status === 200) && looksLikePdf(get)) return true;
      } catch {
        // ignore
      }
      return false;
    };

    const resolve = async () => {
      setAdaptedPdfError('');
      setAdaptedPdfNumPages(null);

      for (const name of candidates) {
        const url = `/pdf/${encodeURIComponent(name)}`;
        const ok = await existsPdf(url);
        if (cancelled) return;
        if (ok) {
          setAdaptedPdfUrl(url);
          return;
        }
      }

      if (!cancelled) {
        setAdaptedPdfUrl(`/pdf/${encodeURIComponent(fallbackFile)}`);
      }
    };

    resolve();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [type, id, fileData.title]);

  useEffect(() => {
    if (type !== 'adapted') return;
    const el = adaptedPdfScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [type, adaptedPdfUrl]);

  useEffect(() => {
    if (type !== 'shared') return;
    const el = sharedPdfScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [type, sharedPdfUrl]);

  useEffect(() => {
    setIsDirty(!!isDirtyLocal);
    return () => {
      clearDirty();
    };
  }, [isDirtyLocal, setIsDirty, clearDirty]);

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
        setIsDirtyLocal(false);

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
      setIsDirtyLocal(true);
    }
  };

  const handleSave = async () => {
    try {
        const sharedValue = fileData.shared ? 1 : 0;
        const description = fileData.description || ' '; // Invia uno spazio se vuota

        await API.updateInfo(Number(id), fileData.title, description, fileData.subject, fileData.grade, sharedValue);
        alert('Modifiche salvate con successo!');
        setIsDirtyLocal(false);
        clearDirty();
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
    if (isDirtyLocal) {
      setIsBackConfirmOpen(true);
      return;
    }
    navigate(-1);
  };

  const renderContent = () => {
    if (isDraftCreatedPreview) {
      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{fileData.title || 'Untitled assignment'}</h3>

            <div className="preview-pdf-wrap">
              {createdPdfError && (
                <div className="preview-pdf-fallback">
                  <div>{createdPdfError}</div>
                </div>
              )}

              {!createdPdfError && !createdPdfUrl && (
                <div className="preview-pdf-loading">Building PDF…</div>
              )}

              {!createdPdfError && createdPdfUrl && (
                <Document
                  file={createdPdfUrl}
                  loading={<div className="preview-pdf-loading">Loading PDF…</div>}
                  error={(
                    <div className="preview-pdf-fallback">
                      <div>Could not render PDF preview.</div>
                    </div>
                  )}
                  onLoadSuccess={({ numPages }) => {
                    setCreatedPdfNumPages(numPages);
                    setCreatedPdfError('');
                  }}
                  onLoadError={(err) => {
                    setCreatedPdfNumPages(null);
                    setCreatedPdfError(err?.message ? `Could not render PDF preview: ${err.message}` : 'Could not render PDF preview.');
                  }}
                >
                  <div className="preview-pdf-pages" ref={createdPdfScrollRef}>
                    {Array.from({ length: createdPdfNumPages ?? 1 }, (_, idx) => (
                      <Page
                        key={`created-page-${idx + 1}`}
                        pageNumber={idx + 1}
                        renderMode="svg"
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={<div className="preview-pdf-loading">Loading page…</div>}
                        className="preview-pdf-page"
                      />
                    ))}
                  </div>
                </Document>
              )}
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
            <div className="preview-pdf-wrap">
              {createdPdfError && (
                <div className="preview-pdf-fallback">
                  <div>{createdPdfError}</div>
                </div>
              )}

              {!createdPdfError && !createdPdfUrl && (
                <div className="preview-pdf-loading">Building PDF…</div>
              )}

              {!createdPdfError && createdPdfUrl && (
                <Document
                  file={createdPdfUrl}
                  loading={<div className="preview-pdf-loading">Loading PDF…</div>}
                  error={(
                    <div className="preview-pdf-fallback">
                      <div>Could not render PDF preview.</div>
                    </div>
                  )}
                  onLoadSuccess={({ numPages }) => {
                    setCreatedPdfNumPages(numPages);
                    setCreatedPdfError('');
                  }}
                  onLoadError={(err) => {
                    setCreatedPdfNumPages(null);
                    setCreatedPdfError(err?.message ? `Could not render PDF preview: ${err.message}` : 'Could not render PDF preview.');
                  }}
                >
                  <div className="preview-pdf-pages" ref={createdPdfScrollRef}>
                    {Array.from({ length: createdPdfNumPages ?? 1 }, (_, idx) => (
                      <Page
                        key={`created-page-${idx + 1}`}
                        pageNumber={idx + 1}
                        renderMode="svg"
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={<div className="preview-pdf-loading">Loading page…</div>}
                        className="preview-pdf-page"
                      />
                    ))}
                  </div>
                </Document>
              )}
            </div>
          </div>
        </div>
      );
    } else if (type === 'adapted') {
      const baseTitle = (fileData.title || '').split(' - ')[0];
      const displayTitle = id === 'new'
        ? (fileData.title || 'Adapted material')
        : (formatPdfDisplayName(baseTitle) || baseTitle);

      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{displayTitle}</h3>

            <div className="preview-pdf-wrap">
              {adaptedPdfError && (
                <div className="preview-pdf-fallback">
                  <div>{adaptedPdfError}</div>
                </div>
              )}

              {!adaptedPdfError && !adaptedPdfUrl && (
                <div className="preview-pdf-loading">Loading PDF…</div>
              )}

              {!adaptedPdfError && adaptedPdfUrl && (
                <Document
                  file={adaptedPdfUrl}
                  loading={<div className="preview-pdf-loading">Loading PDF…</div>}
                  error={(
                    <div className="preview-pdf-fallback">
                      <div>Could not render PDF preview.</div>
                    </div>
                  )}
                  onLoadSuccess={({ numPages }) => {
                    setAdaptedPdfNumPages(numPages);
                    setAdaptedPdfError('');
                  }}
                  onLoadError={(err) => {
                    setAdaptedPdfNumPages(null);
                    setAdaptedPdfError(err?.message ? `Could not render PDF preview: ${err.message}` : 'Could not render PDF preview.');
                  }}
                >
                  <div className="preview-pdf-pages" ref={adaptedPdfScrollRef}>
                    {Array.from({ length: adaptedPdfNumPages ?? 1 }, (_, idx) => (
                      <Page
                        key={`adapted-page-${idx + 1}`}
                        pageNumber={idx + 1}
                        renderMode="svg"
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={<div className="preview-pdf-loading">Loading page…</div>}
                        className="preview-pdf-page"
                      />
                    ))}
                  </div>
                </Document>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // shared
      const pdfSrc = sharedPdfUrl;

      return (
        <div className="preview-content-area">
          <div className="preview-content-card">
            <h3>{sharedDisplayTitle || fileData.title}</h3>
            <div className="preview-pdf-wrap">
              {sharedPdfError && (
                <div className="preview-pdf-fallback">
                  <div>{sharedPdfError}</div>
                  <a href={sharedPdfUrl} target="_blank" rel="noreferrer">Open the PDF</a>
                </div>
              )}

              {!sharedPdfError && (
                <Document
                  file={pdfSrc}
                  loading={<div className="preview-pdf-loading">Loading PDF…</div>}
                  error={(
                    <div className="preview-pdf-fallback">
                      <div>Could not render PDF preview.</div>
                      <a href={sharedPdfUrl} target="_blank" rel="noreferrer">Open the PDF</a>
                    </div>
                  )}
                  onLoadSuccess={({ numPages }) => {
                    setSharedPdfNumPages(numPages);
                    setSharedPdfError('');
                  }}
                  onLoadError={(err) => {
                    setSharedPdfNumPages(null);
                    setSharedPdfError(err?.message ? `Could not render PDF preview: ${err.message}` : 'Could not render PDF preview.');
                  }}
                >
                  <div className="preview-pdf-pages" ref={sharedPdfScrollRef}>
                    {Array.from({ length: sharedPdfNumPages ?? 1 }, (_, idx) => (
                      <Page
                        key={`shared-page-${idx + 1}`}
                        pageNumber={idx + 1}
                        renderMode="svg"
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={<div className="preview-pdf-loading">Loading page…</div>}
                        className="preview-pdf-page"
                      />
                    ))}
                  </div>
                </Document>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  const renderInfoPanel = () => {
    if (isDraftCreatedPreview) {
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
            <div className="preview-info-value">{fileData.tag || '—'}</div>
          </div>
        </div>
      );
    }

    if (isShared) {
      return (
        <div className="preview-info-panel">
          <h2>Document Info</h2>
          
          <div className="preview-info-group">
            <label>Document Name:</label>
            <div className="preview-info-value">{sharedDisplayTitle || fileData.title}</div>
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
              onChange={(e) => handleInputChange('shared', e.target.checked)}
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
          message="You have unsaved changes. Are you sure you want to leave this page?"
          confirmText="Leave"
            cancelText="Stay"
            onCancel={() => setIsBackConfirmOpen(false)}
            onConfirm={() => {
                setIsBackConfirmOpen(false);
            setIsDirtyLocal(false);
            clearDirty();
                navigate(-1);
            }}
        />
      <header className="preview-header-left">
            <button
                type="button"
                className="preview-back-button"
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