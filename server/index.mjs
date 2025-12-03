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

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

const isProfessore = (req, res, next) => {
  if(req.isAuthenticated() && req.user.ruolo === 'professore') {
    return next();
  }
  return res.status(403).json({error: 'Access denied - only teachers allowed'});
}

const isStudente = (req, res, next) => {
  if(req.isAuthenticated() && req.user.ruolo === 'studente') {
    return next();
  }
  return res.status(403).json({error: 'Access denied - only students allowed'});
}

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.authenticate('session'));

      //////////////////
      //AUTENTICAZIONE//
      //////////////////

//POST /api/sessions
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      return res.status(401).json(info);
    }
    req.logIn(user, (err) => {
      if (err)
        return next(err);
      
      return res.json(req.user);
    });
  })(req, res, next);
});

//GET /api/sessions/current
app.get('/api/sessions/current', (req, res)=>{
  if(req.isAuthenticated()){
    res.json(req.user);
  }else{
    res.status(401).json({error: 'Not authenticated'});
  }
});

//DELETE /api/sessions/current
app.delete('/api/sessions/current', (req, res) => {
  req.logout(()=>{
    res.end();
  });
});

        /////////////
        ///COMPITI///
        /////////////
//prende il compito dall'id
//GET /api/compiti/:id
app.get('/api/compiti/:id', isLoggedIn, async (req, res)=>{
  try{
    const id = parseInt(req.params.id);
    const compito = await getCompitoById(id);

    if (compito) {
      res.json(compito);
    } else {
      res.status(404).json({error: 'Compito non trovato'});
    }
  }catch (error) {
    res.status(500).json({error: error.message});
  }
});

//aggiorna la risposta del compito
//PUT /api/compiti/:id/risposta
app.put('/api/compiti/:id/risposta', isLoggedIn, isStudente, [
  check('risposta').notEmpty().withMessage('La risposta è obbligatoria')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const id_compito = parseInt(req.params.id);
  const gruppo = await getGruppiByCompito(id_compito);
  const studenteNelGruppo = gruppo.some(g => g.id_utente === req.user.id_utente);
  
  if (!studenteNelGruppo) {
    return res.status(403).json({error: 'Non autorizzato a rispondere a questo compito'});
  }

  const compito = await getCompitoById(id_compito);
  if(compito.stato !== 'aperto'){
    return res.status(409).json({error: 'Il compito è stato chiuso'});
  }

  try {
    const { risposta } = req.body;

    const result = await updateRispostaCompito(id_compito, risposta); 

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({error: 'Compito non trovato, non accessibile o già chiuso'});
    }
  } catch (error) {
    res.status(503).json({error: 'Errore nell\'aggiornamento della risposta del compito'});
  }
});

//aggiorna voto del compito
//PUT /api/compiti/:id_compito/voto
app.put('/api/compiti/:id_compito/voto', isLoggedIn, isProfessore, [
  check('voto').isInt({min: 0, max: 30}),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {  
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const id_compito = parseInt(req.params.id_compito);
    const { voto} = req.body;

    const compito = await getCompitoById(id_compito);
    if(!compito || compito.error){
      return res.status(404).json({error: 'Compito non trovato'});
    }

    if (compito.id_prof !== req.user.id_utente) {
      return res.status(403).json({error: 'Non autorizzato a valutare questo compito'});
    }
    

    const result = await updateVotoCompito(id_compito, voto); 

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
