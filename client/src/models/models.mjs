function Compito(id_compito, domanda, id_prof, dimensione_gruppo, stato='aperto', risposta=null, voto=null){
    this.id_compito = id_compito;
    this.domanda = domanda;
    this.id_prof = id_prof;
    this.dimensione_gruppo = dimensione_gruppo;
    this.stato = stato;
    this.risposta = risposta;
    this.voto = voto;

}

function Gruppo(id_task, id_studente){
    this.id_task = id_task;
    this.id_studente = id_studente;

}

function Utente(id_utente, username, password, salt, ruolo, nome, cognome){
    this.id_utente = id_utente;
    this.username = username;
    this.password = password;
    this.salt = salt;
    this.ruolo = ruolo; 
    this.nome = nome;
    this.cognome = cognome;

}

export { Compito, Gruppo, Utente };