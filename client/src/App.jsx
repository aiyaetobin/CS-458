import React from 'react';
import { GoogleLogin } from '@react-oauth/google';



function App() {

    
  console.log(
    "Google Client ID loaded:",
    Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
  );
  return (
    <div>
      <h1>BOOK-LOOK</h1>
      <p>Login</p>
      <GoogleLogin

        /*
        if the google login is successful we send the credential to the backend by fetching 
        the info from the backend login endpoint in json form which the endpoint
        handles and then the backend sends the credential back in json 
        */

        onSuccess={async (credentialResponse) => {
          try {
            const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ credential: credentialResponse.credential })
          }
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          console.log('Login successful:', data.user);

          }catch(error) {
            console.error('Error during login:', error);
          }
        }}
        onError={() => {
          console.log('Login Failed');
        }}

      />

    </div>
  );
}



export default App;