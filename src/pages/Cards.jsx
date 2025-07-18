import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { db, auth } from "../firebase"; // your Firebase config
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";




export default function Cards(){
    const [query, setQuery] = useState("");
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedConditions, setSelectedConditions] = useState({});
    
const conditions = ['NM', 'LP', 'MP', 'HP', 'DMG', 'POOR', 'GRADED 10', 'GRADED 9', 'GRADED 8', 'GRADED 7', 'GRADED 6', 'GRADED 5', 'GRADED 4', 'GRADED 3', 'GRADED 2', 'GRADED 1'];
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    let formattedQuery = query.trim();

    // If query starts with "mega" or "Mega", replace it with "M"
    if (/^mega\s/i.test(formattedQuery)) {
    formattedQuery = formattedQuery.replace(/^mega\s/i, "M ");
    }

    try {
      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(`${formattedQuery}*`)}"`
      );
      const data = await res.json();
      console.log(data.data)
      setCards(data.data || []);
    } catch (err) {
      setError("Something went wrong fetching cards.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };
    
    
const addToCollection = async (card, condition = "NM") => {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to add cards.");
      return;
    }

    await addDoc(collection(db, "collections"), {
      userId: user.uid,
      cardId: card.id,
      cardName: card.name,
      setName: card.set.name,
      cardNumber: card.number,
      imageUrl: card.images.small,
      condition,
      addedAt: new Date(),
    });

    alert(`${card.name} added to your collection!`);
  } catch (e) {
    console.error("Error adding card:", e);
    alert("Failed to add card.");
  }
};
    
  return (
    <div style={{ padding: "1rem" }}>
      <h2 className='subHead'>Search Pokémon Cards</h2>
      <div className="inputDiv">
        <input
        type="text"
        placeholder="Enter card name (e.g., Charizard)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "0.5rem", width: "300px" }}
      />
      <button onClick={handleSearch} style={{ padding: "0.5rem 1rem", height: "38px", borderRadius: "0 8px 8px 0", backgroundColor: "#00bfff", color: "black", border: "1px solid transparent" }}>
        Search
      </button>
      </div>
      

      {loading && (  
        <div>
            <DotLottieReact
            src="https://lottie.host/f5a82384-f2ff-457a-a3ea-0a26c9825f8a/WEarna6TOe.lottie"
            loop
            autoplay
            width={800}
            />
            <p style={{textAlign: 'center'}}>Loading....</p>
        </div>  
)}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem", justifyContent: "center" }}>
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
  style={{ height: '35px', border: '1px solid transparent' }}
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
    </div>
  );
}