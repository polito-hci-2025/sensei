import sqlite from 'sqlite3';
import { Compito, Gruppo, Utente } from './models.mjs';
import crypto from 'crypto';

const db = new sqlite.Database('compiti.sqlite', (err) =>{
    if(err) throw err;
});

            ///////////////
            ////COMPITI////
            ///////////////

//get a task by id
export const getCompitoById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM compiti WHERE id_compito = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else if(row===undefined) {
                resolve({error: 'Compito non trovato, controlla l\'ID'});
            }else {
                resolve(new Compito(row.id_compito, row.domanda, row.id_prof, row.dimensione_gruppo, row.stato, row.risposta, row.voto));
            }
        });
    });
}

//get task by teacher id
export const getCompitiByIdInsegnante = (id_prof) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM compiti WHERE id_prof = ?';
        db.all(sql, [id_prof], (err, rows) => {
            if (err) {
                reject(err);
            } else if(rows.length > 0) {
                const assignments = rows.map((c) => {
                    const compito = new Compito(c.id_compito, c.domanda, c.id_prof, c.dimensione_gruppo, c.stato, c.risposta, c.voto);
                    
                    return compito;
                });
                resolve(assignments);
            }else{
                resolve([]);
            }
        });
    });
}

//get a task by student id
export const getCompitiByIdStudente = (id_studente) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT c.*, g.id_studente FROM compiti c JOIN gruppi g ON c.id_compito=g.id_task WHERE g.id_studente=?';
        db.all(sql, [id_studente], (err, rows) => {
            if (err) { 
                reject(err);
            } else if(rows.length > 0) {
                const assignments = rows.map((c) => {
                    const compito = new Compito(c.id_compito, c.domanda, c.id_prof, c.dimensione_gruppo, c.stato, c.risposta, c.voto);
                    
                    return compito;
                });
                resolve(assignments);
            }else{
                resolve([]);
            }
        });
    });
}

//create a task
export const creaCompito = (compito) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO compiti (domanda, id_prof, dimensione_gruppo, stato) VALUES (?, ?, ?, ?)';
        db.run(sql, [compito.domanda, compito.id_prof, compito.dimensione_gruppo, compito.stato], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({id: this.lastID});
            }
        });
    });
}

//update risposta ad un task
export const updateRispostaCompito = (id_compito, risposta) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE compiti SET risposta = ? WHERE id_compito = ? AND stato = "aperto"';
        db.run(sql, [risposta, id_compito], function(err) {
            if (err) {
                reject(err);
            } else if(this.changes === 0) {
                resolve({error: 'Compito non trovato o già chiuso'});
            } else {
                resolve({message: 'Risposta aggiornata con successo'});
            }
        });
    });
}

//assegna voto ad un compito 
export const updateVotoCompito = (id_compito, voto) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE compiti SET voto = ?, stato = "chiuso" WHERE id_compito = ?';
        db.run(sql, [voto, id_compito], function(err) {
            if (err) {
                reject(err);
            } else if(this.changes === 0) {
                resolve({error: 'Compito non trovato o già chiuso'});
            } else {
                resolve({message: 'Voto aggiornato con successo'});
            }
        });
    });
}

            //////////////
            ////GRUPPI////
            //////////////

//get studenti di un gruppo di un id_task
export const getGruppiByCompito = (id_task) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT u.id_utente, u.nome, u.cognome FROM gruppi g JOIN utenti u ON g.id_studente=u.id_utente WHERE g.id_task = ?`;
        db.all(sql, [id_task], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

//verifica coppia
export const verificaCoppia = (id_studente1, id_studente2, id_prof) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(*) AS num_compiti
                    FROM compiti c
                    JOIN gruppi g1 ON c.id_compito = g1.id_task
                    JOIN gruppi g2 ON c.id_compito = g2.id_task
                    WHERE c.id_prof = ?
                    AND g1.id_studente = ?
                    AND g2.id_studente = ?
                    AND g1.id_studente <> g2.id_studente
                `;

        db.all(sql, [id_prof, id_studente1, id_studente2], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row[0]?.num_compiti < 2);
            }
        });
    });
}

//crea gruppo
export const creaGruppo = (id_task, id_studente) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO gruppi (id_task, id_studente) VALUES (?, ?)';
        db.run(sql, [id_task, id_studente], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({id: this.lastID});
            }
        });
    });
}

        ////////////////
        /////UTENTI/////
        ////////////////

//get user
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM utenti WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {

        const user = {
          id_utente: row.id_utente, 
          username: row.username, 
          nome: row.nome, 
          cognome: row.cognome, 
          ruolo: row.ruolo
        };
        
        crypto.scrypt(password, row.salt, 32, function(err, hashedPassword) {
            if (err) 
                reject(err);
           
          
            if(!crypto.timingSafeEqual(Buffer.from(row.password_hash, 'hex'), hashedPassword))
                resolve(false);
            else 
                resolve(user);
        });
      }
    });
  });
};

//get all students
export const getListaStudenti = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM utenti WHERE ruolo = "studente"';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows); 
            }
        });
    });
}

//get student by id
export const getStudenteById = (id_studente) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM utenti WHERE id_utente = ? AND ruolo = "studente"';
        db.get(sql, [id_studente], (err, row) => {
            if (err) {
                reject(err);
            } else if(row === undefined) {
                resolve({error: 'Studente non trovato'});
            } else {
                resolve(new Utente(row.id_utente, row.username, row.password_hash, row.salt, row.ruolo, row.nome, row.cognome));
            }
        });
    });
}

//restituisce lista degli studenti e i compiti aperti e chisi per il professore
export const getStatoClasse =(id_prof, sortBy='cognome') => {
    return new Promise((resolve, reject) => {
          let orderBy = 's.cognome ASC';
        const sql = `
            SELECT 
                s.id_utente,
                s.nome,
                s.cognome,
                s.username,
                SUM(CASE WHEN c.stato = 'aperto' THEN 1 ELSE 0 END) as aperti,
                SUM(CASE WHEN c.stato = 'chiuso' THEN 1 ELSE 0 END) as chiusi
            FROM utenti s
            LEFT JOIN gruppi g ON g.id_studente = s.id_utente
            LEFT JOIN compiti c ON c.id_compito = g.id_task AND c.id_prof = ?
            WHERE s.ruolo = 'studente'
            GROUP BY s.id_utente
            ORDER BY ${orderBy}
        `;

        db.all(sql, [id_prof], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }) 
}