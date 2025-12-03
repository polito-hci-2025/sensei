import {Compito, Gruppo, Utente} from '../models/models.mjs';
const SERVER_URL = 'http://localhost:3001';

        ///////////
        //COMPITI//
        ///////////

//GET /api/compiti/:id 
const getCompitoById = async (id) => {
    const response = await fetch(SERVER_URL + '/api/compiti/' + id,{
        credentials: 'include'
    });
    if(response.ok){
        const compitoJson = await response.json();
        return new Compito(compitoJson.id_compito, compitoJson.domanda, compitoJson.id_prof, compitoJson.dimensione_gruppo, compitoJson.stato, compitoJson.risposta, compitoJson.voto);
    }
    else
        throw new Error("Internal server error");
}

//PUT /api/compiti/:id/risposta 
const updateRispostaCompito = async (id_compito, risposta) => {
    const response = await fetch(SERVER_URL + '/api/compiti/' + id_compito + '/risposta', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({risposta})
    });
    if(!response.ok){
        let message = "Errore durante l'invio della risposta";
        try{
            const error = await response.json();
            message = error.error || error.message || message;
        } catch(e){
             if (response.status === 409) {
                message = "Il compito è stato chiuso e non può più essere modificato";
            }
        }
        throw new Error(message);
    }
    return await response.json();
}

//PUT /api/compiti/:id/voto 
const updateVotoCompito = async (id_compito, voto) => {
    const response = await fetch(SERVER_URL + '/api/compiti/' + id_compito + '/voto', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({voto})
    });
    
     if (!response.ok) {
        throw new Error('Errore durante l\'impostazione del voto');
    }
    else {
        return null; 
    }
}


//STUDENTI 
//GET /api/studenti 
const getListaStudenti = async () => {
    const response = await fetch(SERVER_URL + '/api/studenti',{
        credentials: 'include'
    });
    if(response.ok){
        const studentiJson = await response.json();
        return studentiJson.map(s => new Utente(s.id_utente, s.username, s.password, s.salt, s.ruolo, s.nome, s.cognome));
    }
    else
        throw new Error("Internal server error");
}

//GET /api/studenti/:id_studente 
const getStudenteById = async (id_studente) => {
    const response = await fetch(SERVER_URL + '/api/studenti/' + id_studente,{
        credentials: 'include'
    });
    if(response.ok){
        const studenteJson = await response.json();
        return new Utente(studenteJson.id_studente, studenteJson.nome, studenteJson.cognome, studenteJson.email, studenteJson.password, studenteJson.id_prof);
    }
    else
        throw new Error("Internal server error");
}

//GET /api/studenti/:id_studente/compiti 
const getCompitiByIdStudente = async (id_studente) => {
    const response = await fetch(SERVER_URL + '/api/studenti/' + id_studente + '/compiti',{
        credentials: 'include'
    });
    if(response.ok){
        const compitiJson = await response.json();
        return compitiJson.map(c => new Compito(c.id_compito, c.domanda, c.id_prof, c.dimensione_gruppo, c.stato, c.risposta, c.voto));
    }
    else
        throw new Error("Internal server error");
}

            //////////////
            //PROFESSORI//
            //////////////  

//GET /api/professori/:id_prof/compiti 
const getCompitiByProf = async (id_prof) => {
    const response = await fetch(SERVER_URL + '/api/professori/' + id_prof + '/compiti',{
        credentials: 'include'
    });
    if(response.ok){
        const compitiJson = await response.json();
        return compitiJson.map(c => new Compito(c.id_compito, c.domanda, c.id_prof, c.dimensione_gruppo, c.stato, c.risposta, c.voto));
    }
    else
        throw new Error("Internal server error");
}

//GET /api/professori/:id_prof/statoclasse 
const getStatoClasse = async (id_prof, sort = 'alfabetico') => {
  const response = await fetch(SERVER_URL + '/api/professori/' + id_prof + '/statoclasse?sort=' + sort, {
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Errore nel caricamento dello stato classe");
  }
};

//GET /api/verifica-coppia/:id_studente1/:id_studente2/:id_prof 
const verificaCoppia = async (id_studente1, id_studente2, id_prof) => {
    const response = await fetch(SERVER_URL + '/api/verifica-coppia/' + id_studente1 + '/' + id_studente2 +'/'+ id_prof, {
        credentials: 'include'
    });
    if(response.ok){
        const verificaJson = await response.json();
        return verificaJson;
    }
    else
        throw new Error("Internal server error");
}

//POST /api/professori/:id_prof/compiti/new 
const creaCompito = async (compito) => {
    const response = await fetch(SERVER_URL + '/api/professori/' + compito.id_prof + '/compiti/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            domanda: compito.domanda,
            id_prof: compito.id_prof,
            dimensione_gruppo: compito.dimensione_gruppo,
            stato: 'aperto',
            risposta: null,
            voto: null
        })
    });

    if(!response.ok) {
        let errMessage = await response.json();
        if(response.status === 422)
        errMessage = `${errMessage.errors[0].msg} for ${errMessage.errors[0].path}.`
        else
        errMessage = errMessage.error;
        throw errMessage;
    }
    else {
        const result = await response.json();
        return result;
    }
}

            //////////
            //GRUPPI//
            //////////

//GET /api/gruppi/compito/:id_compito 
const getGruppiByCompito = async (id_task) => {
    const response = await fetch(SERVER_URL + '/api/gruppi/compito/' + id_task, {
        credentials: 'include'
    });
    if(response.ok){
        const gruppiJson = await response.json();
        return gruppiJson;
    }
    else
        throw new Error("Internal server error");
}

//POST /api/gruppi 
const creaGruppo = async (id_task, id_studente) => {
    const response = await fetch(SERVER_URL + '/api/gruppi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            id_task: id_task,
            id_studente: id_studente
        })
    });
    if(!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }
    return await response.json();
}

            //////////////////
            //AUTENTICAZIONE//
            //////////////////

//POST /api/sessions
const logIn = async(credentials) => {
    const res = await fetch(SERVER_URL + '/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', 
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });
    if(res.ok) {
        const userJson = await res.json();
        return userJson;
    }else {
        const errDetails= await res.text();
        throw errDetails;
    }
};

//GET /api/sessions/current
const getUserInfo = async ()=> {
    const res = await fetch(SERVER_URL + '/api/sessions/current', {
        credentials: 'include',
    });
    const user = await res.json();
    if(res.ok){
        return user;
    } else {
        throw user;
    }
};

//DELETE /api/sessions/current
const logOut = async ()=> {
    const res = await fetch(SERVER_URL +'/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    });
    if(res.ok)
        return null;
    else {
    const error = await response.json();
    throw error;
  }
}

const API = {
    getCompitoById,
    getCompitiByProf,
    getCompitiByIdStudente,
    creaCompito,
    updateRispostaCompito,
    updateVotoCompito,
    getGruppiByCompito,
    creaGruppo,
    verificaCoppia,
    getListaStudenti,
    getStudenteById,
    getStatoClasse,
    logIn,
    getUserInfo,
    logOut
};
export default API;