import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function MyCards() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // 🔍 Fetch user's cards
        const q = query(
          collection(db, "collections"), // ← your actual collection name
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

  if (!user) {
    return <p style={{ textAlign: "center" }}>Please sign in to view your cards.</p>;
  }

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px"}}>
      <h1 style={{ fontSize: "2em", textAlign: "center" }}>My Cards</h1>
      {cards.length === 0 ? (
        <p style={{ textAlign: "center" }}>You haven’t saved any cards yet.</p>
      ) : (
        <div className='myCards' >
          {cards.map((card) => (
            <div
              key={card.id}
              className="cardDiv"
            >
              <img
                src={card.imageUrl}
                alt={card.cardName}
                style={{ width: "100%", height: "auto", borderRadius: "6px" }}
              />
              <h3>{card.cardName}</h3>
              <p>Set: {card.setName}</p>
              <p>Condition: {card.condition}</p>
              <p>Card #: {card.cardNumber}</p>
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
    </div>
  );
}