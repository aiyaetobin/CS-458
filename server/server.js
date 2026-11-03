require('dotenv').config();
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const session = require('express-session');
const { XMLParser } = require("fast-xml-parser");
const { searchEbay } = require('./services/ebay');

const app = express();
const port = 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});
const apiKey = process.env.ALMA_API_KEY;

//middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true //session needed  
}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

/* LOGIN ENDPOINT

 The front end sends a POST request to /login with the body being set as the 
 credential from GoogleLogin. The endpoint verifies the credential it gets using
 verifyIdToken. it creates a user object with everything it needs from the payload
 it then sends the endpoint response back to the frontend 
*/
app.post('/login', async (req, res) =>
{
  const { credential } = req.body; //from front end post request body

  try
  {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };

    req.session.user = user; //sets the user in the session  

    return res.status(200).json({ //send json user back if successful
      message: 'Google authentication successful',
      user
    });

  } catch (error)
  {
    return res.status(401).json({
      error: 'Invalid Google credential'
    });
  }
});

app.get('/session', (req, res) =>
{
  if (req.session.user)
  {

    return res.status(200).json({
      loggedIn: true,
      user: req.session.user
    })
  }

  return res.status(401).json({
    loggedIn: false
  })
});


// ***************TESTING ENDPOINTS*************** understanding alma api and LOC api
app.get('/api/alma/search/:classifier', async (req, res) =>
{
  //get class from url
  const classification = req.params.classifier;
  //create CQL query for Alma API
  const cql = `alma.PermanentCallNumber=${classification}`;
  //alma sru endpoint
  const baseUrl = 'https://na03.alma.exlibrisgroup.com/view/sru/01CALS_HUL?';

  const url = new URL(baseUrl);

  url.searchParams.append('version', '1.2');
  url.searchParams.append('operation', 'searchRetrieve');
  url.searchParams.append('recordSchema', 'marcxml');
  url.searchParams.append('query', cql);
  url.searchParams.append('maximumRecords', '10');

  const response = await fetch(url);
  const data = await response.text();

  const parsedXml = parser.parse(data);

  console.log(url.toString());

  return res.status(200).json(parsedXml);
});

app.get('/api/LOC/search/:isbn', async (req, res) =>
{
  //construct url
  const searchIsbn = cleanIsbn(req.params.isbn);
  const url = new URL("https://lx2.loc.gov/sru/lcdb");

  url.searchParams.append("version", "1.1");
  url.searchParams.append("operation", "searchRetrieve");
  url.searchParams.append("query", `bath.isbn= ${searchIsbn}`);
  url.searchParams.append("recordSchema", "marcxml");
  url.searchParams.append("maximumRecords", "10");

  const response = await fetch(url);
  const data = await response.text()

  const parsedXml = parser.parse(data);

  return res.status(200).json(parsedXml);
});

//MMS ID TO ALMA TEST ENDPOINT when fetched it returns loan count

app.get('/api/alma/loans/:mmsid', async (req, res) =>
{
  const searchMMSID = req.params.mmsid;
  const url = new URL(`https://api-na.hosted.exlibrisgroup.com/almaws/v1/bibs/${encodeURIComponent(searchMMSID)}/loans`);

  url.searchParams.set("format", "json");
  url.searchParams.set("loan_status", "Complete");
  url.searchParams.set("limit", "100");

  console.log(url.toString());
  try
  {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `apikey ${apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok)
    {
      console.error("alma api error", response.status);

    }

    const data = await response.json();
    console.log(data);

    return res.json(data);

  } catch (error)
  {
    console.error("error getting item", error);
  }

});


// sanitize ISBN provided by user (remove hyphens and spaces. Make any "X" value uppercase)
function cleanIsbn(rawIsbn)
{
  return rawIsbn.replaceAll('-', '').replaceAll(' ', '').toUpperCase();
}

// check that sanitized ISBN has the correct shape/structure (13 digits, or 9 digits followed by another digit or X (for ISBN-10))
function isValidIsbn(isbn)
{
  const pattern = /^(\d{13}|\d{9}[\dX])$/;
  return pattern.test(isbn);
}

app.get('/api/owned/:isbn', async (req, res) =>
{
  const isbn = cleanIsbn(req.params.isbn);

  // reject input that isnt a valid ISBN (HTTP error code 400 return)
  if (!isValidIsbn(isbn))
  {
    return res.status(400).json({ error: 'Invalid ISBN' });
  }

  // building alma catalogue search URL (ISBN search)
  // reference URL from Brianne
  // https://na03.alma.exlibrisgroup.com/view/sru/01CALS_HUL?version=1.2&operation=searchRetrieve&
  // recordSchema=marcxml&query=alma.PermanentCallNumber=E184&maximumRecords=10
  const url = new URL('https://na03.alma.exlibrisgroup.com/view/sru/01CALS_HUL');
  url.searchParams.append('version', '1.2');
  url.searchParams.append('operation', 'searchRetrieve');
  url.searchParams.append('recordSchema', 'marcxml');
  url.searchParams.append('query', `alma.isbn=${isbn}`);
  url.searchParams.append('maximumRecords', '1');

  try
  {
    // stop if catalog query takes longer than 5 seconds
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    // handle error page response
    if (!response.ok)
    {
      return res.status(502).json({ error: 'Library catalog returned an error' });
    }

    // query catalog and parse the XML to a JS object
    const data = await response.text();
    const parsedXml = parser.parse(data);

    // count how many records matched
    // If > 0 the library owns the book already
    let count = 0;
    const searchResponse = parsedXml.searchRetrieveResponse;

    if (searchResponse && searchResponse.numberOfRecords)
    {
      count = searchResponse.numberOfRecords;
    }

    return res.status(200).json({
      isbn: isbn,
      owned: count > 0,
      numberOfRecords: count
    });
  }
  catch (error)
  {
    // catalog couldn't be reached or took too long
    console.error('Ownership check failed: ', error);
    return res.status(502).json({ error: 'Could not reach the library catalog' });
  }
});

// for ranking offers, 'total' will be used if known, but if not, will just use 'price' (no shipping costs included)
// if neither 'total' nor 'price' are known, place listing at the end of the list (by returning 'Infinity')
// the use of sort() in the try/catch block of the '/api/prices' route implementation will always push Infinity
// return values to the back
function sortValue(offer)
{
  if (offer.total !== null)
  {
    return offer.total;
  }
  if (offer.price !== null)
  {
    return offer.price;
  }
  return Infinity;
}

// *** Price Search ***
// Examples:
//    /api/prices?isbn=9780963112309
//    /api/prices?title=ramen obsession&author=imatome&condition=used
app.get('/api/prices', async (req, res) =>
{
  const rawIsbn = req.query.isbn || '';
  const title = req.query.title || '';
  const author = req.query.author || '';
  const condition = req.query.condition || 'any';

  // error check for making sure at least an ISBN, title, or author is included since at least one is needed for the search
  if (rawIsbn === '' && title === '' && author === '')
  {
    return res.status(400).json({ error: 'Enter an ISBN, title, or author' });
  }

  let isbn = '';
  if (rawIsbn !== '')
  {
    isbn = cleanIsbn(rawIsbn);
    if (!isValidIsbn(isbn))
    {
      return res.status(400).json({ error: 'Invalid ISBN' });
    }
  }

  const keywords = `${title} ${author}`.trim();

  try
  {
    // reference 'ebay.js' for implementation details of searchEbay() function
    const offers = await searchEbay(isbn, keywords, condition);

    // cheapest first (reference sortValue() function above, and sort() docs for details)
    offers.sort((a, b) => sortValue(a) - sortValue(b));

    return res.status(200).json({ count: offers.length, offers: offers });
  }
  catch (error)
  {
    console.error('Price search failed: ', error);
    return res.status(502).json({ error: 'Could not get prices from eBay' });
  }
});

// ********
// OPEN LIBRARY API ENDPOINT FOR TESTING IF AN ISBN EXISTS
// ********
app.get('/api/openlibrary/:isbn', async (req, res) =>
{
  const url = new URL(`https://openlibrary.org/isbn/${req.params.isbn}.json`);
  const isbn = cleanIsbn(req.params.isbn);
  const response = await fetch(url);

  if(response.status === 404){
    return res.json("does not exist");
  } 
  if(response.status === 200){
    return res.json("exists");
  }
  else{return res.json("server error");}
  
});

app.listen(port, () =>
{
  console.log(`Server running on http://localhost:${port}`);
});

