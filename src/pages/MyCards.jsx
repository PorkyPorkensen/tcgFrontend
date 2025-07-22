import React, { useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function MyCards() {
  // 🔵 State
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averagePrices, setAveragePrices] = useState({});


  // 🟢 Memoized value for average prices
  const totalValue = useMemo(() => {
  const values = Object.values(averagePrices)
    .map((price) => parseFloat(price))
    .filter((num) => !isNaN(num));

  const total = values.reduce((sum, val) => sum + val, 0);
  return total.toFixed(2);
}, [averagePrices]);

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

  // 🗑️ Delete a card from Firestore and local state
  const deleteCard = async (cardId) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this card?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "collections", cardId));
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (error) {
      alert("Error deleting card: " + error.message);
    }
  };

  // 💰 Fetch average sold price from backend with delay
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

  // 🟠 Trigger fetch for sold prices with throttling
  useEffect(() => {
    if (cards.length > 0) {
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

  // ⏳ Loading state
  if (loading) {
    return (
      <div>
        <DotLottieReact
          src="https://lottie.host/f5a82384-f2ff-457a-a3ea-0a26c9825f8a/WEarna6TOe.lottie"
          loop
          autoplay
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
      }}
    >
      <h1 style={{ fontSize: "2em", textAlign: "center" }}>My Cards</h1>

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
                  ? `$${averagePrices[card.id]}`
                  : "Calculating..."}
              </p>
              <button
                onClick={() => deleteCard(card.id)}
                style={{
                  marginTop: "10px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: "1px 2px 4px rgba(0, 0, 0, 0.76)",
                }}
              >
                Remove
              </button>
            </div>
          ))}

        </div>
        
      )}
        <div style={{ width: '100%', display: "flex", justifyContent: "center", margin: "20px auto" }}>
          <h1 style={{ fontSize: "2em", textAlign: "center" }}>Total Estimated Value: <span style={{color: "#ffcc00"}}>${totalValue}</span></h1>
        </div>
    </div>
  );
}