const express = require('express');

const app = express();


//search endpoint
//when request to endpoint it should make a call to whatever is sending a 
app.post('search', async (req, res)){
  
} 


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});