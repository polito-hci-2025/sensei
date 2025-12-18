import {MyWork, Shared, CreatePDF} from '../models/models.mjs';
const SERVER_URL = 'http://localhost:3001';

        ///////////
        //MYWORKS//
        ///////////

//GET /api/myworks/:id
const getMyWorkById = async (id) => {
    const response = await fetch(SERVER_URL + '/api/myworks/' + id,{
        credentials: 'include'
    });
    if(response.ok){
        const mywork = await response.json();
        return new MyWork(mywork.id_pdf, mywork.NamePDF, mywork.Subject, mywork.Grade, mywork.Tag, mywork.Description, mywork.Shared, mywork.Download, mywork.Prof, mywork.Type);
    }
    else
        throw new Error("Internal server error");
}

//GET /api/myworks
const getAllMyWorks = async () => {
    const response = await fetch(SERVER_URL + '/api/myworks',{
        credentials: 'include'
    });
    if(response.ok){
        const myworksJson = await response.json();
        console.log("myworksJson", myworksJson);
        return myworksJson.map(s => new MyWork(s.id_pdf, s.NamePDF, s.Subject, s.Grade, s.Tag, s.Description, s.Shared, s.Download, s.Prof, s.Type));
    }
    else
        throw new Error("Internal server error");
}

//POST /api/myworks/create
const createPDF = async (pdf) => {
    const response = await fetch(SERVER_URL + '/api/myworks/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            NamePDF: pdf.NamePDF,
            Subject: pdf.Subject,
            Grade: pdf.Grade,
            Tag: pdf.Tag,
            Description: pdf.Description,
            Shared: pdf.Shared,
            Download: pdf.Download,
            Prof: pdf.Prof,
            Type: pdf.Type
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

//aggiorna info di un mywork
//PUT /api/myworks/:id/edit
const updateInfo = async (id_pdf, NamePDF, Description, Subject, Grade, Shared) => {
    const response = await fetch(SERVER_URL + '/api/myworks/' + id_pdf + '/edit', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({NamePDF, Description, Subject, Grade, Shared})
    });
    if(!response.ok){
        let message = "Errore durante la modifica delle informazioni";
        try{
            const error = await response.json();
            message = error.error || error.message || message;
        } catch(e){
             if (response.status === 409) {
                message = "Non è possibile modificare le info";
            }
        }
        throw new Error(message);
    }
    return await response.json();
}

const deleteMyWork = async (id_pdf) => {
    const response = await fetch(SERVER_URL + '/api/myworks/' + id_pdf + '/delete', {
        method: 'DELETE',
        credentials: 'include'
    });
    if(!response.ok){
        let message = "Errore durante la cancellazione del compito";
        try{
            const error = await response.json();
            message = error.error || error.message || message;
        } catch(e){
             if (response.status === 409) {
                message = "Non è possibile cancellare il compito";
            }
        }
        throw new Error(message);
    }
    return null;
}


        ////////////
        //SHARED//
        ////////////

//get all shared works
//GET /api/sharedworks
const getAllShared = async () => {
    const response = await fetch(SERVER_URL + '/api/sharedworks',{
        method: 'GET',
        credentials: 'include'
    });
    if(response.ok){
        const sharedWork = await response.json();
        return sharedWork.map(s => new Shared(s.id, s.NamePDF, s.Subject, s.Grade, s.Tag, s.Description, s.Shared, s.Download, s.Prof));
    }
    else
        throw new Error("Internal server error");
}

//get shared work by id
//GET /api/sharedworks/:id_sharedwork
const getSharedWorkById = async (id) => {
    const response = await fetch(SERVER_URL + '/api/sharedworks/' + id,{
        method: 'GET',
        credentials: 'include'
    });
    if(response.ok){
        const shared = await response.json();
        return new Shared(shared.id, shared.NamePDF, shared.Subject, shared.Grade, shared.Tag, shared.Description, shared.Shared, shared.Download, shared.Prof);
    }
    else
        throw new Error("Internal server error");
}

//update download count of a shared work
//PUT /api/sharedworks/:id_sharedwork/download
const download = async (id) => {
    const response = await fetch(SERVER_URL + '/api/sharedworks/' + id + '/download', {
        method: 'PUT',
        credentials: 'include'
    });
    if(!response.ok){
        let message = "Errore durante l'aggiornamento del contatore di download";
        try{
            const error = await response.json();
            message = error.error || error.message || message;
        } catch(e){
            if (response.status === 404) {
                message = "Shared work non trovato";
            }
        }
        throw new Error(message);
    }
    return await response.json();
}


            //////////////
            //CREATEPDF//
            //////////////  

//get all content by id
const getAllContentByPdf = async (id) => {
    const response = await fetch(`${SERVER_URL}/api/createpdf/${id}/content`, {
        credentials: 'include'
    });

    if (response.ok) {
        const contents = await response.json();
        
        return contents.map(c => new CreatePDF(
            c.id, 
            c.id_pdf, 
            c.Content, 
            c.Type, 
            c.Answers
        ));
    } else {
        let message = "Internal server error";
        try {
            const err = await response.json();
            message = err.error || message;
        } catch(e) {}
        throw new Error(message);
    }
}

//get specific content by id
//Get /api/createpdf/:id/content/:id_content
const getContentById = async (id, id_content) => {
    const response = await fetch(SERVER_URL + '/api/createpdf/' + id + '/content/' + id_content , {
        credentials: 'include'
    });
    if (response.ok) {
        const c = await response.json();
        return new CreatePDF(c.id, c.id_pdf, c.Content, c.Type, c.Answers);
    } else {
        let message = "Errore nel caricamento del contenuto";
        try {
            const errorData = await response.json();
            message = errorData.error || message;
        } catch (e) {}
        throw new Error(message);
    }
};

//create new content for a pdf
const createContentPDF = async (id_pdf, content, type, answers) => {
    const response = await fetch(SERVER_URL + '/api/createpdf/' + id_pdf + '/content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            content: content,
            type: type,
            answers: answers
        })
    });
    if(!response.ok) {
        const error = await response.json();

        let errorMessage = "Errore durante la creazione del contenuto";
        if (error.errors && Array.isArray(error.errors)) {
            errorMessage = error.errors.map(err => err.msg).join(', ');
        } 
        else if (error.error) {
            errorMessage = error.error;
        }
        throw new Error(errorMessage);
    }
    return await response.json();
}

const updateContentPDF = async (id_pdf, id_content, content, type, answers) => {
    const response = await fetch(SERVER_URL + '/api/createpdf/' + id_pdf + '/content/' + id_content + '/edit', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            content: content,
            type: type,
            answers: answers
        })
    });
    if(!response.ok) {
        const error = await response.json();
        let errorMessage = "Errore durante l'aggiornamento del contenuto";
        if (error.errors && Array.isArray(error.errors)) {
            errorMessage = error.errors.map(err => err.msg).join(', ');
        }
        else if (error.error) {
            errorMessage = error.error;
        }
        throw new Error(errorMessage);
    }
    return await response.json();
}

//delete all content for a pdf
const deleteAllContentPDF = async (id_pdf) => {
    const response = await fetch(SERVER_URL + '/api/createpdf/' + id_pdf + '/content/delete', {
        method: 'DELETE',
        credentials: 'include'
    });
    if(!response.ok){
        let message = "Errore durante la cancellazione dei contenuti";
        try{
            const error = await response.json();
            message = error.error || error.message || message;
        } catch(e){
             if (response.status === 409) {
                message = "Non è possibile cancellare i contenuti";
            }
        }
        throw new Error(message);
    }
    return null;
}

//delete specific content for a pdf
const deleteContentPDF = async (id_pdf, id_content) => {
    const response = await fetch(SERVER_URL + '/api/createpdf/' + id_pdf + '/content/' + id_content + '/delete', {
        method: 'DELETE',
        credentials: 'include'
    });
    if(!response.ok){
        let message = "Errore durante la cancellazione del contenuto";
        try{
            const error = await response.json();
            message = error.error || error.message || message;
        } catch(e){
             if (response.status === 409) {
                message = "Non è possibile cancellare il contenuto";
            }
        }
        throw new Error(message);
    }
    return null;
}

const API = {
    getMyWorkById,
    getAllMyWorks,
    createPDF,
    updateInfo,
    deleteMyWork,
    getAllShared,
    getSharedWorkById,
    download,
    getAllContentByPdf,
    getContentById,
    createContentPDF,
    updateContentPDF,
    deleteAllContentPDF,
    deleteContentPDF
};
export default API;