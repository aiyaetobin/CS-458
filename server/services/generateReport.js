//******************************************
/*
  This file is a compilation of a few different test functions that are used in the process 
  of generating a report from an ISBN.

  1. turn isbn into LOC classifier
  2. turn LOC classifier into mmsids
  3. get loan count for each mmsid
  4. return the 5 least used mmsids and their loan counts
*/
//******************************************

// 1. ibsn to LOC using LOC API endpoint
async function findClassifierFromIsbn(isbn)
{
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

    const locClassifier = lcClass["#text"] + " " + lcCutter["#text"]; // this gives us the full library of congress number the class+cutter

    console.log(locClassifier);
    return locClassifier;
}

//2 LOC classifier to mmsid using alma api endpoint
async function findMmsidFromClassifier(classifier){
    const searchClassifier = classifier; 

    const response = await fetch(`http://localhost:3000/api/alma/search/${encodeURIComponent(searchClassifier)}`);

    const data = await response.json();

    const records = data["searchRetrieveResponse"]?.
    ["records"]?.
    ["record"]
   //looks through records which is an array of books for every book it looks into their control field held below recordData and record for each book it finds
   //  their controlfield tag 001 meaning mmsid and returns it to map to be compiled all together into a array of mms ids
   // these id's can then be each individually used to query alma api for usage data and return the 5 lowest ones
   
    const mmsIds = records.map(book => {
        const controlfields = book["recordData"]?.["record"]?.["controlfield"];

        const mmsField = controlfields.find(field => field["@_tag"] === "001");

        return String(mmsField["#text"]);
    })


    console.log(mmsIds)

}

//3. get loan count for each mmsid using alma api endpoint
async function getLoanCount(mmsidArray){
    const results = [];

    for (const mmsid of mmsidArray) { 
        const response = await fetch(`http://localhost:3000/api/alma/loans/${encodeURIComponent(mmsid)}`);
        const data = await response.json();



        const loans = data["total_record_count"];

        results.push({ mmsid, loanCount: loans});
    }
    console.log(results);
    return results;
}

//testing the functions
// findClassifierFromIsbn('9781433502415');
// findMmsidFromClassifier('BS195');

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