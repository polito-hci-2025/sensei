import express from 'express';
import morgan from 'morgan';
import { getCompitiByIdInsegnante, 
  getCompitoById, 
  getCompitiByIdStudente,
  getStudenteById, 
  creaCompito, 
  updateVotoCompito, 
  updateRispostaCompito,
  getListaStudenti,
  verificaCoppia,
  getUser,
  getGruppiByCompito,
  creaGruppo,
  getStatoClasse } from './dao.mjs';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { check, validationResult } from 'express-validator';
import { MyWork } from './models.mjs';

// init express
const app = new express();
const port = 3001;

app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};

app.use(cors(corsOptions));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if(!user)
    return cb(null, false, 'Username o password errati');
    
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

//GET /api/compiti/:id
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

//PUT /api/myworks/create
app.put('/api/myworks/create', [
  check('title').notEmpty().withMessage('Title is mandatory'),
  check('subject').notEmpty().withMessage('Subject is mandatory'),
  check('grade').notEmpty().withMessage('Grade is mandatory'),
  check('shared').isNumeric().withMessage('Shared must be numeric'),
  check('type').notEmpty().withMessage('Type is mandatory')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  
  try {
    const { title, subject, grade, tag, description, shared, download, prof, type } = req.body;
    const newWork = MyWork(null, title, subject, grade, tag, description, shared, download, prof, type);
    const createdPDF = await createPDF(newWork);
    res.status(201).json(createdPDF);

  } catch (error) {
    res.status(500).json({error: 'Error creating PDF'});
  }
});

//aggiorna voto del compito
//PUT /api/compiti/:id_compito/voto
app.put('/api/myworks/:id/edit', [
  check('title').notEmpty().withMessage('Title is mandatory'),
  check('description').notEmpty().withMessage('Description is mandatory'),
  check('subject').notEmpty().withMessage('Subject is mandatory'),
  check('grade').notEmpty().withMessage('Grade is mandatory'),
  check('shared').isNumeric().withMessage('Shared must be numeric')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {  
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const id = parseInt(req.params.id);
    const { title, description, subject, grade, shared } = req.body;

    const oldPdf = await getMyWorkById(id);
    if(!oldPdf || oldPdf.error){
      return res.status(404).json({error: 'Compito non trovato'});
    }
    const result = await updateInfo(id, title, description, subject, grade, shared);

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({error: result.error});
    }
  } catch (error) {
    res.status(503).end();
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
      //STUDENTI//
      ////////////

//restituisce l'elenco degli studenti
//GET /api/studenti
app.get('/api/studenti', isLoggedIn, isProfessore, async (req, res)=>{
  try {
    const studenti = await getListaStudenti(); 
    res.json(studenti);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//restituisce uno studente in base al suo id
//GET /api/studenti/:id_studente
app.get('/api/studenti/:id_studente', isLoggedIn, async (req, res) => {
  try {
    const id = parseInt(req.params.id_studente);
    const result = await getStudenteById(id); 

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({error: 'Studente non trovato'});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//restituisce i compiti di uno studente in base al suo id
//GET /api/studenti/:id_studente/compiti
app.get('/api/studenti/:id_studente/compiti', isLoggedIn,  async (req, res) =>{
   const id_studente = parseInt(req.params.id_studente);

    if (req.user.ruolo === 'studente') {
      if (req.user.id_utente !== id_studente) {
        return res.status(403).json({error: 'Non autorizzato'});
      }
    } 
  
  try {
    
    const compiti = await getCompitiByIdStudente(id_studente); 
    if(req.user.ruolo === 'professore') {
      compiti.filter(c => c.id_prof === req.user.id_utente);
    }

      res.json(compiti);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

      //////////////
      //PROFESSORI//
      //////////////

//restituisce i compiti di un professore in base al suo id
//GET /api/professori/:id_prof/compiti
app.get('/api/professori/:id_prof/compiti', isLoggedIn, isProfessore, async (req, res) => {
  try {
    const id = parseInt(req.params.id_prof);

     if (req.user.id_utente !== id) {
      return res.status(403).json({error: 'Non autorizzato ad accedere ai dati di questo professore'});
    }

    const compiti = await getCompitiByIdInsegnante(id);

    if (compiti.length > 0) {
      res.json(compiti);
    } else {
      res.status(404).json({error: 'Nessun compito trovato per questo professore'});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//restituisce lo stato della classe per un professore
//GET /api/professori/:id_prof/statoclasse
app.get('/api/professori/:id_prof/statoclasse', isLoggedIn, isProfessore, async (req, res) => {
  try{
  
    const id_prof = parseInt(req.params.id_prof);
    if (req.user.id_utente !== id_prof) {
      return res.status(403).json({error: 'Non autorizzato'});
    }
    const sortBy = req.query.sort || 'cognome'; // default: alfabetico

    const result = await getStatoClasse(id_prof, sortBy)
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//verifica se due studenti possono lavorare insieme
//GET /api/verifica-coppia/:id_studente1/:id_studente2/:id_prof
app.get('/api/verifica-coppia/:id_studente1/:id_studente2/:id_prof', isLoggedIn, isProfessore, async (req, res) => {

  const id_prof = parseInt(req.params.id_prof);
  if (req.user.id_utente !== id_prof) {
    return res.status(403).json({error: 'Non autorizzato'});
  }

  try {
    const id_studente1 = parseInt(req.params.id_studente1);
    const id_studente2 = parseInt(req.params.id_studente2);

    const result = await verificaCoppia(id_studente1, id_studente2, id_prof); 

    res.json({puo_lavorare_insieme: result})
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//Crea un nuovo compito per un professore
//POST /api/professori/:id_prof/compiti/new
app.post('/api/professori/:id_prof/compiti/new', isLoggedIn, isProfessore, [
  check('domanda').notEmpty().withMessage('La domanda è obbligatoria'),
  check('id_prof').isInt().withMessage('L\'ID del professore deve essere un numero intero'),
  check('dimensione_gruppo').isInt({ min: 2, max:6 }).withMessage('Il gruppo deve essere composto da 2-6 studenti')
], async(req, res)=>{
  const id_prof = parseInt(req.params.id_prof);
  if (req.user.id_utente !== id_prof) {
    return res.status(403).json({error: 'Non autorizzato'});
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    const {domanda, dimensione_gruppo}= req.body;

    const compito = {
      domanda,
      id_prof,
      dimensione_gruppo,
      stato: 'aperto', 
      risposta: null,
      voto: null 
    };

    const result = await creaCompito(compito); 
    res.status(201).json(result);
  }catch (error) {
    res.status(500).json({error: error.message});
  }
});

        //////////
        //GRUPPI//
        //////////

//restituisce gli studenti di un gruppo in base all'id del compito
//GET /api/gruppi/compito/:id_compito
app.get('/api/gruppi/compito/:id_compito', isLoggedIn, async (req, res) => {
  try {
    const id_task = parseInt(req.params.id_compito);
    const result = await getGruppiByCompito(id_task); 

    if (result.length > 0) {
      res.json(result);
    } else {
      res.status(404).json({error: 'Nessun gruppo trovato per questo task'});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

//Crea un nuovo gruppo per un task 
//POST /api/gruppi
app.post('/api/gruppi', isLoggedIn, isProfessore, [
  check('id_studente').notEmpty().withMessage('L\'ID dello studente non può essere vuoto'),
  check('id_task').notEmpty().withMessage('L\'ID del task non può essere vuoto')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const id_task  = Number(req.body.id_task);
    const id_studente = Number(req.body.id_studente);

    const result = await creaGruppo(id_task, id_studente); 
    res.status(201).json(result);
  } catch (error) {
    res.status(503).json({error: error.message});
  }
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
