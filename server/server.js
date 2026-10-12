const express = require('express');


const app = express();
const port = 3000;

//middleware
app.use(express.json());


//login endpoint
app.get('/login', async (req, res) => {
  console.log(req.body);

  res.status(200).json({
    message: "Login endpoint received your request"
  });
});


app.post('/search', async (req, res) => {
  
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});