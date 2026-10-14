import React from 'react';

function Dashboard( user ) { //keeping track of user done by App.jsx

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>

      <form method="POST">
        <label for="search">Search</label>
        <input type="text" id="search" name="search"/>
        
      </form>
    </div>
  );
}

export default Dashboard;