/* Login screen logo — TripsFactory brand */
import React from "react";

export default function Logo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
        Trips<span style={{ color: "var(--tf-primary)" }}>Factory</span>
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "var(--tf-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
        }}
      >
        Boshqaruv paneli
      </div>
    </div>
  );
}
