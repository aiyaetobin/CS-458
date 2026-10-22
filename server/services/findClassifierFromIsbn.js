//a user will search for a book by isbn you can click on that book to generate a report the isbn 
//needs to be used to find out the library of congress classification so that it can be used to 
//query the alma api


async function findClassifierFromIsbn()
{

    const response = await fetch("http://localhost:3000/api/LOC/search/");

    const parsedXml = await response.json(); // the endpoint returns the xml response from LOC as xml text parsed into javascript objects

    const fields = parsedXml["zs:searchRetrieveResponse"] // the information we want, the 050 field meaning library of congress classifier is stored in the datafield sub-object of the parsedXml so we save that
    ["zs:records"]
    ["zs:record"]
    ["zs:recordData"]
    ["record"]
    ["datafield"]; 

    const lcField = fields?.find(field => field["@_tag"] === "050"); //this looks for a subfield where the datafield tag is 050
    const lcClass = lcField.subfield?.find(field => field["@_code"] === "a"); //looks for a code in 050 (the class)
    const lcCutter = lcField.subfield?.find(field => field["@_code"] === "b");//looks for b code in 050 (the cutter)

    const locClassifier = lcClass["#text"] + " " + lcCutter["#text"]; // this gives us the full library of congress number the class+cutter

    console.log(locClassifier);
    return locClassifier;
}

findClassifierFromIsbn();