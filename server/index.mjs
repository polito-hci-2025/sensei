import express from 'express';
import morgan from 'morgan';
import { 
  getMyWorkById,
  getAllMyWorks,
  createPDF,
  updateInfo,
  updateMyWorkName,
  deleteMyWork,
  getAllSharedWorks,
  getSharedWorkById,
  download,
  getContentById,
  createContentPDF,
  updateContentPDF,
  deleteAllContentPDF,
  deleteContentPDF
} from './dao.mjs';
import cors from 'cors';
import { check, validationResult } from 'express-validator';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit'; 
import { fileURLToPath } from 'url';
import { createRequire } from 'module';               
const require = createRequire(import.meta.url);

// pdf-parse v2+ exports a PDFParse class (not a callable function)
const pdfParseModule = require('pdf-parse');
const parsePdfText = async (buffer) => {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // Backward compatibility (older versions exported a function)
  if (typeof pdfParseModule === 'function') {
    return await pdfParseModule(data);
  }

  const PDFParse = pdfParseModule?.PDFParse;
  if (typeof PDFParse !== 'function') {
    throw new Error('pdf-parse: unsupported export shape (missing PDFParse)');
  }

  const parser = new PDFParse({ data });
  await parser.load();
  return await parser.getText();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// init express
const app = new express();
const port = 3001;

app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin / curl / Postman
    if (!origin) return callback(null, true);

    // Allow Vite dev server ports (5173, 5174, ...)
    const isViteLocalhost = /^http:\/\/localhost:517\d$/.test(origin);
    if (isViteLocalhost) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  optionsSuccessState: 200,
  credentials: true,
};

app.use(cors(corsOptions));

const upload = multer({ storage: multer.memoryStorage() });

const sanitizePdfBaseName = (value) => {
  const raw = (value ?? '').toString();
  const base = raw.replace(/\.pdf$/i, '');
  const safe = base
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
  return safe || 'document';
};

const normalizeName = (name) => {
  return (name || '')
    .toString()
    .replace(/\.pdf$/i, '')
    .replace(/[_\s]/g, '')
    .toLowerCase();
};

const pickUniquePdfFileName = (pdfDir, desiredFileName, { allowOverwriteNormalized } = {}) => {
  const desired = (desiredFileName || '').toString();
  const base = desired.replace(/\.pdf$/i, '').trim() || 'document';
  const desiredNorm = normalizeName(base);

  const exists = (fileName) => fs.existsSync(path.join(pdfDir, fileName));
  const allowOverwrite = allowOverwriteNormalized && normalizeName(allowOverwriteNormalized) === desiredNorm;

  const first = `${base}.pdf`;
  if (!exists(first) || allowOverwrite) return first;

  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}_${i}.pdf`;
    if (!exists(candidate)) return candidate;
  }
  // Fallback (extremely unlikely)
  const stamp = Date.now();
  return `${base}_${stamp}.pdf`;
};

// Basic word list to bold. You can pass a custom list from the client.
const DEFAULT_BOLD_WORDS = ['importante', 'definizione', 'esercizio', 'attenzione', 'nota'];

// === Aggiunte: util per accorciare il testo ===
const STOPWORDS = new Set([
  // IT
  'di','a','da','in','con','su','per','tra','fra','il','lo','la','i','gli','le','un','uno','una','e','o','che','del','della','dei','delle','degli','dell','al','alla','agli','alle','ai',
  // EN
  'the','a','an','and','or','of','to','in','on','for','with','by','from','is','are','was','were','be','as','at','it','this','that'
]);

const splitSentences = (t) =>
  (t || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[\.\!\?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

const tokenize = (s) => s.toLowerCase().match(/[a-zà-ù’']+|\d+/gi) || [];

const scoreSentences = (sentences, keywords = []) => {
  const kw = new Set((keywords || []).map(k => String(k).toLowerCase()));
  const freq = new Map();
  for (const s of sentences) {
    for (const w of tokenize(s)) {
      if (STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return sentences.map((s, idx) => {
    let score = 0;
    for (const w of tokenize(s)) {
      if (STOPWORDS.has(w)) continue;
      score += (freq.get(w) || 0);
      if (kw.has(w)) score += 3; // boost parole chiave
    }
    return { idx, s, score };
  });
};

const shortenText = (text, ratio = 0.5, keywords = []) => {
  const sents = splitSentences(text);
  if (sents.length <= 2) return text;
  const target = Math.max(2, Math.round(sents.length * Math.max(0.1, Math.min(1, ratio))));
  const top = scoreSentences(sents, keywords)
    .sort((a, b) => b.score - a.score)
    .slice(0, target)
    .sort((a, b) => a.idx - b.idx);
  return top.map(x => x.s).join(' ');
};
// === fine aggiunte ===

// Sanifica testo quando il font non ha i glyph richiesti
const sanitizeText = (t) =>
  t
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '?');

const safeWidthOf = (font, t, fontSize) => {
  try { return font.widthOfTextAtSize(t, fontSize); }
  catch { return font.widthOfTextAtSize(sanitizeText(t), fontSize); }
};

// wrapText aggiornato per usare safeWidthOf
const wrapText = (font, text, fontSize, maxWidth) => {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  const widthOf = (t) => safeWidthOf(font, t, fontSize);

  for (const w of words) {
    const testLine = currentLine ? `${currentLine} ${w}` : w;
    if (widthOf(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = w;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

//GET /api/myworks/:id
app.get('/api/myworks/:id', async (req, res)=>{
  try{
    const id = parseInt(req.params.id);
    const work = await getMyWorkById(id);

    if (work) {
      res.json(work);
    } else {
      res.status(404).json({error: 'Pdf non trovato'});
    }
  }catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.get('/api/myworks', async (req, res)=>{
  try{
    const work = await getAllMyWorks();
    res.json(work);
  }catch (error) {
    res.status(500).json({error: error.message});
  }
});

//POST /api/myworks/create
app.post('/api/myworks/create', [
  check('NamePDF').notEmpty().withMessage('NamePDF is mandatory'),
  check('Subject').notEmpty().withMessage('Subject is mandatory'),
  check('Grade').notEmpty().withMessage('Grade is mandatory'),
  check('Shared').isNumeric().withMessage('Shared must be numeric'),
  check('Type').notEmpty().withMessage('Type is mandatory')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  
  try {
    const { NamePDF, Subject, Grade, Tag, Description, Shared, Download, Prof, Type } = req.body;
    const newWork = {NamePDF, Subject, Grade, Tag, Description, Shared, Download, Prof, Type};
    const createdPDF = await createPDF(newWork);
    res.status(201).json(createdPDF);

  } catch (error) {
    console.error('Error creating PDF:', error);
    res.status(500).json({error: 'Error creating PDF', details: error.message});
  }
});

//aggiorna info di un mywork
//PUT /api/myworks/:id/edit
app.put('/api/myworks/:id/edit', [
  check('NamePDF').notEmpty().withMessage('NamePDF is mandatory'),
  check('Description').notEmpty().withMessage('Description is mandatory'),
  check('Subject').notEmpty().withMessage('Subject is mandatory'),
  check('Grade').notEmpty().withMessage('Grade is mandatory'),
  check('Shared').isNumeric().withMessage('Shared must be numeric')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {  
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const id = parseInt(req.params.id);
    const { NamePDF, Description, Subject, Grade, Shared } = req.body;
    const sharedValue = Number(Shared);

    const oldPdf = await getMyWorkById(id);
    if(!oldPdf || oldPdf.error){
      return res.status(404).json({error: 'Compito non trovato'});
    }
    // Rename physical file in /public/myworks when the title changes.
    // This keeps the file system consistent with the DB record.
    const myworksDir = path.resolve(__dirname, '../client/public/myworks');
    const legacyMyworkDir = path.resolve(__dirname, '../client/public/mywork');
    const legacyPdfDir = path.resolve(__dirname, '../client/public/pdf');

    if (!fs.existsSync(myworksDir)) {
      fs.mkdirSync(myworksDir, { recursive: true });
    }

    const oldBase = sanitizePdfBaseName(oldPdf.NamePDF);
    const newBaseRequested = sanitizePdfBaseName(NamePDF);

    let finalBaseForDb = newBaseRequested;

    // If the name changes, try renaming the physical file.
    if (normalizeName(oldBase) !== normalizeName(newBaseRequested)) {
      try {
        const dirsToSearch = [myworksDir, legacyMyworkDir, legacyPdfDir].filter((d) => fs.existsSync(d));
        let found = null;

        for (const dir of dirsToSearch) {
          const files = fs.readdirSync(dir);
          const matchingOld = files.find((file) => normalizeName(file) === normalizeName(oldBase));
          if (matchingOld) {
            found = { dir, file: matchingOld };
            break;
          }
        }

        if (found) {
          const desiredFileName = `${newBaseRequested}.pdf`;
          const finalFileName = pickUniquePdfFileName(myworksDir, desiredFileName);
          const fromPath = path.join(found.dir, found.file);
          const toPath = path.join(myworksDir, finalFileName);
          fs.renameSync(fromPath, toPath);
          finalBaseForDb = finalFileName.replace(/\.pdf$/i, '');
        }
      } catch {
        // If rename fails, keep going; DB update will still happen.
      }
    }

    const result = await updateInfo(id, finalBaseForDb, Description, Subject, Grade, sharedValue);
    // Ensure DB is aligned even if the rename logic had to pick a unique suffix.
    if (finalBaseForDb && finalBaseForDb !== NamePDF) {
      try {
        await updateMyWorkName(id, finalBaseForDb);
      } catch {
        // ignore
      }
    }

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({error: result.error});
    }
  } catch (error) {
    console.error('Error updating mywork:', error);
    res.status(503).json({error: error.message});
  }
});

app.delete('/api/myworks/:id/delete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const oldPdf = await getMyWorkById(id);
    if(!oldPdf || oldPdf.error){
      return res.status(404).json({error: 'Compito non trovato'});
    } 
    const result = await deleteMyWork(id);

    if(oldPdf.Type === 'created'){
      await deleteAllContentPDF(id);
    }
    
    // Cancella il file PDF fisico
    try {
      const myworksDir = path.resolve(__dirname, '../client/public/myworks');
      const legacyMyworkDir = path.resolve(__dirname, '../client/public/mywork');
      const legacyPdfDir = path.resolve(__dirname, '../client/public/pdf');

      const normalizedDbName = normalizeName(oldPdf.NamePDF);
      const dirsToSearch = [myworksDir, legacyMyworkDir, legacyPdfDir].filter((d) => fs.existsSync(d));

      for (const dir of dirsToSearch) {
        const files = fs.readdirSync(dir);
        const matchingFile = files.find((file) => normalizeName(file) === normalizedDbName);
        if (matchingFile) {
          const filePath = path.join(dir, matchingFile);
          fs.unlinkSync(filePath);
          break;
        }
      }
    } catch (fileError) {
      console.error('Error deleting PDF file:', fileError);
      // Non bloccare la risposta se la cancellazione del file fallisce
    }

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({error: result.error});
    }
  } catch (error) {
    res.status(503).end();
  }
});


      ////////////
      //SHARED//
      ////////////

//get all shared works
//GET /api/sharedworks
app.get('/api/sharedworks', async (req, res)=>{
  try {
    const sharedworks = await getAllSharedWorks(); 
    res.json(sharedworks);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//get shared work by id
//GET /api/sharedworks/:id_sharedwork
app.get('/api/sharedworks/:id_sharedwork', async (req, res) => {
  try {
    const id = parseInt(req.params.id_sharedwork);
    const result = await getSharedWorkById(id); 

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({error: 'Studente non trovato'});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//update download count of a shared work
//PUT /api/sharedworks/:id_sharedwork/download
app.put('/api/sharedworks/:id_sharedwork/download', async (req, res) => {
  try {
    const id = parseInt(req.params.id_sharedwork);
    const result = await download(id);
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({error: 'shared work non trovato'});
    }
  }
  catch (error) {
    res.status(500).json({error: error.message});
  }
});

      //////////////
      //CTREATEPDF//
      //////////////

//get all content by id
app.get('/api/createpdf/:id_pdf/content', async (req, res)=>{
  try{
    const id_pdf = parseInt(req.params.id_pdf);
    const content = await getContentById(id_pdf);
    res.json(content);
  }catch (error) {
    res.status(500).json({error: error.message});
  }
});

//get specific content by id
//Get /api/createpdf/:id/content
app.get('/api/createpdf/:id_pdf/content/:id_content', async (req, res)=>{
  try{
    const id_pdf = parseInt(req.params.id_pdf);
    const id_content = parseInt(req.params.id_content);
    const contents = await getContentById(id_pdf);
    const content = contents.find(c => c.ID === id_content);
    if(content){
      res.json(content);
    }else{
      res.status(404).json({error: 'Content not found'});
    }
  }
  catch (error) {
    res.status(500).json({error: error.message});
  }
});


//create new content for a pdf
app.post('/api/createpdf/:id_pdf/content', [
  check('type').notEmpty().withMessage('Type is mandatory'),
  check('content').notEmpty().withMessage('Content is mandatory')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }   
  try {
    const id_pdf = parseInt(req.params.id_pdf);
    const { type, content, answers } = req.body;
    const createdContent = await createContentPDF(id_pdf, content, type, answers || null);
    res.status(201).json(createdContent);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({error: 'Error creating content', details: error.message});
  }
});


//update content for a pdf
app.put('/api/createpdf/:id_pdf/content/:id_content/edit', [
  check('type').notEmpty().withMessage('Type is mandatory'),
  check('content').notEmpty().withMessage('Content is mandatory')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }   
  try {
    const id_content = parseInt(req.params.id_content);
    const { type, content, answers } = req.body;
    const result = await updateContentPDF(id_content, content, type, answers || null);
    if (result) {
      res.json(result);
    }
    else {
      res.status(404).json({error: 'Content not found'});
    }
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({error: 'Error updating content', details: error.message});
  }
});
//delete all content for a pdf
app.delete('/api/createpdf/:id_pdf/content/delete', async (req, res) => {
  try {
    const id_pdf = parseInt(req.params.id_pdf);
    const result = await deleteAllContentPDF(id_pdf);
    if (result) {
      res.json(result);
    }
    else {
      res.status(404).json({error: 'Content not found'});
    }
  } catch (error) {
    res.status(500).json({error: 'Error deleting content'});
  }
});
//delete specific content for a pdf
app.delete('/api/createpdf/:id_pdf/content/:id_content/delete', async (req, res) => {
  try {
    const id_content = parseInt(req.params.id_content);
    const result = await deleteContentPDF(id_content);
    if (result) {
      res.json(result);
    }
    else {
      res.status(404).json({error: 'Content not found'});
    }
  } catch (error) {
    res.status(500).json({error: 'Error deleting content'});
  }
});


// POST /api/adapt/generate
const dbg = (...args) => console.log('[adapt]', ...args);

//POST /api/adapt/generate
app.post('/api/adapt/generate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing file' });
    }
    if (!/pdf$/i.test(req.file.mimetype) && !/\.pdf$/i.test(req.file.originalname)) {
      return res.status(400).json({ error: 'Only PDF files are accepted' });
    }

    const dsaRaw = req.body?.dsa;
    const subject = req.body?.subject ?? '';
    const grade = req.body?.grade ?? '';
    const boldWordsRaw = req.body?.boldWords;
    const colorsRaw = req.body?.keywordColors;                         // { parola: "#RRGGBB" }
    const dsa = Array.isArray(dsaRaw) ? dsaRaw : (() => {
      try { const v = JSON.parse(dsaRaw ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
    })();

    const boldWords = (() => {
      if (Array.isArray(boldWordsRaw)) return boldWordsRaw;
      try { const v = JSON.parse(boldWordsRaw ?? '[]'); return Array.isArray(v) ? v : DEFAULT_BOLD_WORDS; } catch { return DEFAULT_BOLD_WORDS; }
    })();
    const keywordColors = (() => {
      try { const v = JSON.parse(colorsRaw ?? '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
    })();

    // Estrai testo dal PDF caricato
    const parsed = await parsePdfText(req.file.buffer);
    const originalText = (parsed?.text ?? '').trim() || 'Nessun testo estratto dal PDF.';

    // Preferenze (tema e accorciamento)
    const themePref = String(req.query?.theme || 'default').toLowerCase();
    const shortenPct = Number(req.body?.shorten || 0);

    // Accorcia testo
    const textForLayout = shortenPct > 0
      ? shortenText(originalText, Math.max(0.1, Math.min(1, shortenPct/100)), boldWords)
      : originalText;

    // Inizializza tema colore (PRIMA di usarlo)
    const theme = pickTheme(themePref);
    const colorText = hexToRgb(theme.text);
    const colorAccent = hexToRgb(theme.accent);
    const colorAccentLight = hexToRgb(theme.lightAccent);
    const colorNoteBg = hexToRgb(theme.noteBg);
    const colorWarnBg = hexToRgb(theme.warnBg);

    // Font dir
    const fontsDir = path.resolve(__dirname, 'fonts');
    dbg('fontsDir:', fontsDir);
    dbg('fontsInDir:', fs.existsSync(fontsDir) ? fs.readdirSync(fontsDir) : 'missing');

    const tryEmbedFont = async (pdfDoc, candidates) => {
      for (const fname of candidates) {
        const p = path.join(fontsDir, fname);
        dbg('test font:', fname, 'exists:', fs.existsSync(p));
        if (!fs.existsSync(p)) continue;
        try {
          const bytes = fs.readFileSync(p);
          const font = await pdfDoc.embedFont(bytes);
          dbg('embedded:', fname);
          return { font, name: fname };
        } catch (e) {
          dbg('embed failed:', fname, e.message);
        }
      }
      return null;
    };

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // SOLO Comic Sans → fallback Helvetica
    const reg = await tryEmbedFont(pdfDoc, ['ComicSansMS.ttf']);
    const bold = await tryEmbedFont(pdfDoc, ['ComicSansMSBold.ttf']);

    const regularFont = reg?.font || await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const boldFont = bold?.font || await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);
    console.log('Adapt fonts:', { regular: reg?.name || 'Helvetica', bold: bold?.name || 'Helvetica-Bold' });

    {
      const fontSize = 15;
      const margin = 64;
      const lineGap = 9;
      const paraGap = 12;
      const pageWidth = 595, pageHeight = 842;
      const maxWidth = Math.min(pageWidth - margin * 2, 430);
      const spaceExtra = 0;

      const paragraphs = textForLayout.split(/\n{2,}|\r{2,}/).map(p => p.trim()).filter(Boolean);
      const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / (fontSize + lineGap));

      let currentPage = null, y = 0, linesOnPage = 0;



      const ensurePage = () => {
        if (!currentPage) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

            currentPage.drawRectangle({ x: 0, y: pageHeight - 28, width: pageWidth, height: 28, color: colorAccentLight, opacity: 0.4 });
            currentPage.drawText('Materiale Adattato', { x: margin, y: pageHeight - 22, size: 11, font: boldFont, color: colorAccent });
            currentPage.drawRectangle({ x: margin - 16, y: 48, width: 4, height: pageHeight - 96, color: colorAccent, opacity: 0.25 });

          y = pageHeight - margin;
          linesOnPage = 0;
        }
      };

      // titoli: brevi, con due punti o in Maiuscoletto
      const isHeading = (t) => {
        const s = t.split(/\n/)[0].trim();
        const fewWords = s.split(/\s+/).length <= 8;
        const short = s.length <= 60;
        const looksTitle = /[:：]$/.test(s) || /^[A-ZÀ-Ù0-9][^.!?]{0,60}$/.test(s);
        return short && fewWords && looksTitle;
      };

      const drawHeading = (text) => {
        const title = text.replace(/[:：]\s*$/, '');
        const size = fontSize + 3;
        const w = safeWidthOf(boldFont, title, size);
        if (y - (size + 6) < 48) { currentPage = null; ensurePage(); }
        currentPage.drawText(title, { x: margin, y, size, font: boldFont, color: colorAccent });
        currentPage.drawLine({
          start: { x: margin, y: y - 3 },
          end: { x: Math.min(margin + w, margin + maxWidth), y: y - 3 },
          thickness: 1.2,
          color: colorAccent
        });
        y -= size + Math.max(6, lineGap - 2);
        linesOnPage += 1;
      };

      for (const originalP of paragraphs) {
        ensurePage();
        let p = originalP;

        const lowerP = p.toLowerCase();
        let blockBg = null;
        if (lowerP.startsWith('attenzione') || lowerP.startsWith('nota')) blockBg = colorWarnBg;
        if (lowerP.startsWith('definizione') || lowerP.startsWith('esempio')) blockBg = colorNoteBg;

        if (isHeading(p)) {
          drawHeading(p.split(/\n/)[0]);
          const rest = p.replace(/^[^\n]+/, '').trim();
          if (!rest) { y -= paraGap / 2; continue; }
          p = rest;
        }

        const lines = wrapText(regularFont, p, fontSize, maxWidth);

        if (blockBg) {
          const blockHeight = lines.length * (fontSize + lineGap) - lineGap + 24; // padding
          if (y - blockHeight < 48) { currentPage = null; ensurePage(); }
          const rectY = y - blockHeight + 12;
          currentPage.drawRectangle({
            x: margin - 10, y: rectY, width: maxWidth + 20, height: blockHeight,
            color: blockBg, opacity: 0.35
          });
          currentPage.drawRectangle({
            x: margin - 10, y: rectY, width: 3, height: blockHeight, color: colorAccent, opacity: 0.75
          });
        }

        for (const line of lines) {
          ensurePage();
          if (linesOnPage >= maxLinesPerPage || y - (fontSize + lineGap) < 48) {
            currentPage = null; ensurePage();
          }

          const containsKw = boldWords.some(w => w && line.toLowerCase().includes(w.toLowerCase()));
          if (containsKw) {
            currentPage.drawRectangle({
              x: margin - 2, y: y - fontSize * 0.25,
              width: maxWidth + 4, height: fontSize * 1.2,
              color: colorAccentLight, opacity: 0.35
            });
          }

          const bullet = line.match(/^(\s*[-*•]\s+)(.*)$/);
          let x = margin;
          let content = line;

          if (bullet) {
            currentPage.drawCircle({ x: margin - 6, y: y + fontSize * 0.35, size: 1.5, color: colorAccent });
            content = bullet[2];
          }

          const tokens = content.split(/(\s+)/);
          for (const t of tokens) {
            const raw = t;
            const isSpace = /^\s+$/.test(raw);
            const norm = raw.toLowerCase().replace(/[.,;:!?()"']/g, '');
            const isBold = boldWords.includes(norm);

            const font = isBold ? boldFont : regularFont;
            const color = isBold ? colorAccent : colorText;

            let drawText = raw;
            try {
              currentPage.drawText(drawText, { x, y, size: fontSize, font, color });
            } catch {
              drawText = sanitizeText(raw);
              currentPage.drawText(drawText, { x, y, size: fontSize, font, color });
            }

            const w = safeWidthOf(font, raw, fontSize);
            if (isBold && !isSpace) {
              currentPage.drawLine({
                start: { x, y: y - 2 },
                end: { x: x + w, y: y - 2 },
                thickness: 0.9,
                color: colorAccent
              });
            }

            x += w;
            if (isSpace) x += spaceExtra;
          }

          y -= fontSize + lineGap;
          linesOnPage += 1;
        }

        y -= paraGap;
      }
    }

    const outBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="adapted.pdf"');
    return res.status(200).send(Buffer.from(outBytes));
  } catch (error) {
    console.error('Adapt error:', error);
    return res.status(500).json({ error: 'Failed to adapt PDF', details: error.message });
  }
});

// POST /api/pdf/save - Salva PDF (created o adapted) su disco e database
app.post('/api/pdf/save', upload.single('file'), [
  check('NamePDF').notEmpty().withMessage('NamePDF is mandatory'),
  check('Subject').notEmpty().withMessage('Subject is mandatory'),
  check('Grade').notEmpty().withMessage('Grade is mandatory'),
  check('Shared').isNumeric().withMessage('Shared must be numeric'),
  check('Type').isIn(['created', 'adapted']).withMessage('Type must be created or adapted')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing PDF file' });
    }

    const { NamePDF, Subject, Grade, Tag, Description, Shared, Type } = req.body;
    
    // Salva il file PDF nella cartella public/myworks
    const pdfDir = path.resolve(__dirname, '../client/public/myworks');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const safeBaseName = sanitizePdfBaseName(NamePDF);
    const safeFileName = pickUniquePdfFileName(pdfDir, `${safeBaseName}.pdf`);
    const filePath = path.join(pdfDir, safeFileName);
    
    // Scrivi il file sul disco
    fs.writeFileSync(filePath, req.file.buffer);

    // Salva i metadati nel database
    const newWork = {
      NamePDF: safeFileName,
      Subject,
      Grade: Number(Grade),
      Tag: Tag || '',
      Description: Description || '',
      Shared: Number(Shared),
      Download: 0,
      Prof: 'prof. Rossi',
      Type: Type // 'created' o 'adapted'
    };

    const created = await createPDF(newWork);
    
    res.status(201).json({ 
      ...created, 
      message: 'PDF saved successfully',
      fileName: safeFileName 
    });

  } catch (error) {
    console.error('Error saving PDF:', error);
    res.status(500).json({ 
      error: 'Error saving PDF', 
      details: error.message 
    });
  }
});

// POST /api/pdf/save-file - Salva SOLO il file PDF fisico (per created)
app.post('/api/pdf/save-file', upload.single('file'), async (req, res) => {
  try {
    const { fileName, oldFileName, idPdf } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Missing PDF file' });
    }
    
    // Salva il file PDF nella cartella public/myworks
    const pdfDir = path.resolve(__dirname, '../client/public/myworks');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const requestedBase = sanitizePdfBaseName(fileName);
    const requestedFileName = `${requestedBase}.pdf`;

    let allowOverwriteNormalized = undefined;

    // If this is an update (oldFileName provided), allow overwriting the same underlying file.
    if (oldFileName) {
      allowOverwriteNormalized = oldFileName;

      const normalizedOldName = normalizeName(oldFileName);
      const normalizedNewName = normalizeName(requestedBase);

      // If user is changing the name, delete the old file (if present) to avoid orphan files.
      if (normalizedOldName && normalizedOldName !== normalizedNewName) {
        const files = fs.readdirSync(pdfDir);
        const matchingFile = files.find((file) => normalizeName(file) === normalizedOldName);
        if (matchingFile) {
          const oldFilePath = path.join(pdfDir, matchingFile);
          try {
            fs.unlinkSync(oldFilePath);
          } catch {
            // ignore
          }
        }
      }
    }

    const finalFileName = pickUniquePdfFileName(pdfDir, requestedFileName, { allowOverwriteNormalized });
    const filePath = path.join(pdfDir, finalFileName);
    
    // Scrivi il file sul disco
    fs.writeFileSync(filePath, req.file.buffer);

    // Keep DB consistent when we had to adjust the filename to avoid collisions.
    const parsedId = Number(idPdf);
    const finalBaseName = finalFileName.replace(/\.pdf$/i, '');
    if (Number.isFinite(parsedId) && parsedId > 0) {
      try {
        await updateMyWorkName(parsedId, finalBaseName);
      } catch {
        // ignore DB update errors; file is still saved
      }
    }
    
    res.status(200).json({ 
      message: 'PDF file saved successfully',
      fileName: finalFileName,
      baseName: finalBaseName
    });

  } catch (error) {
    console.error('Error saving PDF file:', error);
    res.status(500).json({ 
      error: 'Error saving PDF file', 
      details: error.message 
    });
  }
});


const THEMES = {
  default: {
    accent: '#3F51B5',      // blu
    lightAccent: '#C5CAE9', // blu chiaro
    noteBg: '#FFF9C4',      // giallo chiaro
    warnBg: '#FFCDD2',      // rosso chiaro
    text: '#1A1A1A'
  },
  teal: {
    accent: '#00897B',
    lightAccent: '#B2DFDB',
    noteBg: '#E0F2F1',
    warnBg: '#FFECB3',
    text: '#102A27'
  },
  orange: {
    accent: '#FB8C00',
    lightAccent: '#FFE0B2',
    noteBg: '#FFF3E0',
    warnBg: '#FFCDD2',
    text: '#2A1905'
  },
  green: {
    accent: '#2E7D32',
    lightAccent: '#C8E6C9',
    noteBg: '#E8F5E9',
    warnBg: '#FFF59D',
    text: '#0B1F0C'
  }
};

const pickTheme = (name) => {
  const key = String(name || 'default').toLowerCase();
  return THEMES[key] || THEMES.default;
};

// HEX -> rgb()
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return rgb(1,1,0);
  return rgb(parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255);
}

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});