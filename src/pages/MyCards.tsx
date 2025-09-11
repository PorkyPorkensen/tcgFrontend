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

type PriceResult = {
  price: number;
};

export default function MyCards() {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [lastRecalcTime, setLastRecalcTime] = useState<number | null>(null);
  const [cachedTotal, setCachedTotal] = useState<number | null>(null);
  const [recalcCooldown, setRecalcCooldown] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const fetchEstimates = async () => {
    setRecalcCooldown(true);
    const now = Date.now();
    setLastRecalcTime(now);
    const newEstimates: Record<string, number> = {};
    for (const card of cards) {
      // Replace 'GRADED' with 'PSA' if condition starts with 'GRADED'
      let condition = card.condition;
      if (/^GRADED \d+$/i.test(condition)) {
        condition = condition.replace(/^GRADED/, "PSA");
      }
      // Add year if available
      let year = "";
      if ((card as any).episode?.released_at) {
        year = " " + (card as any).episode.released_at.slice(0, 4);
      }
      const searchTerm = `${card.cardName} ${card.setName} ${card.cardNumber} ${condition}${year}`;
      try {
        const fixedRes = await fetch(
          `https://tcgbackend-951874125609.us-east4.run.app/api/search?q=${encodeURIComponent(searchTerm)}&filter=${encodeURIComponent("buyingOptions:{FIXED_PRICE}")}`
        );
        const fixedData = await fixedRes.json();
        let prices: number[] = (fixedData.itemSummaries || [])
          .slice(0, 7)
          .map((item: any) => Number(item.price?.value))
          .filter((n: number) => !isNaN(n));
        // Outlier filtering logic
        let avg = 0;
        if (prices.length > 0) {
          avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        }
        if (prices.length > 3 && avg >= 10) {
          // Only filter if more than 3 prices and average is at least $10
          prices = prices.filter((price, idx, arr) => {
            const others = arr.slice(0, idx).concat(arr.slice(idx + 1));
            const mean = others.reduce((a, b) => a + b, 0) / others.length;
            return price >= mean * 0.5;
          });
          if (prices.length > 0) {
            avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          }
        }
        if (prices.length > 0) {
          newEstimates[card.id] = Math.round(avg * 0.85 * 100) / 100;
        }
      } catch (e) {
        // Handle error or skip
      }
    }
    setEstimates(newEstimates);
    // Store in localStorage
    const total = Object.values(newEstimates).reduce((sum, val) => sum + val, 0);
    setCachedTotal(total);
    localStorage.setItem("mycards_estimates", JSON.stringify(newEstimates));
    localStorage.setItem("mycards_lastRecalcTime", now.toString());
    localStorage.setItem("mycards_total", total.toString());
    setTimeout(() => setRecalcCooldown(false), 60000); // 1 minute cooldown
  };

// Cooldown timer effect
useEffect(() => {
  if (!recalcCooldown) {
    setCooldownLeft(0);
    return;
  }
  const interval = setInterval(() => {
    if (lastRecalcTime) {
      const elapsed = Math.floor((Date.now() - lastRecalcTime) / 1000);
      const left = 60 - elapsed;
      setCooldownLeft(left > 0 ? left : 0);
      if (left <= 0) {
        setRecalcCooldown(false);
        clearInterval(interval);
      }
    }
  }, 1000);
  return () => clearInterval(interval);
}, [recalcCooldown, lastRecalcTime]);
  
  
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

  // Fetch estimated price for each card
  useEffect(() => {
    // Try to load from localStorage first
    const cachedEstimates = localStorage.getItem("mycards_estimates");
    const cachedTime = localStorage.getItem("mycards_lastRecalcTime");
    const cachedTotalStr = localStorage.getItem("mycards_total");
    if (cachedEstimates && cachedTime && cachedTotalStr) {
      try {
        setEstimates(JSON.parse(cachedEstimates));
        setLastRecalcTime(Number(cachedTime));
        setCachedTotal(Number(cachedTotalStr));
        return;
      } catch {}
    }
    // If not cached, fetch
    if (cards.length > 0) fetchEstimates();
  }, [cards]);

  useEffect(() => {
  // Only run if not already calculating and not in cooldown
  if (!loading && !recalcCooldown && cards.length > 0) {
    const missing = cards.filter(card => estimates[card.id] === undefined);
    if (missing.length > 0) {
      // Only fetch for missing cards
      const fetchMissingEstimates = async () => {
        const newEstimates: Record<string, number> = { ...estimates };
        for (const card of missing) {
          let condition = card.condition;
          if (/^GRADED \d+$/i.test(condition)) {
            condition = condition.replace(/^GRADED/, "PSA");
          }
          let year = "";
          if ((card as any).episode?.released_at) {
            year = " " + (card as any).episode.released_at.slice(0, 4);
          }
          const searchTerm = `${card.cardName} ${card.setName} ${card.cardNumber} ${condition}${year}`;
          try {
            const fixedRes = await fetch(
              `https://tcgbackend-951874125609.us-east4.run.app/api/search?q=${encodeURIComponent(searchTerm)}&filter=${encodeURIComponent("buyingOptions:{FIXED_PRICE}")}`
            );
            const fixedData = await fixedRes.json();
            let prices: number[] = (fixedData.itemSummaries || [])
              .slice(0, 7)
              .map((item: any) => Number(item.price?.value))
              .filter((n: number) => !isNaN(n));
            let avg = 0;
            if (prices.length > 0) {
              avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            }
            if (prices.length > 3 && avg >= 10) {
              prices = prices.filter((price, idx, arr) => {
                const others = arr.slice(0, idx).concat(arr.slice(idx + 1));
                const mean = others.reduce((a, b) => a + b, 0) / others.length;
                return price >= mean * 0.5;
              });
              if (prices.length > 0) {
                avg = prices.reduce((a, b) => a + b, 0) / prices.length;
              }
            }
            if (prices.length > 0) {
              newEstimates[card.id] = Math.round(avg * 0.85 * 100) / 100;
            }
          } catch (e) {
            // Handle error or skip
          }
        }
        setEstimates(newEstimates);
        // Update localStorage
        localStorage.setItem("mycards_estimates", JSON.stringify(newEstimates));
        const total = Object.values(newEstimates).reduce((sum, val) => sum + val, 0);
        setCachedTotal(total);
        localStorage.setItem("mycards_total", total.toString());
      };
      fetchMissingEstimates();
    }
  }
}, [cards, estimates, loading, recalcCooldown]);

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

  // Calculate total estimated value
  const totalEstimate = cachedTotal !== null ? cachedTotal : Object.values(estimates).reduce((sum, val) => sum + val, 0);

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
{cards.length > 0 && (
  <>
    <h2 style={{ textAlign: "center", color: "#ffcc00", marginBottom: "1em", textShadow: "1px 1px 2px #000" }}>
      Estimated Collection Value: ${totalEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </h2>
    <button
      onClick={fetchEstimates}
      disabled={recalcCooldown}
      style={{
        marginBottom: "1.5em",
        padding: "0.5em 1.5em",
        fontSize: "1.1em",
        borderRadius: 8,
        background: recalcCooldown ? "#ccc" : "#ffcc00",
        color: "#23243a",
        border: "none",
        cursor: recalcCooldown ? "not-allowed" : "pointer",
        boxShadow: recalcCooldown ? "none" : "2px 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      {recalcCooldown ? `Recalculate (wait ${cooldownLeft}s)` : "Recalculate"}
    </button>
    <p style={{ textAlign: "center", fontSize: "0.85em", color: "#ffcc00", marginBottom: "1em" }}>
  Last updated at: {lastRecalcTime ? new Date(lastRecalcTime).toLocaleString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
</p>
  </>
)}
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
              <p className="cardValue">
                Estimated Value:{" "}
                {estimates[card.id] !== undefined
                  ? `$${estimates[card.id]}`
                  : "Loading..."}
              </p>
            </div>
          ))}

        </div>
        
      )}
      <BackToTop />
      <p style={{maxWidth: '350px', fontSize: '0.9em', margin: '3em 0'}}>NOTE: Estimated values are based on market trends and may not reflect actual sale prices.</p>
    </div>
  );
}