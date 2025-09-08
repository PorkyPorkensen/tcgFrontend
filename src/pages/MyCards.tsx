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
  salePrice?: string;
  price?: string;
};

type AveragePrices = {
  [cardId: string]: number | "N/A" | "Error";
};

export default function MyCards() {
  // 🔵 State
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [averagePrices, setAveragePrices] = useState<AveragePrices>(() => {
    const saved = localStorage.getItem("averagePrices");
    return saved ? (JSON.parse(saved) as AveragePrices) : {};
  });
  const [totalValue, setTotalValue] = useState<string>(() => {
    return localStorage.getItem("totalValue") || "0.00";
  });
  const [lua, setLua] = useState<string>("");
  const [calculatingCount, setCalculatingCount] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState<number>(0);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // 🔄 Handle user auth state + fetch user's cards
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

  // 💰 Fetch average sold price from backend
  const fetchSoldAverage = async (
    term: string,
    cardId: string,
    delay = 500,
    toCalculate?: number
  ) => {
    await new Promise((res) => setTimeout(res, delay));
    try {
      const encodedTerm = encodeURIComponent(term);
      const response = await fetch(
        `https://tcgbackend-951874125609.us-east4.run.app/api/sold-prices?term=${encodedTerm}`
      );
      const data: number[] = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const avg = Number(
          (data.reduce((sum, val) => sum + val, 0) / data.length).toFixed(2)
        );
        setAveragePrices((prev) => ({ ...prev, [cardId]: avg }));
      } else {
        setAveragePrices((prev) => ({ ...prev, [cardId]: "N/A" }));
      }
    } catch (error) {
      console.error(`Error fetching average price for ${term}:`, error);
      setAveragePrices((prev) => ({ ...prev, [cardId]: "Error" }));
    }
    // Set last updated at (lua) as "MM/DD/YY HH:mm"
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const luaString = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now
      .getFullYear()
      .toString()
      .slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setLua(luaString);
    localStorage.setItem("lua", luaString);

    // Increment calculating count and check if done
    setCalculatingCount((prev) => {
      const next = prev + 1;
      if (toCalculate && next >= toCalculate) {
        setIsCalculating(false);
      }
      return next;
    });
  };

  // 🧮 Update totalValue and cache in localStorage when prices change
  useEffect(() => {
    const values = Object.values(averagePrices).filter(
      (val): val is number => typeof val === "number"
    );

    const total = values.reduce((sum, val) => sum + val, 0).toFixed(2);
    setTotalValue(total);
    localStorage.setItem("totalValue", total);
    localStorage.setItem("averagePrices", JSON.stringify(averagePrices));
  }, [averagePrices]);

  // 🕒 Load lua from localStorage on mount
  useEffect(() => {
    const savedLua = localStorage.getItem("lua");
    if (savedLua) setLua(savedLua);
  }, []);

  // ⚡ Initial fetch for sold prices (only if not cached)
  useEffect(() => {
    if (cards.length > 0 && Object.keys(averagePrices).length === 0) {
      let delay = 0;
      const toCalculate = cards.length;
      setCalculatingCount(0);
      setIsCalculating(true);

      cards.forEach((card) => {
        const condition = card.condition?.toUpperCase?.();
        const conditionLabel = condition === "GRADED" ? "PSA" : condition;
        const searchTerm = `${card.cardName} ${card.setName} ${card.cardNumber} ${conditionLabel}`;

        delay += 500;
        fetchSoldAverage(searchTerm, card.id, delay, toCalculate);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  // 🗑️ Delete a card from Firestore and local state
  const deleteCard = async (cardId: string): Promise<void> => {
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Error deleting card: " + error.message);
      } else {
        alert("Unknown error deleting card");
      }
    }
  };

  // 🔁 Manual recalculation trigger
 const handleRecalculate = (): void => {
  if (refreshCooldown > 0) return; // Prevent if still cooling down

  let delay = 0;
  setCalculatingCount(0);
  setIsCalculating(true);
  const toCalculate = cards.length;
  cards.forEach((card) => {
    const condition = card.condition?.toUpperCase?.();
    const conditionLabel = condition === "GRADED" ? "PSA" : condition;
    const searchTerm = `${card.cardName} ${card.setName} ${card.cardNumber} ${conditionLabel}`;
    delay += 500;
    fetchSoldAverage(searchTerm, card.id, delay, toCalculate);
  });

  // Start cooldown
  setRefreshCooldown(300); // 300 seconds = 5 minutes
  if (refreshTimer) clearInterval(refreshTimer);
  const timer = setInterval(() => {
    setRefreshCooldown((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  setRefreshTimer(timer);
};

useEffect(() => {
  return () => {
    if (refreshTimer) clearInterval(refreshTimer);
  };
}, [refreshTimer]);

  // Automatically fetch price for cards missing a price
  useEffect(() => {
    if (cards.length === 0) return;

    let delay = 0;
    let toCalculate = 0;
    cards.forEach((card) => {
      if (averagePrices[card.id] === undefined) {
        toCalculate++;
      }
    });
    if (toCalculate > 0) {
      setCalculatingCount(0);
      setIsCalculating(true);
      cards.forEach((card) => {
        if (averagePrices[card.id] === undefined) {
          const condition = card.condition?.toUpperCase?.();
          const conditionLabel = condition === "GRADED" ? "PSA" : condition;
          const searchTerm = `${card.cardName} ${card.setName} ${card.cardNumber} ${conditionLabel}`;
          delay += 500;
          fetchSoldAverage(searchTerm, card.id, delay, toCalculate);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

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

  const problematicCards = cards.filter(card => {
    const price = averagePrices[card.id];
    return price === "N/A" || price === "Error" || price === 0;
  });

  const setCardValueToZero = (cardId: string) => {
  setAveragePrices((prev) => ({ ...prev, [cardId]: 0 }));
  localStorage.setItem(
    "averagePrices",
    JSON.stringify({ ...averagePrices, [cardId]: 0 })
  );
};
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
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "20px auto",
          marginBottom: "40px",
        }}
      >
        <h1 style={{ fontSize: "1.8em", textAlign: "center" }}>
          Total Estimated Value: <span style={{ color: "#ffcc00" }}>${totalValue}</span>
        </h1>
        {lua && (
          <p style={{ fontSize: "0.9em", color: "#ffcc00", margin: "-1em 0 0.5em 0" }}>
            Last updated at: {lua}
          </p>
        )}

        <button
  onClick={handleRecalculate}
  className="recalculateBtn"
  disabled={refreshCooldown > 0}
  style={refreshCooldown > 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
>
  🔄 Recalculate Card Values
  {refreshCooldown > 0 && (
    <span style={{ marginLeft: 8, fontSize: "0.9em" }}>
      (Wait {Math.floor(refreshCooldown / 60)}:{(refreshCooldown % 60).toString().padStart(2, "0")})
    </span>
  )}
</button>
      </div>
      {isCalculating && (
        <p style={{ color: "#ffcc00", fontWeight: 600 }}>
          Calculating Prices... ({calculatingCount}/{cards.length})
        </p>
      )}
      {!isCalculating && problematicCards.length > 0 && (
  <div style={{
    background: "#fff3cd",
    color: "#856404",
    border: "1px solid #ffeeba",
    borderRadius: "6px",
    padding: "1em",
    marginBottom: "1em",
    maxWidth: "350px",
    textAlign: 'center'
  }}>
    <strong>There was a problem fetching the price for:</strong>
    <ul style={{ margin: "0" }}>
      {problematicCards.map(card => (
        <li key={card.id}>
          <span style={{ fontWeight: 600 }}>{card.cardName}</span>
        </li>
      ))}
    </ul>
    <div style={{ marginTop: "0.5em" }}>
      Please find the card(s) below and hit <b>Recalculate</b> or hit the <b>Recalculate Card Values</b> button above.
    </div>
  </div>
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
              <p>
                Avg Sold Price:{" "}
                {averagePrices[card.id] !== undefined
                  ? typeof averagePrices[card.id] === "number"
                    ? `$${averagePrices[card.id]}`
                    : averagePrices[card.id] // "N/A" or "Error"
                  : "Calculating..."}
              </p>
              <button
                onClick={() => deleteCard(card.id)}
                className="deleteCardBtn"
              >
                Remove
              </button>
              <button
                onClick={() =>
                  fetchSoldAverage(
                    `${card.cardName} ${card.setName} ${card.cardNumber} ${card.condition}`,
                    card.id,
                    0,
                    1
                  )
                }
                className="deleteCardBtn"
              >
                Recalculate
              </button>
              <button
  onClick={() => setCardValueToZero(card.id)}
  className="deleteCardBtn"
  style={{ background: "#ffeeba", color: "#856404", marginLeft: "0.5em" }}
>
  Set Value to 0
</button>
            </div>
          ))}
        </div>
      )}
<p
  style={{
    maxWidth: "50%",
    fontSize: "0.8em",
    textAlign: "center",
    marginTop: "4em",
    marginBottom: "6em", // <-- Add this line
  }}
>
  <strong>NOTE:</strong> These numbers are estimates. They are calculated by searching the card name, card number, set and condition together and taking the results
  of that search on eBay and averaging out the most recent 8 sales. This may lead to inaccurate pricing if your card is not commonly traded.
</p>
      <BackToTop />
    </div>
  );
}