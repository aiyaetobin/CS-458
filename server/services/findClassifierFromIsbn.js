//a user will search for a book by isbn you can click on that book to generate a report the isbn 
//needs to be used to find out the library of congress classification so that it can be used to 
//query the alma api for book usage in that section
const { XMLParser } = require("fast-xml-parser");
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});

async function findClassifierFromIsbn()
{

    const response = await fetch("http://localhost:3000/api/LOC/search/");

    const parsedXml = await response.json();

    const fields = parsedXml["zs:searchRetrieveResponse"]
    ["zs:records"]
    ["zs:record"]
    ["zs:recordData"]
    ["record"]
    ["datafield"];

    const lcField = fields?.find(field => field["@_tag"] === "050");
    const lcClass = lcField.subfield?.find(field => field["@_code"] === "a");
    const lcCutter = lcField.subfield?.find(field => field["@_code"] === "b");

    const locClassifier = lcClass["#text"] + " " + lcCutter["#text"];

    console.log(locClassifier);

}

findClassifierFromIsbn();