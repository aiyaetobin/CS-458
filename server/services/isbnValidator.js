//******* 
// This function first checks if the isbn exists in open library's database
// Then it checks if it is valid by checking if it is 10 or 13 characters long
// Then it checks if it contains any letters 
//*******  
 

async function validIsbn(ibsn) {
    //clean format
  const isbn = ibsn.replaceAll('-', '').replaceAll(' ', '').toUpperCase();

  const response = await fetch(`http://localhost:3000/api/openlibrary/${encodeURIComponent(ibsn)}`);

  const isValid = await response.json();
  
  console.log(isValid);
  if(isValid === "server error"){
    return 'Error checking ISBN in Open Library';
  }


  //isbn must be 10 or 13 characters long
  if(!(isbn.length === 10 || isbn.length === 13)){
    return 'ISBN must be 10 or 13 characters long';
  }
  //is nan returns true if the value is not a number

  const pattern = /^(\d{13}|\d{9}[\dX])$/;

  if(!pattern.test(isbn)){
    return 'ISBN 13 must contain only numbers, ISBN 10 can contain numbers and X';
  }

  if(isValid === "does not exist"){
    return 'ISBN not found in Open Library';
  }


  return true;
}

module.exports = { validIsbn };

