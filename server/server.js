require('dotenv').config();
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const session = require('express-session');
const { XMLParser } = require("fast-xml-parser");

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

  // Add query parameters
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
  const searchIsbn = req.params.isbn;
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

app.get('/api/owned/:isbn', async (req, res) =>
{
  const isbn = req.params.isbn;

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

  // query catalog and parse the XML to a JS object
  const response = await fetch(url);
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
});

app.listen(port, () =>
{
  console.log(`Server running on http://localhost:${port}`);
});

