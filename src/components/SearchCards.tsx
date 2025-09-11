import { useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import BackToTop from "../components/BackToTop";

type SoldCardResult = {
  itemId?: string;
  title: string;
  image?: string;
  wasOfferAccepted?: boolean;
  salePrice?: string;
  originalPrice?: string;
  gradeService?: string;
  gradeScore?: string;
  date?: string;
  link: string;
  price?: string;
};

type EbaySearchResponse<T> = {
  itemSummaries?: T[];
  total?: number;
  href?: string;
  next?: string;
};

type AuctionCardResult = {
  itemId: string;
  title: string;
  image: { imageUrl: string };
  currentBidPrice?: { value: string; currency: string };
  bidCount?: number;
  itemWebUrl: string;
};
type FixedPriceCardResult = {
  itemId: string;
  title: string;
  image: { imageUrl: string };
  price?: { value: string; currency: string };
  currentBidPrice?: { value: string; currency: string };
  itemWebUrl: string;
};

const filterOptions = [
  "NM",
  "MINT",
  "DMG",
  "HP",
  "LP",
  "GRADED 10",
  "GRADED 9",
  "GRADED 8",
  "GRADED 7",
  "GRADED 6",
  "GRADED 5",
  "GRADED 4",
  "GRADED 3",
  "GRADED 2",
  "GRADED 1",
];

export default function SearchCards() {
  const [query, setQuery] = useState<string>("");
  const [tcgResults, setTcgResults] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(() => {
    const saved = localStorage.getItem("selectedCard");
    return saved ? JSON.parse(saved) : null;
  });
  const [ebayFilters, setEbayFilters] = useState<string[]>([]);
  const [auctionResults, setAuctionResults] = useState<AuctionCardResult[]>([]);
  const [fixedPriceResults, setFixedPriceResults] = useState<FixedPriceCardResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [tcgbookmarks, settcgBookmarks] = useState<string[]>([]);
  const [bookmarksInitialized, setBookmarksInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [soldResults, setSoldResults] = useState<SoldCardResult[]>([]);
  const EPN_CAMPAIGN_ID = "5339116843";
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Step 1: Search Pokémon TCG API
  const searchTcgCards = async (searchTerm: string, card?: any) => {
    setLoading(true);
    setSelectedCard(null);
    setTcgResults([]);
    setHasSearched(false);
    setError(null);
    let queryWithYear = searchTerm;
    if (card && card.episode?.released_at) {
      const year = card.episode.released_at.slice(0, 4);
      if (year) queryWithYear += ` ${year}`;
    }
    const encodedQuery = encodeURIComponent(queryWithYear);
    const url = `https://pokemon-tcg-api.p.rapidapi.com/cards/search?search=${encodedQuery}&sort=price_highest`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_REACT_APP_RAPIDAPI_KEY || "",
        "x-rapidapi-host": import.meta.env.VITE_REACT_APP_RAPIDAPI_HOST || "",
      },
    };
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      setTcgResults(data.data || []);
      if (Array.isArray(data.data) && data.data.length === 0) {
        setError("Pokemon not found, ensure proper spelling and try again");
      }
    } catch (err) {
      setError("Failed to fetch cards.");
    }
    setLoading(false);
  };

  // Step 2: eBay search with filters, using card name, set/series, and card_number
  const fetchCardsWithFilters = async (card: any, filters: string[]) => {
    const filterString = filters.length ? " " + filters.join(" ") : "";
    const setName = card.episode?.name || "";
    const cardNumber = card.card_number ? ` ${card.card_number}` : "";
    let year = "";
    if (card.episode?.released_at) {
      year = " " + card.episode.released_at.slice(0, 4);
    }
    const searchTerm = `${card.name} ${setName}${cardNumber}${filterString}${year}`;
    fetchCards(searchTerm.trim());
  };

  // eBay fetch logic (existing)
  const fetchCards = async (searchTerm: string): Promise<void> => {
    try {
      const encodedQuery = encodeURIComponent(searchTerm || query);
      setLoading(true);

      // Fetch SOLD items
      const soldRes = await fetch(
        `http://localhost:8080/api/sold?term=${encodedQuery}`
      );
      const soldData = await soldRes.json();
      if (Array.isArray(soldData)) {
        setSoldResults(soldData);
      } else {
        setSoldResults([]);
      }

      // Fetch AUCTION items
      const auctionRes = await fetch(
        `https://tcgbackend-951874125609.us-east4.run.app/api/search?q=${encodedQuery}&filter=${encodeURIComponent(
          "buyingOptions:{AUCTION}"
        )}`
      );
      const auctionData: EbaySearchResponse<AuctionCardResult> = await auctionRes.json();

      // Fetch FIXED_PRICE items
      const fixedRes = await fetch(
        `https://tcgbackend-951874125609.us-east4.run.app/api/search?q=${encodedQuery}&filter=${encodeURIComponent(
          "buyingOptions:{FIXED_PRICE}"
        )}`
      );
      const fixedData: EbaySearchResponse<FixedPriceCardResult> = await fixedRes.json();

      setAuctionResults(auctionData.itemSummaries || []);
      setFixedPriceResults(fixedData.itemSummaries || []);
      setError(null);

      localStorage.setItem("lastQuery", encodedQuery);
      localStorage.setItem("lastSoldResults", JSON.stringify(Array.isArray(soldData) ? soldData : []));
      localStorage.setItem("lastAuctionResults", JSON.stringify(auctionData.itemSummaries || []));
      localStorage.setItem("lastFixedPriceResults", JSON.stringify(fixedData.itemSummaries || []));
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setHasSearched(true);
    setLoading(false);
  };

  const appendEPNTracking = (url: string) => {
    try {
      const u = new URL(url);
      u.searchParams.set("campid", EPN_CAMPAIGN_ID);
      return u.toString();
    } catch (err) {
      return url;
    }
  };

  const handleClearResults = (): void => {
    setQuery("");
    setSoldResults([]);
    setAuctionResults([]);
    setFixedPriceResults([]);
    setHasSearched(false);
    setError(null);
    setTcgResults([]);
    setSelectedCard(null);
    setEbayFilters([]);
    localStorage.removeItem("lastQuery");
    localStorage.removeItem("lastSoldResults");
    localStorage.removeItem("lastAuctionResults");
    localStorage.removeItem("lastFixedPriceResults");
    localStorage.removeItem("selectedCard");
  };

  useEffect(() => {
    const savedQuery = localStorage.getItem("lastQuery");
    const savedSold = localStorage.getItem("lastSoldResults");
    const savedAuction = localStorage.getItem("lastAuctionResults");
    const savedFixed = localStorage.getItem("lastFixedPriceResults");

    if (savedQuery && savedSold && savedAuction && savedFixed) {
      setQuery(decodeURIComponent(savedQuery));
      try {
        const parsedSold = JSON.parse(savedSold);
        setSoldResults(Array.isArray(parsedSold) ? parsedSold : []);
      } catch {
        setSoldResults([]);
      }
      setAuctionResults(JSON.parse(savedAuction));
      setFixedPriceResults(JSON.parse(savedFixed));
      setHasSearched(true);
    }
  }, []);

  useEffect(() => {
    const storedStr = localStorage.getItem("tcgbookmarks");
    const stored = storedStr ? JSON.parse(storedStr) : null;
    if (stored) settcgBookmarks(stored);
    setBookmarksInitialized(true);
  }, []);

  useEffect(() => {
    if (bookmarksInitialized) {
      localStorage.setItem("tcgbookmarks", JSON.stringify(tcgbookmarks));
    }
  }, [tcgbookmarks, bookmarksInitialized]);

  const handleBookmark = (): void => {
    const trimmed = query.trim();
    if (!trimmed || tcgbookmarks.includes(trimmed)) return;
    settcgBookmarks((prev) => [...prev, trimmed]);
    setQuery("");
  };

  const handleBookmarkClick = (term: string): void => {
    setQuery(term);
    searchTcgCards(term);
  };

  const handleRemoveBookmark = (termToRemove: string): void => {
    const updated = tcgbookmarks.filter((term) => term !== termToRemove);
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
            if (e.key === "Enter") searchTcgCards(query);
          }}
          placeholder="Search trading cards (e.g., Charizard)"
        />
        <button
          onClick={() => searchTcgCards(query)}
          style={{
            padding: "0.5rem 1rem",
            height: "41px",
            borderRadius: "0",
            backgroundColor: "#00bfff",
            color: "black",
            border: "1px solid transparent",
          }}
        >
          Search
        </button>
        <button
          className="bookmark3"
          style={{ borderRadius: "0 8px 8px 0", backgroundColor: "#2a2e45" }}
          onClick={handleBookmark}
        >
          🔖
        </button>
      </div>

      {error && (
        error === "Pokemon not found, ensure proper spelling and try again" ? (
          <div className="howToUse" style={{ marginTop: '2em', color: '#ffcc00', fontWeight: 600, fontSize: '1.2em', textDecoration: 'underline' }}>{error}</div>
        ) : (
          <p style={{textAlign: "center", margin: '2em 0'}}>{error}</p>
        )
      )}

      {tcgbookmarks.length > 0 && (
        <div style={{ marginTop: "1em", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5em",
              justifyContent: "center",
              width: "80%",
              margin: "0 auto",
            }}
          >
            {tcgbookmarks.map((term, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: "0.2em" }}
              >
                <button
                  className="bookmark1"
                  onClick={() => handleBookmarkClick(term)}
                >
                  {term}
                </button>
                <button
                  className="bookmark2"
                  onClick={() => handleRemoveBookmark(term)}
                  style={{ fontSize: "0.8em" }}
                >
                  ❌
                </button>
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
          <p style={{ textAlign: "center" }}>Loading... This can take up to 30s</p>
        </div>
      )}

      {/* Step 1: Show TCG search results for selection */}
      {tcgResults.length > 0 && !selectedCard && (
        <div>
          <h2 style={{ textAlign: "center", color: "#ffcc00", marginBottom: "2em", textShadow: "1px 1px 2px #000", marginTop: '3.5em' }}>Select a card:</h2>
          <div className="tcgGrid">
  {tcgResults.map((card: any) => (
    <div
      key={card.id}
      onClick={() => {
      setSelectedCard(card);
      localStorage.setItem("selectedCard", JSON.stringify(card));
      setShowConditionModal(true);
        console.log('Selected card:', card);
      }}
      className="cardItem"
      style={{ cursor: "pointer" }}
    >
      <img src={card.image} alt={card.name} width={120} />
      <div>{card.name}</div>
      <div>{card.episode?.name} #{card.card_number}</div>
      <div>HP: {card.hp}</div>
      <div>Rarity: {card.rarity}</div>
    </div>
  ))}
</div>
        </div>
      )}

      {/* Step 2: Show eBay filter options and search button */}
      {showConditionModal && selectedCard && (
  <div className="modal-overlay" onClick={() => setShowConditionModal(false)}>
    <div
      className="modal-content"
      onClick={e => e.stopPropagation()}
      style={{
        animation: "fadeInUp 0.3s",
        background: "#23243a",
        padding: "1em",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        width: "300px",
        margin: "2em auto"
      }}
    >
      <h2 style={{ textAlign: "center", color: "#ffcc00", marginBottom: "1em", textShadow: "1px 1px 2px #000" }}>Select Condition:</h2>
      <div style={{ textAlign: 'center', marginBottom: '1em' }}>
        <select
          value={ebayFilters[0] || ""}
          onChange={e => {
            const val = e.target.value;
            setEbayFilters(val ? [val] : []);
          }}
          style={{ padding: '0.5em', borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
        >
          <option value="">Select Condition</option>
          {filterOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <button
        style={{
          display: 'flex',
          margin: '1em auto',
          padding: "0.5rem 1rem",
          backgroundColor: "#ffcc00",
          color: "black",
          border: "1px solid transparent",
          borderRadius: '10px'
        }}
        onClick={() => {
          fetchCardsWithFilters(selectedCard, ebayFilters);
          setShowConditionModal(false);
        }}
      >
        Confirm
      </button>
    </div>
  </div>
)}

      {/* Step 3: Show results */}
  {hasSearched && (
        <>
          {/* Selected Card Info */}
          {selectedCard && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5em",
              margin: "2.5em auto 1.5em auto",
              padding: "1em",
              background: "#23243a",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              width: '360px',
              height: '170px'

            }}>
              <img src={selectedCard.image} alt={selectedCard.name} width={100} style={{ borderRadius: 8, background: "#fff" }} />
              <div>
                <h2 style={{ margin: 0 }}>{selectedCard.name} #{selectedCard.card_number}</h2>
                {selectedCard.rarity && (
                  <div style={{ fontSize: "0.95em", color: "#b3b3b3" }}>{selectedCard.rarity}</div>
                )}
                {selectedCard.episode.name && (
                  <div style={{ fontSize: "0.95em", color: "#b3b3b3" }}>{selectedCard.episode.name}</div>
                )}
                <div style={{ fontSize: "0.95em", color: "#b3b3b3" }}>RAW NM Price: ${selectedCard.prices.cardmarket.lowest_near_mint}</div>
              </div>
            </div>
          )}
          {/* Always show Clear Results button when results are displayed */}
          <div style={{ marginBottom: '1em' }}>
            <button className="cr" onClick={handleClearResults}>
              Clear Results
            </button>
          </div>

          {Array.isArray(soldResults) && soldResults.length > 0 && (
            <div className="hello">
              <h2
                className="subHead"
                style={{
                  fontFamily: '"Luckiest Guy", sans-serif',
                  textAlign: "center",
                }}
              >
                Sold Listings (USD)
              </h2>
              <div
                className="horizontalScroll"
                style={soldResults.length === 1 ? { justifyContent: 'center', display: 'flex' } : {}}
              >
                {soldResults.map((item, i) => (
                  <div key={i} className="cardItem">
                    <strong>{item.title}</strong>
                    <p style={{ color: "limegreen", fontWeight: "bold" }}>
                      SOLD {item.price || item.salePrice}
                    </p>
                    <p>{item.date}</p>
                    {item.image && (
                      <img width={150} src={item.image} alt="Sold item" />
                    )}
                    <a
                      href={appendEPNTracking(item.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vob"
                    >
                      View on eBay
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auction Listings */}
          <div>
            <h2
              className="subHead"
              style={{
                fontFamily: '"Luckiest Guy", sans-serif',
                textAlign: "center",
              }}
            >
              Auction Listings
            </h2>
            <div
              className="horizontalScroll"
              style={auctionResults.length === 1 ? { justifyContent: 'center', display: 'flex' } : {}}
            >
              {auctionResults.map((item) => (
                <div key={item.itemId} className="cardItem">
                  <strong>{item.title}</strong>
                  <p>
                    Current Bid:{" "}
                    <span style={{ color: "limegreen", fontWeight: "bold" }}>
                      ${item.currentBidPrice?.value}{" "}
                      {item.currentBidPrice?.currency}
                    </span>
                  </p>
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
                </div>
              ))}
              {auctionResults.length === 0 && <p style={{textAlign: "center"}}>No auction results found.</p>}
            </div>
          </div>

          {/* Fixed Price Listings */}
          <div>
            <h2
              className="subHead"
              style={{
                fontFamily: '"Luckiest Guy", sans-serif',
                textAlign: "center",
              }}
            >
              Fixed Price Listings
            </h2>
            <div
              className="horizontalScroll"
              style={fixedPriceResults.length === 1 ? { justifyContent: 'center', display: 'flex' } : {marginBottom: '2em'}}
            >
              {fixedPriceResults.map((item) => (
                <div key={item.itemId} className="cardItem">
                  <strong>{item.title}</strong>
                  <p>
                    <span style={{ color: "limegreen", fontWeight: "bold" }}>
                      ${item.price?.value} {item.currentBidPrice?.currency}
                    </span>
                  </p>
                  <img width={150} src={item.image.imageUrl} alt="Fixed price item" />
                  <a
                    href={appendEPNTracking(item.itemWebUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vob"
                  >
                    View on eBay
                  </a>
                </div>
              ))}
              {fixedPriceResults.length === 0 && <p style={{textAlign: "center"}}>No fixed price results found.</p>}
            </div>
          </div>
        </>
      )}

      {/* How to use section if nothing searched */}
      {!hasSearched && tcgResults.length === 0 && !loading && (
        <div>
          <div className="howToUse">
            <h2>MTG COMING SOON!!</h2>
          </div>
          <div className="howToUse">
            <h3>View Listings</h3>
            <p>
              On this page, enter a Pokémon card name in the search bar and click search.
              You may bookmark a search by clicking the button beside search
            </p>
            <h3>Add Cards to your Collection</h3>
            <p>
              Head to the{" "}
              <a style={{ textDecoration: "underline" }} href="/cards">
                Pokemon
              </a>{" "}
              tab to view all cards for a specific Pokémon. You can select a condition
              for each card and add it to your collection.
            </p>
            <h3>View Your Cards</h3>
            <p>
              Go to the{" "}
              <a style={{ textDecoration: "underline" }} href="/mycards">
                My Cards
              </a>{" "}
              tab to see all the cards you've added, their conditions, average sold
              prices, and a rough Estimated value of your collection.
            </p>
          </div>
          <div className="howToUse">
            <p style={{ fontSize: "0.7em", marginTop: "3em" }}>
              NOTE: clicking on links to some listings from this site and make a
              purchase, can result in this site earning a commission. Affiliate programs
              and affiliations include, but are not limited to, the eBay Partner Network.
            </p>
          </div>
        </div>
      )}
      { fixedPriceResults.length + auctionResults.length + soldResults.length > 0 && <BackToTop /> }
    </div>
  );
}