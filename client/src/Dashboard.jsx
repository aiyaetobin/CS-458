import React, { useRef, useState } from 'react';
import UserMenu from './UserMenu.jsx';

// a missing cost is unknown, not $0 (same rule as toOffer() in ebay.js)
function formatPrice(value)
{
  return value === null ? 'Unknown' : `$${value.toFixed(2)}`;
}

function Dashboard({ user, onSignOut })
{ //keeping track of user done by App.jsx
  const [isbn, setIsbn] = useState('');
  const [searchStatus, setSearchStatus] = useState('idle'); // idle, loading, success, or error
  const [searchError, setSearchError] = useState('');
  const [offers, setOffers] = useState([]);
  const [searchedIsbn, setSearchedIsbn] = useState('');
  const activeSearch = useRef(null); // lets a new search cancel one that's still running

  const handleSubmit = async (event) =>
  {
    event.preventDefault(); // stops the browser submitting the form

    activeSearch.current?.abort();

    const trimmedIsbn = isbn.trim();
    if (trimmedIsbn === '')
    {
      setSearchError('Enter an ISBN to search.');
      setSearchStatus('error');
      return;
    }

    const controller = new AbortController();
    activeSearch.current = controller;

    setSearchStatus('loading');
    setSearchError('');
    setSearchedIsbn(trimmedIsbn);

    try
    {
      const params = new URLSearchParams({ isbn: trimmedIsbn });
      const response = await fetch(`http://localhost:3000/api/prices?${params}`, {
        credentials: 'include',
        signal: controller.signal
      });
      const data = await response.json();

      if (!response.ok)
      {
        setSearchError(data.error || 'Could not get prices. Please try again.'); // e.g. "Invalid ISBN"
        setSearchStatus('error');
        return;
      }

      setOffers(data.offers);
      setSearchStatus('success');
    } catch (error)
    {
      if (error.name === 'AbortError')
      {
        return; // a newer search replaced this one
      }

      console.error('Error during price search:', error);
      setSearchError('Could not get prices. Please try again.');
      setSearchStatus('error');
    }
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

        {searchStatus === 'idle' && (
          <p className="empty-state">Results will appear here after you search.</p>
        )}

        {searchStatus === 'loading' && (
          <p className="empty-state" role="status">Searching eBay for {searchedIsbn}...</p>
        )}

        {searchStatus === 'error' && (
          <p className="search-error" role="alert">{searchError}</p>
        )}

        {searchStatus === 'success' && (
          <section className="card">
            <h2 className="results-title">eBay prices</h2>
            {offers.length === 0 ? (
              <p className="results-summary">No Buy It Now listings found for {searchedIsbn}.</p>
            ) : (
              <>
                <p className="results-summary">
                  {offers.length} {offers.length === 1 ? 'listing' : 'listings'} for {searchedIsbn}, cheapest first.
                </p>
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
                      {offers.map((offer) => (
                        <tr key={offer.link}>
                          <td className="listing-title">
                            <a href={offer.link} target="_blank" rel="noopener noreferrer">{offer.title}</a>
                          </td>
                          <td>{offer.condition}</td>
                          <td className="numeric">{formatPrice(offer.price)}</td>
                          <td className="numeric">{formatPrice(offer.shipping)}</td>
                          <td className="numeric">{formatPrice(offer.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
