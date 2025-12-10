import sqlite from 'sqlite3';
import { MyWork, Shared, CreatePDF } from './models.mjs';

const db = new sqlite.Database('database.sqlite', (err) =>{
    if(err) throw err;
});

//get a task by id
export const getMyWorkById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM myworks WHERE ID = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else if(row===undefined) {
                resolve({error: 'Compito non trovato, controlla l\'ID'});
            }else {
                resolve(new MyWork(row.ID, row.NamePDF, row.Subject, row.Grade, row.Tag, row.Description, row.Shared, row.Download, row.Prof, row.Type));
            }
        });
    });
}

//get task by teacher id
export const getAllMyWorks = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM myworks';
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else if(rows.length > 0) {
                const assignments = rows.map((c) => {
                    const work = new MyWork(c.ID, c.NamePDF, c.Subject, c.Grade, c.Tag, c.Description, c.Shared, c.Download, c.Prof, c.Type);
                    
                    return work;
                });
                resolve(assignments);
            }else{
                resolve([]);
            }
        });
    });
}

//create a task
export const createPDF = (MyWork) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO myworks (NamePDF, Subject, Grade, Tag, Description, Shared, Download, Prof, Type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.run(sql, [MyWork.NamePDF, MyWork.Subject, MyWork.Grade, MyWork.Tag, MyWork.Description, MyWork.Shared, MyWork.Download, MyWork.Prof, MyWork.Type], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({id_pdf: this.lastID});
            }
        });
    });
}

//update risposta ad un task
export const updateInfo = (id, title, description, subject, grade, shared) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE myworks SET title = ?, description = ?, subject = ?, grade = ?, shared = ? WHERE ID = ?';
        db.run(sql, [title, description, subject, grade, shared, id], function(err) {
            if (err) {
                reject(err);
            } else if(this.changes === 0) {
                resolve({error: 'id non trovato'});
            } else {
                resolve({message: 'Aggiornato con successo'});
            }
        });
    });
}

export const deleteMyWork = (id_pdf) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM myworks WHERE ID = ?';
        db.run(sql, [id_pdf], function(err) {
            if (err) {
                reject(err);
            } else if(this.changes === 0) {
                resolve({error: 'id non trovato'});
            } else {
                resolve({message: 'Eliminato con successo'});
            }
        });
    });
}

            //////////////
            ////SHARED////
            //////////////

export const getAllSharedWorks = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM sharedworks';
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else if(rows.length > 0) {
                const assignments = rows.map((c) => {
                    const work = new Shared(c.ID, c.NamePDF, c.Subject, c.Grade, c.Tag, c.Description, c.Shared, c.Download, c.Prof);
                    
                    return work;
                });
                resolve(assignments);
            }else{
                resolve([]);
            }
        });
    });
}

export const download = (id_pdf) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE sharedworks SET Download = Download + 1 WHERE ID = ?';
        db.run(sql, [id_pdf], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({message: 'Download count updated successfully'});
            }
        });
    });
}

        ////////////////
        /////CTREATEPDF/////
        ////////////////


//get all students
export const getContentById = (id_pdf) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM createPDF WHERE ID = ?';
        db.all(sql, [id_pdf], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows); 
            }
        });
    });
}

export const createContentPDF = (CreatePDF) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO createPDF (id_pdf, content, type, answers) VALUES (?, ?, ?, ?)';
        db.run(sql, [CreatePDF.id_pdf, CreatePDF.content, CreatePDF.type, CreatePDF.answers], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({id: this.lastID});
            }
        });
    });
}

export const updateContentPDF = (id, content, answers, type) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE createPDF SET content = ?, answers = ?, type = ? WHERE ID = ?';
        db.run(sql, [content, answers, type, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({message: 'Content updated successfully'});
            }
        });
    });
}

export const deleteContentPDF = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM createPDF WHERE ID = ?';   
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({message: 'Content deleted successfully'});
            }
        });
    });
}