import React, { useState } from 'react';
import UserMenu from './UserMenu.jsx';

// PLACEHOLDER: shapes match /api/prices and generateReport.js.
// Remove these and the sample notice once search calls the real API.
const SAMPLE_OFFERS = [
  { id: 1, title: 'Sample listing A', condition: 'Used', price: 12.5, shipping: 4, total: 16.5 },
  { id: 2, title: 'Sample listing B', condition: 'New', price: 21, shipping: 0, total: 21 },
  { id: 3, title: 'Sample listing C', condition: 'Used', price: 18.75, shipping: null, total: null }
];

const SAMPLE_LEAST_USED = [
  { mmsid: 'SAMPLE-0001', loanCount: 0 },
  { mmsid: 'SAMPLE-0002', loanCount: 0 },
  { mmsid: 'SAMPLE-0003', loanCount: 1 },
  { mmsid: 'SAMPLE-0004', loanCount: 1 },
  { mmsid: 'SAMPLE-0005', loanCount: 3 }
];

// a missing cost is unknown, not $0 (same rule as toOffer() in ebay.js)
function formatPrice(value)
{
  return value === null ? 'Unknown' : `$${value.toFixed(2)}`;
}

function Dashboard({ user, onSignOut })
{ //keeping track of user done by App.jsx
  const [isbn, setIsbn] = useState('');
  const [searchedIsbn, setSearchedIsbn] = useState('');

  // stops the browser submitting the form. Search isn't connected to the API yet
  const handleSubmit = (event) =>
  {
    event.preventDefault();
    setSearchedIsbn(isbn.trim());
  };

  return (
    <div>
      <header className="topbar">
        <span className="topbar-brand">BOOK-LOOK</span>
        <UserMenu user={user} onSignOut={onSignOut} />
      </header>

      <main className="dashboard-main">
        <section className="card search-panel">
          <h1 className="search-title">Look up a book</h1>
          <p className="search-intro">Welcome, {user.name}! Enter an ISBN to start.</p>

          <form onSubmit={handleSubmit}>
            <label className="search-label" htmlFor="ISBN">ISBN</label>
            <div className="search-row">
              <input
                className="search-input"
                type="text"
                id="ISBN"
                name="ISBN"
                placeholder="e.g. 9781433502415"
                autoComplete="off"
                value={isbn}
                onChange={(event) => setIsbn(event.target.value)}
              />
              <button className="search-button" type="submit">Search</button>
            </div>
          </form>
        </section>

        {searchedIsbn === '' ? (
          <p className="empty-state">Results will appear here after you search.</p>
        ) : (
          <>
            <p className="sample-notice" role="status">
              <strong>Sample data.</strong> Search isn't connected yet, so these aren't real results for {searchedIsbn}.
            </p>

            <div className="results">
              <section className="card">
                <h2 className="results-title">Library ownership</h2>
                <span className="status-badge">Not owned</span>
                <p className="results-summary">No copies of this ISBN were found in the catalog.</p>
              </section>

              <section className="card">
                <h2 className="results-title">Prices</h2>
                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th scope="col">Listing</th>
                        <th scope="col">Condition</th>
                        <th scope="col" className="numeric">Price</th>
                        <th scope="col" className="numeric">Shipping</th>
                        <th scope="col" className="numeric">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_OFFERS.map((offer) => (
                        <tr key={offer.id}>
                          <td>{offer.title}</td>
                          <td>{offer.condition}</td>
                          <td className="numeric">{formatPrice(offer.price)}</td>
                          <td className="numeric">{formatPrice(offer.shipping)}</td>
                          <td className="numeric">{formatPrice(offer.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card">
                <h2 className="results-title">Least used in this section</h2>
                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th scope="col">MMS ID</th>
                        <th scope="col" className="numeric">Loans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_LEAST_USED.map((item) => (
                        <tr key={item.mmsid}>
                          <td>{item.mmsid}</td>
                          <td className="numeric">{item.loanCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
