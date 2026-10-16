import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import Dashboard from './Dashboard.jsx';
import { useState, useEffect } from 'react';



function App()
{
  console.log("APP COMPONENT IS RENDERING");
  const [user, setUser] = useState(null); //automatically sets user to null when the page is refreshed

  //gets /session after the page is loaded to check if user is logged in 
  useEffect(() =>
  {
    console.log("Checking session...");

    fetch('http://localhost:3000/session', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data =>
      {
        if (data.loggedIn)
        {
          setUser(data.user);
        }
        console.log("Session response:", data);
      })
      .catch(error =>
      {
        console.error("Session error:", error);
      });

  }, []);

  //gets /session after the page is loaded to check if user is logged in 
 

  const handleLoginSuccess = async (credentialResponse) =>
  {
    try
    {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        credentials: 'include', //for session cookie
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: credentialResponse.credential })
      }
      );
      const data = await response.json();

      if (!response.ok)
      {
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful:', data.user);

      setUser(data.user);

    } catch (error)
    {
      console.error('Error during login:', error);
    }
  }
  return (

    user ? (//user logged in show dashboard 
      <div>
        <Dashboard user={user} />
      </div>

    ) : (//user not logged in show login page
      <div>
        <h1>BOOK-LOOK</h1>
        <p>Login</p>

        <GoogleLogin
          /*
          if the google login is successful we send the credential to the backend sending a
           post to the backend login endpoint in json form which the endpoint
          handles and then the backend sends the credential back in json 
          */
          onSuccess={async (credentialResponse) =>
          {
            await handleLoginSuccess(credentialResponse);
          }}
          onError={() =>
          {
            console.log('Login Failed');
          }}
        />
      </div>
    )
  );
}



export default App;