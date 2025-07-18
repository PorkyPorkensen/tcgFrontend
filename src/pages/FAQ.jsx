import React from "react";

export default function FAQ() {
  return (
    <div style={{ padding: "2em", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Frequently Asked Questions</h1>
      <h2>What is TCG.Tracker?</h2>
      <p>
        TCG.Tracker is a web application that allows users to search for Pokémon cards on both eBay and the PokemonTCG API, bookmark their favorite searches, and track prices.
      </p>
      <h2>How do I search for card sales?</h2>
      <p>
        Use the search bar on the homepage to enter the name of the Pokémon card you are looking for. You can filter results by auction or fixed price.
      </p>
    <h2>Where can I find a list of all cards for a certain Pokemon?</h2>
      <p>
        Head to the Pokemon tab and search for the Pokemon you want to see cards for. For example, if you want to see all cards for Charizard, type "Charizard" in the search bar.
      </p>

        <h2>Why isn't my Pokemon card showing up?</h2>
      <p>
        This could be due to several reasons: The most common is that the API I am using is the PokemonTCG API, which will return almost all cards,
        but not every variety of a card. For example, Reverse Holos are not in the database. 
      </p>
    </div>
  );
}