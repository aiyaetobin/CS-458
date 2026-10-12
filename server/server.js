const express = require('express');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//middleware
app.use(express.json());


//login endpoint
app.post('/login', async (req, res) => {
  const {credential} = req.body;

  // verify google token
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

    return res.status(200).json({
        message: 'Google authentication successful',
        user
    });
  }catch(error){
    return res.status(401).json({
    error: 'Invalid Google credential'
    });
  }
});


app.post('/search', async (req, res) => {
  
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});