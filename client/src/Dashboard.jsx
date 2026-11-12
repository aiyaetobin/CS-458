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
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [condition, setCondition] = useState(''); // '', 'new', 'used', or 'both'
  const [searchStatus, setSearchStatus] = useState('idle'); // idle, loading, success, or error
  const [searchError, setSearchError] = useState('');
  const [offers, setOffers] = useState([]);
  const [searchedIsbn, setSearchedIsbn] = useState('');
  const activeSearch = useRef(null); // lets a new search cancel one that's still running
  const [reportIsbnInput, setReportIsbnInput] = useState(''); // the report's own ISBN field
  const [reportStatus, setReportStatus] = useState('idle'); // idle, loading, success, or error
  const [reportError, setReportError] = useState('');
  const [reportItems, setReportItems] = useState([]);
  const [reportIsbn, setReportIsbn] = useState('');
  const activeReport = useRef(null); // lets a new report cancel one that's still running

  const handleSubmit = async (event) =>
  {
    event.preventDefault(); // stops the browser submitting the form

    activeSearch.current?.abort();

    const trimmedIsbn = isbn.trim();
    const criteria = {
      isbn: trimmedIsbn,
      title: title.trim(),
      author: author.trim(),
      condition
    };

    // at least one of the four fields has to be filled in
    if (Object.values(criteria).every((value) => value === ''))
    {
      setSearchError('Enter an ISBN, title, author, or condition to search.');
      setSearchStatus('error');
      return;
    }

    // TODO: send title, author, and condition to the backend once it supports them
    console.log('Search criteria:', criteria);

    if (trimmedIsbn === '')
    {
      setSearchStatus('unsupported');
      setSearchError('');
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

  // runs generateReport() on the server (see server/services/generateReport.js)
  const handleGenerateReport = async (event) =>
  {
    event.preventDefault(); // stops the browser submitting the form

    activeReport.current?.abort();

    const trimmedIsbn = reportIsbnInput.trim();
    if (trimmedIsbn === '')
    {
      setReportError('Enter an ISBN to generate a report.');
      setReportStatus('error');
      return;
    }

    const controller = new AbortController();
    activeReport.current = controller;

    setReportStatus('loading');
    setReportError('');
    setReportIsbn(trimmedIsbn);

    try
    {
      const params = new URLSearchParams({ isbn: trimmedIsbn });
      const response = await fetch(`http://localhost:3000/api/report?${params}`, {
        credentials: 'include',
        signal: controller.signal
      });
      const data = await response.json();

      if (!response.ok)
      {
        setReportError(data.error || 'Could not generate a report. Please try again.');
        setReportStatus('error');
        return;
      }

      setReportItems(data.items);
      setReportStatus('success');
    } catch (error)
    {
      if (error.name === 'AbortError')
      {
        return; // a newer report replaced this one
      }

      console.error('Error generating report:', error);
      setReportError('Could not generate a report. Please try again.');
      setReportStatus('error');
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
          <p className="search-intro">Welcome, {user.name}! Search by ISBN, title, author, or condition.</p>

          <form onSubmit={handleSubmit}>
            <div className="search-fields">
              <div className="search-field">
                <label className="search-label" htmlFor="ISBN">ISBN</label>
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
              </div>

              <div className="search-field">
                <label className="search-label" htmlFor="title">Title</label>
                <input
                  className="search-input"
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g. The Hobbit"
                  autoComplete="off"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="search-field">
                <label className="search-label" htmlFor="author">Author</label>
                <input
                  className="search-input"
                  type="text"
                  id="author"
                  name="author"
                  placeholder="e.g. J.R.R. Tolkien"
                  autoComplete="off"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                />
              </div>

              <div className="search-field">
                <label className="search-label" htmlFor="condition">Condition</label>
                <select
                  className="search-input"
                  id="condition"
                  name="condition"
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                >
                  <option value="">Any</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>
            </div>

            <p className="search-hint">Fill in at least one field.</p>
            <button className="search-button" type="submit">Search</button>
          </form>
        </section>

        <section className="card search-panel">
          <h2 className="search-title">Least-used report</h2>
          <p className="search-intro">Find the 5 least-loaned items in the section an ISBN would be shelved in.</p>

          <form onSubmit={handleGenerateReport}>
            <label className="search-label" htmlFor="report-isbn">ISBN</label>
            <div className="search-row">
              <input
                className="search-input"
                type="text"
                id="report-isbn"
                name="report-isbn"
                placeholder="e.g. 9781433502415"
                autoComplete="off"
                value={reportIsbnInput}
                onChange={(event) => setReportIsbnInput(event.target.value)}
              />

              <button className="search-button" type="submit">Generate report</button>
            </div>
          </form>
        </section>

        {reportStatus === 'loading' && (
          <p className="empty-state" role="status">Generating report for {reportIsbn}...</p>
        )}

        {reportStatus === 'error' && (
          <p className="search-error" role="alert">{reportError}</p>
        )}

        {reportStatus === 'success' && (
          <section className="card report-card">
            <h2 className="results-title">Least-used items</h2>
            {reportItems.length === 0 ? (
              <p className="results-summary">No items found in the same section as {reportIsbn}.</p>
            ) : (
              <>
                <p className="results-summary">
                  {reportItems.length} least-loaned {reportItems.length === 1 ? 'item' : 'items'} in the section {reportIsbn} would go in.
                </p>
                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th scope="col">Book</th>
                        <th scope="col" className="numeric">Loans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportItems.map((item) => (
                        <tr key={item.isbn}>
                          <td className="report-book-cell">
                            <span className="report-book-title">{item.title}</span>
                            <span className="report-book-details">
                              {item.author} · ISBN {item.isbn}
                            </span>
                          </td>
                          <td className="numeric">{item.loanCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {searchStatus === 'idle' && (
          <p className="empty-state">Results will appear here after you search.</p>
        )}

        {searchStatus === 'unsupported' && (
          <p className="empty-state" role="status">
            Searching by title, author, or condition isn't connected yet. Add an ISBN to get prices.
          </p>
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
