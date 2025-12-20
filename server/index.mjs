import express from 'express';
import morgan from 'morgan';
import { 
  getMyWorkById,
  getAllMyWorks,
  createPDF,
  updateInfo,
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
    const result = await updateInfo(id, NamePDF, Description, Subject, Grade, sharedValue);    

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
      const deleteContentResult = await deleteAllContentPDF(id);
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



// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
