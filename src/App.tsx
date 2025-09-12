import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import FAQ from "./pages/FAQ";
import Signup from "./pages/Signup";
import MyCards from "./pages/MyCards";



function App() {


  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mycards" element={<MyCards />} />
      </Routes>
    </Router>
  );
}

export default App;
