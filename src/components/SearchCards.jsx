import { useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import cnf from "../assets/cnf.png"

export default function SearchCards() {
  const [query, setQuery] = useState("");
  const [auctionResults, setAuctionResults] = useState([]);
  const [fixedPriceResults, setFixedPriceResults] = useState([]);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [tcgbookmarks, settcgBookmarks] = useState([]);
  const [bookmarksInitialized, setBookmarksInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soldResults, setSoldResults] = useState([]);
  const EPN_CAMPAIGN_ID = "5339116843";

const appendEPNTracking = (url) => {
  try {
    const u = new URL(url);
    u.searchParams.set("campid", EPN_CAMPAIGN_ID);
    return u.toString();
  } catch (err) {
    console.error("Invalid eBay URL:", url);
    return url;
  }
};


  const fetchCards = async (searchTerm) => {
    try {
      const encodedQuery = encodeURIComponent(searchTerm || query);
      setLoading(true);
      // Fetch SOLD items
      const soldRes = await fetch(
        `https://tcgbackend.onrender.com/api/sold?term=${encodedQuery}`
      );
      const soldData = await soldRes.json();
      // Fetch AUCTION items
      const auctionRes = await fetch(
        `https://tcgbackend.onrender.com/api/search?q=${encodedQuery}&filter=${encodeURIComponent("buyingOptions:{AUCTION}")}`
      );
      const auctionData = await auctionRes.json();
      console.log(auctionData)

      // Fetch FIXED_PRICE items
      const fixedRes = await fetch(
        `https://tcgbackend.onrender.com/api/search?q=${encodedQuery}&filter=${encodeURIComponent("buyingOptions:{FIXED_PRICE}")}`
      );
      const fixedData = await fixedRes.json();
      
      setSoldResults(soldData || []);
      setAuctionResults(auctionData.itemSummaries || []);
      setFixedPriceResults(fixedData.itemSummaries || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
    setHasSearched(true);
    setLoading(false);
  };

// Function to handle adding a card to bookmarks

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("tcgbookmarks"));
    if (stored) settcgBookmarks(stored);
    setBookmarksInitialized(true);
  }, []);

useEffect(() => {
  if (bookmarksInitialized) {
    localStorage.setItem("tcgbookmarks", JSON.stringify(tcgbookmarks));
  }
}, [tcgbookmarks, bookmarksInitialized]);

    const handleBookmark = () => {
    const trimmed = query.trim();
    if (!trimmed || tcgbookmarks.includes(trimmed)) return;
    settcgBookmarks(prev => [...prev, trimmed]);
    setQuery("");
  };

  const handleBookmarkClick = (term) => {
    setQuery(term);
    fetchCards(term);
  };

  const handleRemoveBookmark = (termToRemove) => {
    const updated = tcgbookmarks.filter(term => term !== termToRemove);
    settcgBookmarks(updated);
  };

  return (
    <div className="container">
      <div className="inputDiv">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchCards(query);
                }}
                placeholder="Search trading cards (e.g., Charizard)"
              />
              <button
                onClick={() => fetchCards(query)}
                style={{ padding: "0.5rem 1rem", height: "41px", borderRadius: "0", backgroundColor: "#00bfff", color: "black", border: "1px solid transparent" }}
              >
                Search
              </button> 
              <button  className='bookmark3' style={{borderRadius: '0 8px 8px 0', backgroundColor: '#2a2e45'}}onClick={handleBookmark}>🔖</button>

      </div>
      

      {error && <p>{error}</p>}
      
      {tcgbookmarks.length > 0 && (
        <div style={{ marginTop: "1em", textAlign: "center" }}>
          <h3 className="subHead">Bookmarked Searches</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5em", justifyContent: "center", width: '80%', margin: '0 auto' }}>
            {tcgbookmarks.map((term, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.2em" }}>
                <button className='bookmark1' onClick={() => handleBookmarkClick(term)}>{term}</button>
                <button className='bookmark2' onClick={() => handleRemoveBookmark(term)} style={{ fontSize: "0.8em" }}>❌</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading && (
        <div>
          <DotLottieReact
            src="https://lottie.host/f5a82384-f2ff-457a-a3ea-0a26c9825f8a/WEarna6TOe.lottie"
            loop
            autoplay
            className="pikachuLoading"
          />
          <p style={{ textAlign: "center" }}>Loading... This can take up to 60s</p>
        </div>
      )}

      {!hasSearched && (
        <div>
        <div className="howToUse">
          <h3>View Listings</h3>
          <p>
            On this page, enter a Pokémon card name in the search bar and click search. 
            You may bookmark a search by clicking the button beside search
          </p>
          <h3>Add Cards to your Collection</h3>
          <p>
            Head to the <a style={{textDecoration: 'underline'}} href="/cards">Pokemon</a> tab to view all cards for a specific Pokémon.
            You can select a condition for each card and add it to your collection.
          </p>
          <h3>View Your Cards</h3>
          <p>
            Go to the <a style={{textDecoration: 'underline'}} href="/mycards">My Cards</a> tab to see all the cards you've added, their conditions, average sold prices, and a rough Estimated
            value of your collection.
          </p>

        </div>
        <div className="howToUse">
                  <p style={{fontSize: '0.7em', marginTop: '3em'}}>NOTE: clicking on links to some listings from this site and make a purchase,  can result in this site earning a commission. Affiliate programs and affiliations include, but are not limited to, the eBay Partner Network.
</p>
        </div>
        </div>

        
      )}
      {hasSearched && (
        <>

{/* Sold Listings Section */}
<div className="hello">
  <h2 className='subHead' style={{ fontFamily: '"Luckiest Guy", sans-serif', textAlign: 'center' }}>Sold Listings (USD)</h2>

  <ul className="resultsList">
    {soldResults.map((item, i) => (
      <li key={i}>
        <strong>{item.title}</strong>
        <p>
          {item.wasOfferAccepted ? (
            <>
              <span style={{ textDecoration: 'line-through', color: 'gray' }}>
                {item.originalPrice}
              </span>{" "}
              <span style={{ color: 'limegreen', fontWeight: 'bold' }}>
                SOLD {item.salePrice}
              </span>
            </>
          ) : (
            <span style={{ color: 'limegreen', fontWeight: 'bold' }}>
              SOLD {item.salePrice}
            </span>
          )}
        </p>
        {item.gradeService ?
          <p>{item.gradeService} {item.gradeScore}</p> : <p>RAW</p>
        }
        <p>{item.date}</p>
        <img width={150} src={item.image || cnf} alt="Sold item" />
        <a
          href={appendEPNTracking(item.link)}
          target="_blank"
          rel="noopener noreferrer"
          className="vob"
        >
          View on eBay
        </a>
      </li>
    ))}
    {soldResults.length === 0 && <p>No sold results found.</p>}
  </ul>
</div>

{/* Auction Listings */}
<div className="hello">
  <h2 className='subHead' style={{ fontFamily: '"Luckiest Guy", sans-serif', textAlign: 'center' }}>Auction Listings</h2>
  <ul className="resultsList">
    {auctionResults.map((item) => (
      <li key={item.itemId}>
        <strong>{item.title}</strong>
        <p>Current Bid: <span style={{ color: 'limegreen', fontWeight: 'bold' }}>${item.currentBidPrice?.value} {item.currentBidPrice?.currency}</span></p>
        <p>Bids: {item.bidCount}</p>
        <img width={150} src={item.image.imageUrl} alt="Auction item" />
        <a
          href={appendEPNTracking(item.itemWebUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="vob"
        >
          View on eBay
        </a>
      </li>
    ))}
    {auctionResults.length === 0 && <p>No auction results found.</p>}
  </ul>
</div>

{/* Fixed Price Listings */}
<div className="hello">
  <h2 className='subHead' style={{ fontFamily: '"Luckiest Guy", sans-serif', textAlign: 'center' }}>Fixed Price Listings</h2>
  <ul className="resultsList">
    {fixedPriceResults.map((item) => (
      <li key={item.itemId}>
        <strong>{item.title}</strong>
        <p><span style={{ color: 'limegreen', fontWeight: 'bold' }}>${item.price?.value} {item.currentBidPrice?.currency}</span></p>
        <img width={150} src={item.image.imageUrl} alt="Fixed price item" />
        <a
          href={appendEPNTracking(item.itemWebUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="vob"
        >
          View on eBay
        </a>
      </li>
    ))}
    {fixedPriceResults.length === 0 && <p>No fixed price results found.</p>}
  </ul>
</div>
      </>)}
    </div>
  );
}