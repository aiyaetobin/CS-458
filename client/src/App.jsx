import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import Dashboard from './Dashboard.jsx';
import { useState } from 'react';



function App() {

    const [user, setUser] = useState(null);

    const handleLoginSuccess = async (credentialResponse) => {
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
            
            setUser(data.user);

          }catch(error) {
            console.error('Error during login:', error);
          }
        }
  return (
    
    user ?(//user logged in show dashboard 
      <div>
      <Dashboard user={user} />
      </div> 

    ): (//user not logged in show login page
      <div>
      <h1>BOOK-LOOK</h1>
      <p>Login</p>
    
      <GoogleLogin
        /*
        if the google login is successful we send the credential to the backend sending a
         post to the backend login endpoint in json form which the endpoint
        handles and then the backend sends the credential back in json 
        */
        onSuccess={async (credentialResponse) => {
          await handleLoginSuccess(credentialResponse);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />
    </div>
    )
  );
}



export default App;