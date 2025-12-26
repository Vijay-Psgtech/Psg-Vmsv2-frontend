import React from "react";
import { useReception } from "./receptionContext";

export default function SearchBar() {
  const { search, setSearch } = useReception();

  return (
    <input
      type="text"
      placeholder="Search visitors (name / phone / host)..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{
        width: "100%",
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
        border: "1px solid #ccc",
      }}
    />
  );
}
