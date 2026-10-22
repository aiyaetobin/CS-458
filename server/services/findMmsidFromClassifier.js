
//takes a classifier gotten from findClassifierFromIsbn and uses it to search for books related to that classifier it returns their mms ids
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

findMmsidFromClassifier('BS195');