require('dotenv').config();
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
 
const app = express();
const port = 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//middleware
app.use(express.json());
app.use(cors({origin: 'http://localhost:5173'}));

/* LOGIN ENDPOINT

 The front end sends a POST request to /login with the body being set as the 
 credential from GoogleLogin. The endpoint verifies the credential it gets using
 verifyIdToken. it creates a user object with everything it needs from the payload
 it then sends the endpoint response back to the fron end 
*/
app.post('/login', async (req, res) => {
  const {credential} = req.body; //from front end post request body

    try{
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

    return res.status(200).json({ //send json user back if successful
        message: 'Google authentication successful',
        user
    });

  }catch(error){
    return res.status(401).json({ 
    error: 'Invalid Google credential'
    });
  }
});


app.get('/search', async (req, res) => {
    
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});