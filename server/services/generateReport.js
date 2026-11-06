const { validIsbn } = require('./isbnValidator.js');
//******************************************
/*
  This file is a compilation of a few different test functions that are used in the process 
  of generating a report from an ISBN of the 5 least used items in the section a isbn would be
  placed in if the library were to aquire it.

  currently i havent done any sanitization or error checking its just proof of concept

  1. turn isbn into LOC classifier
  2. turn LOC classifier into mmsids with that classifier
  3. get loan count for each mmsid
  4. return the 5 least used mmsids and their loan counts
*/
//******************************************

// 1. ibsn to LOC using LOC API endpoint
async function classifierFromIsbn(isbn)
{
    //validate isbn
    const isbnValidation = await validIsbn(isbn);
    if (isbnValidation !== true) {
        return isbnValidation;
    }

    const response = await fetch(
        `http://localhost:3000/api/LOC/search/${encodeURIComponent(isbn)}`
    );

    const parsedXml = await response.json();

    const rawRecords = parsedXml["zs:searchRetrieveResponse"]?.
        ["zs:records"]?.
        ["zs:record"];

    if (!rawRecords) {
        return "Issue parsing XML";
    }

    // If multiple records are returned, only use the first
    const record = Array.isArray(rawRecords)
        ? rawRecords[0]
        : rawRecords;

    const fields = record["zs:recordData"]?.
        ["record"]?.
        ["datafield"];

    if (!fields) {
        return "Book unclassified";
    }

    const lcField = fields.find(
        field => field["@_tag"] === "050"
    );

    if (!lcField) {
        return "Book unclassified";
    }

    const subfields = Array.isArray(lcField.subfield)
        ? lcField.subfield
        : [lcField.subfield];

    const lcClass = subfields.find(
        field => field["@_code"] === "a"
    );

    const lcCutter = subfields.find(
        field => field["@_code"] === "b"
    );

    if (lcClass?.["#text"] && lcCutter?.["#text"]) {
        const locClassifier =
            lcClass["#text"] + " " + lcCutter["#text"];

        return locClassifier;
    }

    return "Book unclassified";
}

//2 LOC classifier to mmsid using alma api endpoint
async function mmsidFromClassifier(classifier){
    const searchClassifier = classifier; 
    
    if(classifier.length < 1 || classifier === null){
        return "Classifier must be at least 1 character long";
    }

    if(!/^[A-Za-z]/.test(classifier)){
        return "Classifier must start with a letter";
    }

    if(classifier === "Book unclassified"){
        return 'Book unclassified';
    }


    const response = await fetch(`http://localhost:3000/api/alma/search/${encodeURIComponent(searchClassifier)}`);

    const data = await response.json();

    const records = data["searchRetrieveResponse"]?.
    ["records"]?.
    ["record"];

    if (!records) {
          return null;
      }

   //looks through records which is an array of books for every book it looks into their control field held below recordData and record for each book it finds
   //  their controlfield tag 001 meaning mmsid and returns it to map to be compiled all together into a array of mms ids
   // these id's can then be each individually used to query alma api for usage data and return the 5 lowest ones
     
   
    const mmsIds = records.map(book => {
      const controlfields = book["recordData"]?.["record"]?.["controlfield"];

      if (!controlfields) {
          return null;
      }

        const mmsField = controlfields.find(field => field["@_tag"] === "001");

        if (!mmsField?.["#text"]) {
            return null;
        }
        return String(mmsField["#text"]);
    })
    if(mmsIds.length === 0){
        return "No mmsids found for this classifier";
    }
    console.log(mmsIds)
    return mmsIds;

}

//3. get loan count for each mmsid using alma api endpoint
async function getLoanCount(mmsidArray){
    const results = [];


    for (const mmsid of mmsidArray) { 
        const response = await fetch(`http://localhost:3000/api/alma/loans/${encodeURIComponent(mmsid)}`);
        const data = await response.json();
        if(response.status === 500) {
            return("Alma server error for mmsid: " + mmsid);
        }

        if (!response.ok) {
            return ("Error fetching loan count for mmsid: " + mmsid);
        }

        const loans = data["total_record_count"];

        if (data?.total_record_count == null) {
            return ("Error parsing loan count for mmsid: " + mmsid);
        }

        results.push({ mmsid, loanCount: loans});
    }

    if(results === null || results.length === 0){
        return "mmsid Array is empty or null";
    }

    return results;
}

//4 return least used

async function getLeastUsed(loanCounts){

 if(!Array.isArray(loanCounts)) {
    return 'Loan input must be an array';
  }

  if(loanCounts === null){
    return null;
  }
  
  if(loanCounts.length === 0){
    return null;
  }

    const sorted = loanCounts.sort((a, b) => a.loanCount - b.loanCount);
    

    const leastUsed = sorted.slice(0, 5);
    console.log(sorted);
    return leastUsed;
  
}

async function generateReport(isbn) {
    const locClassifier = await classifierFromIsbn(isbn);

    if(locClassifier === "Book unclassified" || locClassifier === "ISBN not found in Open Library" || locClassifier === "ISBN must contain only numbers" || locClassifier === "ISBN must be 10 or 13 characters long" || locClassifier === "Error checking ISBN in Open Library"){ 
        return "Invalid ISBN or Book unclassified";
    }


    const searchClass = locClassifier.split(/\s+/)[0]; //temporarily splitting loc to the first whitespace to get just the class
    //in the future we'll have to figure out to what level the library locations are specified with LOC
    console.log(searchClass);

    const mmsIds = await mmsidFromClassifier(searchClass);
    console.log(mmsIds);
    const loanCounts = await getLoanCount(mmsIds);
    console.log(loanCounts);
    const leastUsed = await getLeastUsed(loanCounts);

    console.log(leastUsed);

    return leastUsed;
    }

//testing the functions
// classifierFromIsbn('9781234567890').then(console.log);
// mmsidFromClassifier('BS195').then(console.log);
let mmsid = 
    [
    '992150263402909',
    '9910041373302909',
    '992913493402909',
    '99977523402909',
    '991566853402909',
    '99738073402909',
    '992033773402909'
    ];

getLoanCount(mmsid).then(console.log);



// generateReport('9781234567890').then(console.log);

module.exports = {
    generateReport,
    classifierFromIsbn,
    mmsidFromClassifier,
    getLoanCount,
    getLeastUsed
};
