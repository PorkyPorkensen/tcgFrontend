import React, { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Header() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirect if not logged in


  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("You’ve been signed out!");
      navigate("/signup"); // Optional redirect after logout
    } catch (error) {
      alert("Error signing out: " + error.message);
    }
  };

  return (
    <div className="headDiv">
      <div className="logoDiv">
        <h1 className="header"><a  className='headA' href="/">TCG.Tracker</a></h1>
        <br />
        
        <DotLottieReact
          src="https://lottie.host/df00648d-9a70-4a85-834c-76946a0134d2/dAAAVRBmbm.lottie"
          loop
          autoplay
          className="pokeBall"
        />
        
      </div>

      <div className="linkDiv">
        <Link to="/" className={({ isActive }) => isActive ? "active" : ""}>eBay Lookup</Link> 
        <Link to="/cards" className={({ isActive }) => isActive ? "active" : ""}>Pokemon</Link>  
        <Link to="/mycards" className={({ isActive }) => isActive ? "active" : ""}>My Cards</Link>  
        <Link to="/faq" className={({ isActive }) => isActive ? "active" : ""}>FAQ</Link>  

        {!loading && currentUser && (
          <button className='logOutBtn' onClick={handleLogout}>Sign Out</button>
        )}
        {!loading && !currentUser && (
          <Link to="/signup" className={({ isActive }) => isActive ? "active" : ""}>Sign Up/In</Link>
        )}

      </div>

      <Outlet />
    </div>
  );
}