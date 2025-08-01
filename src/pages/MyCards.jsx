import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function MyCards() {
  // 🔵 State
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averagePrices, setAveragePrices] = useState(() => {
    const saved = localStorage.getItem("averagePrices");
    return saved ? JSON.parse(saved) : {};
  });
  const [totalValue, setTotalValue] = useState(() => {
    return localStorage.getItem("totalValue") || "0.00";
  });

  // 🔄 Handle user auth state + fetch user's cards
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const q = query(
          collection(db, "collections"),
          where("userId", "==", firebaseUser.uid)
        );

        const snapshot = await getDocs(q);
        const cardData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCards(cardData);
      } else {
        setUser(null);
        setCards([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 💰 Fetch average sold price from backend
  const fetchSoldAverage = async (term, cardId, delay = 500) => {
    await new Promise((res) => setTimeout(res, delay));

    try {
      const encodedTerm = encodeURIComponent(term);
      const response = await fetch(`https://tcgbackend.onrender.com/api/sold?term=${encodedTerm}`);
      const data = await response.json();

      if (data?.length > 0) {
        const prices = data
          .map((item) => parseFloat(item.salePrice.replace(/[^0-9.-]+/g, "")))
          .filter((price) => !isNaN(price));

        const avg = (prices.reduce((sum, val) => sum + val, 0) / prices.length).toFixed(2);

        setAveragePrices((prev) => ({ ...prev, [cardId]: avg }));
      } else {
        setAveragePrices((prev) => ({ ...prev, [cardId]: "N/A" }));
      }
    } catch (error) {
      console.error(`Error fetching average price for ${term}:`, error);
      setAveragePrices((prev) => ({ ...prev, [cardId]: "Error" }));
    }
  };

  // 🧮 Update totalValue and cache in localStorage when prices change
  useEffect(() => {
    const values = Object.values(averagePrices)
      .map((price) => parseFloat(price))
      .filter((num) => !isNaN(num));

    const total = values.reduce((sum, val) => sum + val, 0).toFixed(2);
    setTotalValue(total);
    localStorage.setItem("totalValue", total);
    localStorage.setItem("averagePrices", JSON.stringify(averagePrices));
  }, [averagePrices]);

  // ⚡ Initial fetch for sold prices (only if not cached)
  useEffect(() => {
    if (cards.length > 0 && Object.keys(averagePrices).length === 0) {
      let delay = 0;

      cards.forEach((card) => {
        const condition = card.condition?.toUpperCase?.();
        const conditionLabel = condition === "GRADED" ? "PSA" : condition;
        const searchTerm = `${card.cardName} ${card.cardNumber} ${conditionLabel}`;

        delay += 500;
        fetchSoldAverage(searchTerm, card.id, delay);
      });
    }
  }, [cards]);

  // 🗑️ Delete a card from Firestore and local state
  const deleteCard = async (cardId) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this card?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "collections", cardId));
      setCards((prev) => prev.filter((card) => card.id !== cardId));

      // Clean up averagePrices and recalculate total
      setAveragePrices((prev) => {
        const { [cardId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      alert("Error deleting card: " + error.message);
    }
  };

  // 🔁 Manual recalculation trigger
  const handleRecalculate = () => {
    let delay = 0;

    cards.forEach((card) => {
      const condition = card.condition?.toUpperCase?.();
      const conditionLabel = condition === "GRADED" ? "PSA" : condition;
      const searchTerm = `${card.cardName} ${card.cardNumber} ${conditionLabel}`;

      delay += 500;
      fetchSoldAverage(searchTerm, card.id, delay);
    });
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <div>
        <DotLottieReact
          src="https://lottie.host/f5a82384-f2ff-457a-a3ea-0a26c9825f8a/WEarna6TOe.lottie"
          loop
          autoplay
          className="pikachuLoading"
        />
        <p style={{ textAlign: "center" }}>Loading...</p>
      </div>
    );
  }

  // 🔐 If not signed in
  if (!user) {
    return <p style={{ textAlign: "center" }}>Please sign in to view your cards.</p>;
  }

  // ✅ Main render
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "20px",
        marginBottom: "40px",
      }}
    >
      <h1 style={{ fontSize: "3em", textAlign: "center" }}>My Collection</h1>
      
      <div style={{ width: '100%', display: "flex", flexDirection: "column", alignItems: "center", margin: "20px auto", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "1.8em", textAlign: "center" }}>
          Total Estimated Value: <span style={{ color: "#ffcc00" }}>${totalValue}</span>
        </h1>
        <p style={{maxWidth: '50%', fontSize: "0.8em", textAlign: 'center'}}><strong>NOTE:</strong> This number is an estimate. It is calculated by searching the card name, card number, and condition together and taking the results
      of that search on eBay and averaging out the most recent 8 sales. This may lead to innacurate pricing if your card is not commonly traded.</p>

        <button
          onClick={handleRecalculate}
          className="recalculateBtn"
        >
          🔄 Recalculate Card Values
        </button>
      </div>

      {cards.length === 0 ? (
        <p style={{ textAlign: "center" }}>You haven’t saved any cards yet.</p>
      ) : (
        <div className="myCards">
          {cards.map((card) => (
            <div key={card.id} className="cardDiv">
              <img
                src={card.imageUrl}
                alt={card.cardName}
                style={{ width: "100%", height: "auto", borderRadius: "6px" }}
              />
              <h3>{card.cardName}</h3>
              <p>Set: {card.setName}</p>
              <p>Condition: {card.condition}</p>
              <p>Card #: {card.cardNumber}</p>
              <p>
                Avg Sold Price:{" "}
                {averagePrices[card.id]
                  ? isNaN(averagePrices[card.id])
                    ? averagePrices[card.id]
                    : `$${averagePrices[card.id]}`
                  : "Calculating..."}
              </p>
              <button
                onClick={() => deleteCard(card.id)}
                className="deleteCardBtn"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}