import React from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { JSX } from "react";

export default function Header(): JSX.Element {
  // ✅ useAuth already returns the correct typed context
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      alert("You’ve been signed out!");
      navigate("/signup");
    } catch (error: any) {
      alert("Error signing out: " + error.message);
    }
  };

  return (
    <div className="headDiv">
      <div className="logoDiv">
        <h1 className="header">
          <a className="headA" href="/">TCGTracker</a>
        </h1>
        <br />
        <DotLottieReact
          src="https://lottie.host/df00648d-9a70-4a85-834c-76946a0134d2/dAAAVRBmbm.lottie"
          loop
          autoplay
          className="pokeBall"
        />
      </div>

      <div className="linkDiv">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
          eBay Lookup
        </NavLink>
        <NavLink to="/cards" className={({ isActive }) => (isActive ? "active" : "")}>
          Pokemon
        </NavLink>
        <NavLink to="/mycards" className={({ isActive }) => (isActive ? "active" : "")}>
          My Cards
        </NavLink>
        <NavLink to="/faq" className={({ isActive }) => (isActive ? "active" : "")}>
          FAQ
        </NavLink>

        {!loading && user && (
          <button className="logOutBtn" onClick={handleLogout}>
            Sign Out
          </button>
        )}
        {!loading && !user && (
          <NavLink to="/signup" className={({ isActive }) => (isActive ? "active" : "")}>
            Sign Up/In
          </NavLink>
        )}
      </div>

      <Outlet />
    </div>
  );
}