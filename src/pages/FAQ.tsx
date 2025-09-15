import React, {JSX} from "react";

export default function FAQ(): JSX.Element {
  return (
    <div className="howToUse">
      <h1 style={{ textAlign: "center" }}>Frequently Asked Questions</h1>
      <h2>What is TCGTracker?</h2>
      <p>
        TCGTracker is a web application built by a solo jr dev that allows users to search for Pokémon cards and view some active listings on eBay, as well as add cards to their personal collection.
      </p>
      <h2>Whats taking so long?</h2>
      <p>
        In short, my server is being hosted on a free tier, so it can be slow at times. I am working on optimizing the code to make it faster.
      </p>
      <h2>How do I search for card sales?</h2>
      <p>
        Use the search bar on the homepage to enter the name of the Pokémon card you are looking for.
      </p>
    <h2>Where can I add Pokemon cards to my collection?</h2>
      <p>
        After searching for a card, and selecting a condition, you can click the "Add to Collection" button below the card image. This will save the card to your personal collection, which you can view by clicking the "My Cards" tab in the navigation bar.
      </p>

      <h2>Why isn't my Pokemon card showing up?</h2>
      <p>
        This could be due to several reasons: The most common is that the API I am using is constantly being updated, and some cards may not be available at the moment. Another reason could be that the card is too new or too old to be in the database. Lastly, it could be a spelling issue. Try different variations of the card name, or just the main name without any special characters or numbers. 
      </p>
      <h2>Have a more detailed question?</h2>
      <p>Contact: mitchvwebsolutions@gmail.com</p>
    </div>
  );
}