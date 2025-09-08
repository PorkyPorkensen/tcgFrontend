import React, { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setShow(docHeight > 0 && scrollY / docHeight > 0.3);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!show) return null;

  return (
    <button
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: 50,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "#ffcc00",
        color: "#222",
        border: "none",
        borderRadius: "24px",
        padding: "0.4em 2em",
        fontWeight: 700,
        fontSize: "1.1em",
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        cursor: "pointer",
        transition: "opacity 0.3s",
      }}
    >
      Go back to top ↑
    </button>
  );
}