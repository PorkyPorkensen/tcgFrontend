import SearchCards from "../components/SearchCards";

export default function Home() {

    const tkn = import.meta.env.VITE_EBAY_CLIENT_TKN
    const clientId = import.meta.env.VITE_EBAY_CLIENT_ID
    const clientSec = import.meta.env.VITE_EBAY_CLIENT_SEC
    
  
  
    return (
    <div>
      <h1 style={{fontSize: '2.5em', textAlign: 'center', marginTop: '2em'}}>eBay Lookup</h1>
      <SearchCards />
    </div>
  );
}