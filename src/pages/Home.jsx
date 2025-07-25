import SearchCards from "../components/SearchCards";

export default function Home() {

    const tkn = import.meta.env.VITE_EBAY_CLIENT_TKN
    const clientId = import.meta.env.VITE_EBAY_CLIENT_ID
    const clientSec = import.meta.env.VITE_EBAY_CLIENT_SEC
    
  
  
    return (
    <div>
      <h1 style={{fontSize: '2em', textAlign: 'center'}}>eBay Lookup</h1>
      <p style={{textAlign: 'center'}}><strong>NOTE:</strong> The first search may take up to 60s if server has been inactive for 15min</p>
      <SearchCards />
    </div>
  );
}