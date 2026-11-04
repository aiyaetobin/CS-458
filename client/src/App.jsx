import React from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import Dashboard from './Dashboard.jsx';
import { useState, useEffect } from 'react';



function App()
{
  console.log("APP COMPONENT IS RENDERING");
  const [user, setUser] = useState(null); //automatically sets user to null when the page is refreshed
  const [checkingSession, setCheckingSession] = useState(true); //stops the login page flashing while /session loads
  const [loginError, setLoginError] = useState('');

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
      })
      .finally(() =>
      {
        setCheckingSession(false);
      });

  }, []);

  //gets /session after the page is loaded to check if user is logged in 
 

  const handleLoginSuccess = async (credentialResponse) =>
  {
    setLoginError('');

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
      setLoginError('Sign-in failed. Please try again.');
    }
  }

  //only clears the user once the backend session is gone, otherwise a refresh would log them back in
  const handleSignOut = async () =>
  {
    const response = await fetch('http://localhost:3000/logout', {
      method: 'POST',
      credentials: 'include' //for session cookie
    });

    if (!response.ok)
    {
      throw new Error('Logout failed');
    }

    googleLogout();
    setUser(null);
  }

  if (checkingSession)
  {
    return (
      <div className="page-center">
        <p className="status-text" role="status">Loading...</p>
      </div>
    );
  }

  return (

    user ? (//user logged in show dashboard
      <div>
        <Dashboard user={user} onSignOut={handleSignOut} />
      </div>

    ) : (//user not logged in show login page
      <div className="page-center">
        <main className="login-card">
        <h1 className="login-title">BOOK-LOOK</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <GoogleLogin
          theme="outline"
          size="large"
          width="280"
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
            setLoginError('Sign-in failed. Please try again.');
          }}
        />

        {loginError && <p className="login-error" role="alert">{loginError}</p>}
        </main>
      </div>
    )
  );
}



export default App;