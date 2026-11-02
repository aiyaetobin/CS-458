// the contents of this file are for talking to eBay's Browse API and retrieving an access token
// eBay access tokens are valid for 2 hours
// the current one will be saved here so we don't have to request a new token each time we query their product API

let cachedToken = null;
let tokenExpiresAt = 0;     // time the token expires

async function getEbayToken()
{
  // reuse the saved token if it still has time left
  if (cachedToken && (Date.now() < tokenExpiresAt - 60000))
  {
    return cachedToken;
  }

  // eBay specifies wanting HTTP Basic authentication style verification ('clientId:clientSecret' encoded in Base64)
  const credentials = `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${encodedCredentials}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope'
    }),
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok)
  {
    const errorText = await response.text();
    throw new Error(`eBay token request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // save the token returned and determine when its expiration is
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  return cachedToken;
}

// convert one eBay listing into a simple offer format
// rest of our application wont have to deal w/ eBays format
function toOffer(item)
{
  // converting prices to numbers since eBay sends them as text
  let price = null;
  if (item.price && item.price.value)
  {
    price = Number(item.price.value);
  }

  let shipping = null;
  if (item.shippingOptions && (item.shippingOptions.length > 0) && item.shippingOptions[0].shippingCost)
  {
    shipping = Number(item.shippingOptions[0].shippingCost.value);
  }

  // test plan says missing costs shouldn't be treated as 0
  // the total is technically only known if both price and shipping costs are known
  let total = null;
  if (price !== null && shipping !== null)
  {
    total = Math.round((price + shipping) * 100) / 100;
  }

  return {
    vendor: 'eBay',
    title: item.title,
    condition: item.condition || 'Unknown',
    price: price,
    shipping: shipping,
    total: total,
    currency: item.price ? item.price.currency : 'USD',
    seller: item.seller ? item.seller.username : null,
    link: item.itemWebUrl,
    image: item.image ? item.image.imageUrl : null
  };
}

// for searching eBays "Books & Magazines" category and returning a list of offers
// isbn: sanitized ISBN (or '' if searching by keyword)
// keywords: title/author (or '' if searching by ISBN)
// condition: 'new', 'used', or 'any'
async function searchEbay(isbn, keywords, condition)
{
  const token = await getEbayToken();

  const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');

  // eBay can match ISBN-13's directly since theyre exact product codes (gtin)
  // eBay can't do this w/ ISBN-10's, so these have to be used for text search instead
  // https://developer.ebay.com/develop/api/buy/browse_api#buy-browse_api-item_summary-search
  if (isbn.length === 13)
  {
    url.searchParams.append('gtin', isbn);
  }
  else if (isbn.length === 10)
  {
    url.searchParams.append('q', isbn);
  }
  else
  {
    url.searchParams.append('q', keywords);
  }

  // https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_subtree?category_id=267
  url.searchParams.append('category_ids', '267');     // 267 is eBays "Books & Magazines" category (https://www.ebay.com/b/Books-Magazines/267/bn_1854946)
  url.searchParams.append('limit', '25');

  // Auctions and bids aren't actual prices, so only use 'Buy It Now' listings
  // https://developer.ebay.com/api-docs/buy/ref-buy-browse-filters.html
  let filter = 'buyingOptions:{FIXED_PRICE}';
  if (condition === 'new')
  {
    filter = filter + ',conditions:{NEW}';
  }
  else if (condition === 'used')
  {
    filter = filter + ',conditions:{USED}';
  }
  url.searchParams.append('filter', filter);

  // https://developer.ebay.com/develop/api/buy/browse_api#buy-browse_api-item_summary-search
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      // ship-to location as Arcata (95521) for accurate shipping costs
      'X-EBAY-C-ENDUSERCTX': 'contextualLocation=' + encodeURIComponent('country=US,zip=95521')
    },
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok)
  {
    const errorText = await response.text();
    throw new Error(`eBay search failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // eBay leaves out 'itemSummaries' completely when nothing matches, so we can use it to check
  if (!data.itemSummaries)
  {
    return [];
  }

  const offers = [];
  for (const item of data.itemSummaries)
  {
    // apparently eBay sometimes just ignores the "Buy It Now" filter in top level categories like "Books & Magazines"
    // this is just a double check. Not a huge deal to see auctions but I think this is prob best way
    if (item.buyingOptions && item.buyingOptions.includes('FIXED_PRICE'))
    {
      offers.push(toOffer(item));
    }
  }
  return offers;
}

module.exports = { searchEbay };