import { useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

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

export default function SearchCards() {
  const [query, setQuery] = useState<string>("");
  const [auctionResults, setAuctionResults] = useState<AuctionCardResult[]>([]);
  const [fixedPriceResults, setFixedPriceResults] = useState<FixedPriceCardResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [tcgbookmarks, settcgBookmarks] = useState<string[]>([]);
  const [bookmarksInitialized, setBookmarksInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [soldResults, setSoldResults] = useState<SoldCardResult[]>([]);
  const EPN_CAMPAIGN_ID = "5339116843";

  const appendEPNTracking = (url: string) => {
    try {
      const u = new URL(url);
      u.searchParams.set("campid", EPN_CAMPAIGN_ID);
      return u.toString();
    } catch (err) {
      console.error("Invalid eBay URL:", url);
      return url;
    }
  };

  const fetchCards = async (searchTerm: string): Promise<void> => {
    try {
      const encodedQuery = encodeURIComponent(searchTerm || query);
      setLoading(true);

      // Fetch SOLD items
      const soldRes = await fetch(
        `https://tcgbackend.onrender.com/api/sold?term=${encodedQuery}`
      );
      const soldData = await soldRes.json();
      console.log("SOLD API DATA:", soldData);
      if (Array.isArray(soldData)) {
        setSoldResults(soldData);
      } else {
        setSoldResults([]);
      }

      // Fetch AUCTION items
      const auctionRes = await fetch(
        `https://tcgbackend.onrender.comhttps://tcgbackend.onrender.com/api/search?q=${encodedQuery}&filter=${encodeURIComponent(
          "buyingOptions:{AUCTION}"
        )}`
      );
      const auctionData: EbaySearchResponse<AuctionCardResult> = await auctionRes.json();

      // Fetch FIXED_PRICE items
      const fixedRes = await fetch(
        `https://tcgbackend.onrender.comhttps://tcgbackend.onrender.com/api/search?q=${encodedQuery}&filter=${encodeURIComponent(
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
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
    setHasSearched(true);
    setLoading(false);
  };

  const handleClearResults = (): void => {
    setQuery("");
    setSoldResults([]);
    setAuctionResults([]);
    setFixedPriceResults([]);
    setHasSearched(false);
    setError(null);
    localStorage.removeItem("lastQuery");
    localStorage.removeItem("lastSoldResults");
    localStorage.removeItem("lastAuctionResults");
    localStorage.removeItem("lastFixedPriceResults");
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
    fetchCards(term);
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
            if (e.key === "Enter") fetchCards(query);
          }}
          placeholder="Search trading cards (e.g., Charizard)"
        />
        <button
          onClick={() => fetchCards(query)}
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

      {error && <p>{error}</p>}

      {tcgbookmarks.length > 0 && (
        <div style={{ marginTop: "1em", textAlign: "center" }}>
          <h3 className="subHead">Bookmarked Searches</h3>
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
          <p style={{ textAlign: "center" }}>Loading... This can take up to 60s</p>
        </div>
      )}

      {!hasSearched && (
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

      {hasSearched && (
        <>
          {/* Sold Listings Section */}
<div className="hello">
  <button className="cr" onClick={handleClearResults}>
    Clear Results
  </button>
  <h2
    className="subHead"
    style={{
      fontFamily: '"Luckiest Guy", sans-serif',
      textAlign: "center",
    }}
  >
    Sold Listings (USD)
  </h2>

  <div className="horizontalScroll">
    {Array.isArray(soldResults) && soldResults.length > 0 ? (
      soldResults.map((item, i) => (
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
      ))
    ) : (
      <p>No sold results found.</p>
    )}
  </div>
</div>

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
            <div className="horizontalScroll">
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
              {auctionResults.length === 0 && <p>No auction results found.</p>}
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
            <div className="horizontalScroll">
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
              {fixedPriceResults.length === 0 && <p>No fixed price results found.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}