import { useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function SearchCards() {
  const [query, setQuery] = useState("");
  const [auctionResults, setAuctionResults] = useState([]);
  const [fixedPriceResults, setFixedPriceResults] = useState([]);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [tcgbookmarks, settcgBookmarks] = useState([]);
  const [bookmarksInitialized, setBookmarksInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCards = async (searchTerm) => {
    try {
      const encodedQuery = encodeURIComponent(searchTerm || query);
      setLoading(true);
      // Fetch AUCTION items
      const auctionRes = await fetch(
        `https://tcgbackend.onrender.com/search?q=${encodedQuery}&filter=${encodeURIComponent("buyingOptions:{AUCTION}")}`
      );
      const auctionData = await auctionRes.json();
      console.log(auctionData)

      // Fetch FIXED_PRICE items
      const fixedRes = await fetch(
        `https://tcgbackend.onrender.com/api/search?q=${encodedQuery}&filter=${encodeURIComponent("buyingOptions:{FIXED_PRICE}")}`
      );
      const fixedData = await fixedRes.json();

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
    <div>
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
          />
          <p style={{ textAlign: "center" }}>Loading...</p>
        </div>
      )}
      {/* Auction Section */}
      {hasSearched && (
        <>
      <div className="hello">
        <h2 className='subHead' style={{fontFamily: '"Luckiest Guy", sans-serif', textAlign: 'center'}}>Auction Listings</h2>
        <ul className="cardUl">
          {auctionResults.map((item) => (
            <li key={item.itemId}>
              <strong>{item.title}</strong>
              <p>Current Bid: ${`${item.currentBidPrice.value} ${item.currentBidPrice.currency}`}</p>
              <p>No. of bids: {item.bidCount}</p>
              <img width={200} src={item.image.imageUrl} />
              <a
                href={item.itemWebUrl}
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

      {/* Fixed Price Section */}
      <div className="hello">
        <h2 className='subHead' style={{fontFamily: '"Luckiest Guy", sans-serif', textAlign: 'center'}}>Fixed Price Listings</h2>
        <ul className="cardUl">
          {fixedPriceResults.map((item) => (
            <li key={item.itemId}>
              <strong>{item.title}</strong>
              <div>{item.price?.value} {item.price?.currency}</div>
              <img width={200} src={item.image.imageUrl} />
              <a
                href={item.itemWebUrl}
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