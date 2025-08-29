import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { db, auth } from "../firebase";
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import React, { useState, useEffect, useRef, JSX } from "react";


type CardType = {
  id: string;
  name: string;
  set: { name: string; series: string };
  number: string;
  images: { small: string; large: string };
}

type CardApiResponse = {
  data: CardType[];
}

export default function Cards(): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string|null>(null);
  const [selectedConditions, setSelectedConditions] = useState<Record<string, string>>({});
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    console.log("Error changed:", error);
  }, [error]);

  const conditions:string[] = [
    "NM", "LP", "MP", "HP", "DMG", "POOR",
    "GRADED 10", "GRADED 9", "GRADED 8", "GRADED 7",
    "GRADED 6", "GRADED 5", "GRADED 4", "GRADED 3",
    "GRADED 2", "GRADED 1"
  ];

  const handleSearch = async ():Promise<void> => {
    if (!query.trim()) return;

    setCards([]); // Clear old results immediately
    setLoading(true);
    setHasSearched(true);
    setError(null);

    let formattedQuery = query.trim();

    if (/^mega\s/i.test(formattedQuery)) {
      formattedQuery = formattedQuery.replace(/^mega\s/i, "M ");
    }

    try {
      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(`${formattedQuery}`)}"`
      );

      if (!res.ok) {
        const status = res.status;
        setCards([]); // Make sure cards are empty
        if (status === 504) {
          setError("timeout");
        } else {
          setError("Something went wrong fetching cards. Please try again.");
        }
        return;
      }

      const data:CardApiResponse = await res.json();

      if (!data.data || data.data.length === 0) {
        setError("noResults");
        setCards([]);
      } else {
        setCards(data.data);
      }
    } catch (err:unknown) {
      console.error("Caught error:", err);

      // Assume timeout if fetch completely fails (network issues, 504 etc.)
      setError("timeout");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async (card:CardType, condition = "NM"):Promise<void> => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to add cards.");
        return;
      }

      const cardData = {
        ...card,
        condition,
      };

      const response = await fetch("https://tcgbackend-951874125609.us-east4.run.app/api/cards/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          card: cardData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to add card.");
      } else {
        alert(`${card.name} added to your collection!`);
      }
    } catch (e) {
      console.error("Error adding card:", e);
      alert("Something went wrong while adding the card.");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2 className="subHead">Search Pokémon Cards</h2>

      <div className="inputDiv">
        <input
          type="text"
          placeholder="Enter card name (e.g., Charizard)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: "0.5rem", width: "300px" }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "0.5rem 1rem",
            height: "38px",
            borderRadius: "0 8px 8px 0",
            backgroundColor: "#00bfff",
            color: "black",
            border: "1px solid transparent"
          }}
        >
          Search
        </button>
      </div>

      <p style={{ textAlign: "center", maxWidth: "80%", margin: "1.5em auto" }}>
        <strong>NOTE:</strong> Depending on the status of the API this page is based on, searches may be slow.
      </p>

      {loading && (
        <div>
          <DotLottieReact
            src="https://lottie.host/f5a82384-f2ff-457a-a3ea-0a26c9825f8a/WEarna6TOe.lottie"
            loop
            autoplay
            width={800}
          />
          <p style={{ textAlign: "center" }}>Loading....</p>
        </div>
      )}

      {!loading && hasSearched && (
        <>
          {cards.length === 0 ? (
            <div className="errDiv">
              {error === "timeout" ? (
                <>
                  <h2 style={{ fontFamily: "Luckiest Guy" }}>API Timeout</h2>
                  <p>
                    Oh no, it seems the Pokémon TCG API is having issues. Please try your search again.
                  </p>
                  <button  className='cr' onClick={handleSearch}>Try Again</button>
                </>
              ) : error === "noResults" ? (
                <>
                  <h2 style={{ fontFamily: "Luckiest Guy" }}>
                    Couldn't Catch this Pokémon...
                  </h2>
                  <p>
                    Tip: Try to be <strong>EXACT</strong> with your search. Example: For cards like
                    <em> Blaine's Charizard</em>, <em>Pikachu & Zekrom GX</em>, be sure to include proper
                    punctuation and spacing.
                  </p>
                  <button onClick={handleSearch}>Try Again</button>
                </>
              ) : (
                <>
                  <h2>Unknown Error</h2>
                  <p>Something went wrong. Please try again later.</p>
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                marginTop: "2rem",
                justifyContent: "center",
              }}
            >
              {cards.map((card) => (
                <div key={card.id} className="cardDiv">
                  <img
                    src={card.images.small}
                    alt={card.name}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                  <h4>{card.name}</h4>
                  <p>{card.set.name} #{card.number}</p>
                  <select
                    value={selectedConditions[card.id] || "NM"}
                    onChange={(e) =>
                      setSelectedConditions((prev) => ({
                        ...prev,
                        [card.id]: e.target.value,
                      }))
                    }
                    style={{ height: "35px", border: "1px solid transparent" }}
                  >
                    {conditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                  <button
                    className="addBtn"
                    onClick={() =>
                      addToCollection(card, selectedConditions[card.id] || "NM")
                    }
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}