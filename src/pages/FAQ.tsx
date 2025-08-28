import React, {JSX} from "react";

export default function FAQ(): JSX.Element {
  return (
    <div className="howToUse">
      <h1 style={{ textAlign: "center" }}>Frequently Asked Questions</h1>
      <h2>What is TCG.Tracker?</h2>
      <p>
        TCG.Tracker is a web application built by a solo jr dev that allows users to search for Pokémon cards on both eBay and the PokemonTCG API, bookmark their favorite searches, and track prices.
      </p>
      <h2>Whats taking so long?</h2>
      <p>
        Because as of this moment, my server is being hosted on a free tier, it can take up to fifty seconds to load everything if inactive. I am working on getting a paid server soon. This on top of the fact
        that the PokemonTCGApi is also a free API (shout-out to Andrew), it can be slow at times. I am working on optimizing the code to make it faster.
      </p>
      <h2>How do I search for card sales?</h2>
      <p>
        Use the search bar on the homepage to enter the name of the Pokémon card you are looking for.
      </p>
    <h2>Where can I add Pokemon cards to my collection?</h2>
      <p>
        Head to the Pokemon tab and search for the Pokemon you want to see cards for, select a condition, and click "Add". It will be added to your collection
        which you can view in the "My Cards" tab. As of this moment, you may only have up to 20 cards in your collection. 
      </p>

      <h2>Why isn't my Pokemon card showing up?</h2>
      <p>
        This could be due to several reasons: The most common is that the API I am using is the PokemonTCG API, which will return almost all cards,
        but not every variety of a card. For example, Reverse Holos are not in the database. 
      </p>
      <h2>Why does each of my cards "Avg Sold Price" load individually?</h2>
      <p>
        The average sold price for each card is calculated by fetching data from the eBay API. Because I was not approved for access to their new
        easier to use Market Insights API, I have to fetch each card individually and scrape through the results, while executing a 0.5 second delay, as to respect eBay's TOS. This can take some time, especially if you have many cards saved.
      </p>
      <h2>Have a more detailed question?</h2>
      <p>Contact: mitchvwebsolutions@gmail.com</p>
    </div>
  );
}