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
    if(isbnValidation !== true){
        return isbnValidation;
    }
    
    const searchIsbn = isbn;
    const response = await fetch(`http://localhost:3000/api/LOC/search/${encodeURIComponent(searchIsbn)}`);

    const parsedXml = await response.json(); // the endpoint returns the xml response from LOC as xml text parsed into javascript objects
    const fields = parsedXml["zs:searchRetrieveResponse"]?. // the information we want, the 050 field meaning library of congress classifier is stored in the datafield sub-object of the parsedXml so we save that
    ["zs:records"]?.
    ["zs:record"]?.
    ["zs:recordData"]?.
    ["record"]?.
    ["datafield"]; 

    const lcField = fields?.find(field => field["@_tag"] === "050"); //this looks for a subfield where the datafield tag is 050
    const lcClass = lcField?.subfield?.find(field => field["@_code"] === "a"); //looks for a code in 050 (the class)
    const lcCutter = lcField?.subfield?.find(field => field["@_code"] === "b");//looks for b code in 050 (the cutter)

   const locClassifier = lcClass?.["#text"] + " " + lcCutter?.["#text"]; // this gives us the full library of congress number the class+cutter

  if (!lcClass?.["#text"] || !lcCutter?.["#text"]) {
    return "Book unclassified";
  } 

    console.log(locClassifier);
    return locClassifier;
}

//2 LOC classifier to mmsid using alma api endpoint
async function mmsidFromClassifier(classifier){
    const searchClassifier = classifier; 

    if(classifier === "Book unclassified"){
        return 'Book unclassified';
    }

    const response = await fetch(`http://localhost:3000/api/alma/search/${encodeURIComponent(searchClassifier)}`);

    const data = await response.json();

    const foundRecords = data["searchRetrieveResponse"]?.
    ["records"]?.
    ["record"];

    if (!foundRecords) {
          return null;
      }

    // the xml parser gives back a single object (not an array) when Alma finds exactly one record
    const records = Array.isArray(foundRecords) ? foundRecords : [foundRecords];

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


    console.log(mmsIds)
    return mmsIds;

}

//3. get loan count for each mmsid using alma api endpoint
async function getLoanCount(mmsidArray){
    const results = [];

    for (const mmsid of mmsidArray) { 
        const response = await fetch(`http://localhost:3000/api/alma/loans/${encodeURIComponent(mmsid)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Loan lookup failed for ${mmsid}`);
        }

        const loans = data["total_record_count"];

        results.push({ mmsid, loanCount: loans});
    }
    console.log(results);
    if(results.length === 0){
        return null;
    }

    return results;
}

//4 return least used

async function getLeastUsed(loanCounts){

  if(loanCounts === null){
    return null;
  }
  
  if(loanCounts.length === 0){
    return null;
  }

    const sorted =loanCounts.sort((a, b) => a.loanCount - b.loanCount);
    

    const leastUsed = sorted.slice(0, 5);
    console.log(sorted);
    return leastUsed;
  
}

async function generateReport(isbn) {
    const locClassifier = await classifierFromIsbn(isbn);

    // classifierFromIsbn returns a message instead of a classifier when it can't find one
    // (validIsbn's messages, or 'Book unclassified'), so stop here rather than searching Alma for it
    if (locClassifier === 'Book unclassified' || locClassifier.startsWith('ISBN ') || locClassifier.startsWith('Error ')) {
        throw new Error(locClassifier);
    }

    const searchClass = locClassifier.split(/\s+/)[0]; //temporarily splitting loc to the first whitespace to get just the class
    //in the future we'll have to figure out to what level the library locations are specified with LOC

    const foundIds = await mmsidFromClassifier(searchClass);
    const mmsIds = (foundIds || []).filter(id => id !== null); // no records, or records missing an mms id
    if (mmsIds.length === 0) {
        return null; // nothing in this section to report on
    }

    const loanCounts = await getLoanCount(mmsIds);
    const leastUsed = await getLeastUsed(loanCounts);

    console.log(leastUsed);

    return leastUsed;
}

//testing the functions
// classifierFromIsbn('9781433502415');
// mmsidFromClassifier('BS195');

// let mmsid = 
//     [
//     '992150263402909',
//     '9910041373302909',
//     '992913493402909',
//     '99977523402909',
//     '991566853402909',
//     '99738073402909',
//     '992033773402909'
//     ];

// getLoanCount(mmsid);

// generateReport('9781433502415');

module.exports = {
    generateReport,
    classifierFromIsbn,
    mmsidFromClassifier,
    getLoanCount,
    getLeastUsed
};
