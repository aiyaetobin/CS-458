import React from 'react';

function Dashboard( {user }) { //keeping track of user done by App.jsx

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>

      <form method="POST">
        <label htmlFor="search">Title</label>
        <input type="text" id="Title" name="Title"/>

        <label htmlFor="ISBN">ISBN</label>
        <input type="text" id="ISBN" name="ISBN"/>

        <label htmlFor="Author">Author</label>
        <input type="text" id="Author" name="Author"/>

       

        <button type="submit">Search</button>

      </form>
    </div>
  );
}

export default Dashboard;