const BOOLS = [
    {"fieldName": "and", "displayName": "And", "type": "text"},
    {"fieldName": "or", "displayName": "Or", "type": "text"}
];

const SEARCHFIELDS = [
    {"fieldName": "~", "displayName": "All Fields", "type": "text"},
    {"fieldName": "pid", "displayName": "PID", "type": "text"},
    {"fieldName": "label", "displayName": "Label", "type": "text"},
    {"fieldName": "archiveHoldingDocument", "displayName": "Archive Holding Document", "type": "text"},
    {"fieldName": "callNumber", "displayName": "Call Number", "type": "text"},
    {"fieldName": "containingCollection", "displayName": "Containing Collection", "type": "text"},
    {"fieldName": "documentType", "displayName": "Document Type", "type": "text"},
    {"fieldName": "pageNumber", "displayName": "Page Number", "type": "text"},
    {"fieldName": "periodicalTitle", "displayName": "Periodical Title", "type": "text"},
    {"fieldName": "announcements", "displayName": "Announcements", "type": "text"},
    {"fieldName": "dimensions.length", "displayName": "Dimensions: Length", "type": "text"},
    {"fieldName": "dimensions.width", "displayName": "Dimensions: Width", "type": "text"},
    {"fieldName": "documentPrinter.location", "displayName": "Document Printer: Location", "type": "text"},
    {"fieldName": "documentPrinter.name", "displayName": "Document Printer: Name", "type": "text"},
    {"fieldName": "printedArea.length", "displayName": "Printed Area: Length", "type": "text"},
    {"fieldName": "printedArea.width", "displayName": "Printed Area: Width", "type": "text"},
    {"fieldName": "shows.date", "displayName": "Date", "type": "text"},
    {"fieldName": "shows.doorsOpen", "displayName": "Doors Open", "type": "text"},
    {"fieldName": "shows.location", "displayName": "Location", "type": "text"},
    {"fieldName": "shows.performanceBegins", "displayName": "Performance Begins", "type": "text"},
    {"fieldName": "shows.stageManager", "displayName": "Stage Manager", "type": "text"},
    {"fieldName": "shows.theaterCompany", "displayName": "Theater Company", "type": "text"},
    {"fieldName": "shows.venue", "displayName": "Venue", "type": "text"},
    {"fieldName": "shows.featuredAttractionsForShow", "displayName": "Featured Attractions", "type": "text"},
    {"fieldName": "shows.notes", "displayName": "Show Notes", "type": "text"},
    {"fieldName": "shows.doorsOpen", "displayName": "Doors Open", "type": "text"}

];

class TermList {

    constructor(){
        this.terms = [];
        this.element = document.createElement("div");
        this.addTerm(new Term(true));
        // return this.element;
    }

    removeTerm(termObject){
        this.terms.splice(this.terms.indexOf(termObject), 1);
        this.element.removeChild(termObject.element);
        if(this.terms.length == 0){
            this.addTerm(new Term(true));
        }else{
            console.log(this.terms[0]);
            this.terms[0].boolElement.selectedIndex = 0;
            this.terms[0].boolElement.setAttribute("class", "bool-first-term");
        }
        console.log()
    }

    addTerm(termObject, precedingTermObject = false){
        let index = precedingTermObject ? this.terms.indexOf(precedingTermObject) + 1 : 0;
        this.terms.splice(index, 0, termObject);
        if(this.terms.length == 1){
            this.element.appendChild(termObject.element);
        }else{
            precedingTermObject.element.insertAdjacentElement("afterend", termObject.element);
        }
        
        termObject.parent = this;
    }

    getQuery(){
        let payload = [];
        let queryList = [];
        this.terms.forEach((term) => {
            queryList.push(term.getQuery());
        });
        let orSet = [];
        for(let i = 0; i < queryList.length; i++){
            let nug = {
                "field": queryList[i].field,
                "text": queryList[i].input                
            };
            if(queryList[i].bool == "and"){
                if(i != 0){
                    payload.push(orSet);
                }
                orSet = [nug];
            } else {
                orSet.push(nug);
            }
        }
        payload.push(orSet);
        return payload;
    }
}

class Term {

    constructor(initial = false){
        this.parent = false;
        this.element = document.createElement("div");
        this.element.setAttribute("class", "term-container");

        this.boolElement = document.createElement("select");
        BOOLS.forEach((bool) => {
            let opt = document.createElement("option");
            opt.setAttribute("value", bool.fieldName);
            opt.innerHTML = bool.displayName;
            this.boolElement.appendChild(opt);
        });
        let boolElementClass = initial ? "bool-first-term" : "bool";
        this.boolElement.setAttribute("class", `term-input ${boolElementClass}`);
        let boolContainer = document.createElement("div");
        boolContainer.setAttribute("class", "bool-container");
        boolContainer.appendChild(this.boolElement);
        this.element.appendChild(boolContainer);

        this.fieldElement = document.createElement("select");
        SEARCHFIELDS.forEach((field) => {
            let opt = document.createElement("option");
            opt.setAttribute("value", field.fieldName);
            opt.innerHTML = field.displayName;
            this.fieldElement.appendChild(opt);
        });
        this.fieldElement.setAttribute("class", `term-input`);
        this.element.appendChild(this.fieldElement);

        this.inputElement = document.createElement("input");
        // this.inputElement.setAttribute("class", "search-component search-text");
        this.inputElement.setAttribute("type", "text");
        this.inputElement.setAttribute("class", `term-input`);
        this.element.appendChild(this.inputElement);

        this.addButton = new AddButton(this);
        this.addButton.element.setAttribute("class", `term-button add-button`);
        this.element.appendChild(this.addButton.element);

        this.removeButton = new RemoveButton(this);
        this.removeButton.element.setAttribute("class", `term-button remove-button`);
        this.element.appendChild(this.removeButton.element);

    }

    getQuery(){
        return {
            "bool": this.boolElement.value,
            "field": this.fieldElement.value,
            "input": this.inputElement.value
        }
    }
}


class AddButton {
    constructor(target){
        this.target = target;
        this.element = document.createElement("span");
        this.element.setAttribute("class", "add-button");
        this.element.innerHTML = "[+]";
        this.element.addEventListener("click", () => {
            this.target.parent.addTerm(new Term(), this.target);
        });
    }

}

class RemoveButton {
    constructor(target){
        this.target = target;
        this.element = document.createElement("span");
        this.element.setAttribute("class", "remove-button");
        this.element.innerHTML = "[x]";
        this.element.addEventListener("click", () => {
            this.target.parent.removeTerm(this.target);
        });
    }

}