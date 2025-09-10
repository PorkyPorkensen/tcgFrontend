import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

import type { User } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import BackToTop from "../components/BackToTop";

type CardType = {
  id: string;
  cardName: string;
  setName: string;
  cardNumber: string;
  condition: string;
  imageUrl: string;
};


export default function MyCards() {
  // ─── State ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ─── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        type FirestoreCard = Omit<CardType, "id"> & { userId: string };

        const q = query(
          collection(db, "collections"),
          where("userId", "==", firebaseUser.uid)
        );

        const snapshot = await getDocs(q);
        const cardData: CardType[] = snapshot.docs.map((doc) => {
          const data = doc.data() as FirestoreCard;
          return { id: doc.id, ...data };
        });

        setCards(cardData as CardType[]);
      } else {
        setUser(null);
        setCards([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);



  // ─── Functions ──────────────────────────────────────────────────────────




  // Delete a card from Firestore and local state
  const deleteCard = async (cardId: string): Promise<void> => {
    const confirmDelete = window.confirm("Are you sure you want to remove this card?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "collections", cardId));
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Error deleting card: " + error.message);
      } else {
        alert("Unknown error deleting card");
      }
    }
  };



  // ─── Render ─────────────────────────────────────────────────────────────


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


  if (!user) {
    return <p style={{ textAlign: "center" }}>Please sign in to view your cards.</p>;
  }

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
      <BackToTop />
    </div>
  );
}