function MyWork(id_pdf, NamePDF, Subject, Grade, Tag, Description, Shared,Download, Prof, Type){
    this.id_pdf=id_pdf,
    this.NamePDF=NamePDF,
    this.Subject=Subject,
    this.Grade=Grade,
    this.Tag=Tag,
    this.Description=Description,
    this.Shared=Shared,
    this.Download=Download,
    this.Prof=Prof,
    this.Type=Type

}

function Shared(id, NamePDF, Subject,Grade, Tag,Description,Shared,Download, Prof){
    this.id=id,
    this.NamePDF=NamePDF,
    this.Subject=Subject,
    this.Grade=Grade,
    this.Tag=Tag,
    this.Description=Description,
    this.Shared=Shared,
    this.Download=Download,
    this.Prof=Prof
    
}

function CreatePDF(id, id_pdf, content, type, answers){
    this.id=id,
    this.id_pdf=id_pdf,
    this.content=content,
    this.type=type,
    this.answers=answers
}

export { MyWork, Shared, CreatePDF};