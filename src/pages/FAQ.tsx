import React, {JSX} from "react";

export default function FAQ(): JSX.Element {
  return (
    <div className="howToUse">
      <h1 style={{ textAlign: "center" }}>Frequently Asked Questions</h1>
      <h2>What is TCG.Tracker?</h2>
      <p>
        TCG.Tracker is a web application built by a solo jr dev that allows users to search for Pokémon cards using eBay and the PokemonTCG API, bookmark their favorite searches, and track prices.
      </p>
      <h2>What's taking so long?</h2>
      <p>
        In short, my server is being hosted on a free tier. This, on top of the fact
        that the PokemonTCGApi is also a free API (shout-out to Andrew), can make things slow at times. I am working on optimizing the code to make it faster.
      </p>
      <h2>How do I search for card sales?</h2>
      <p>
        Use the search bar on the homepage to find the Pokémon card you are looking for. Once you find your card, select the condition you want (such as Near Mint, Lightly Played, Graded, etc.), and then click "Search Sales" to view recent sales and price data for that specific card and condition.
      </p>
      <h2>Where can I add Pokémon cards to my collection?</h2>
      <p>
        Head to the Pokémon tab and search for the Pokémon you want to see cards for, select a condition, and click "Add". It will be added to your collection,
        which you can view in the "My Cards" tab. As of this moment, you may only have up to 20 cards in your collection. 
      </p>
      <h2>Why isn't my Pokémon card showing up?</h2>
      <p>
        This could be due to several reasons: The most common is that the API I am using is the PokemonTCG API, which will return almost all cards,
        but not every variety of a card. For example, Reverse Holos are not <strong>yet</strong> in the database. 
      </p>
      <p>Contact: mitchvwebsolutions@gmail.com</p>
    </div>
  );
}