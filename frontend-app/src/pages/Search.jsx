import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const run = async () => {
      if (!query) {
        setResults([]);
        return;
      }
      const res = await api.get("/search", { params: { q: query } });
      setResults(res.data);
    };
    const id = setTimeout(run, 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <Layout title="Global search">
      <p className="page-sub">
        Search for loans, mutual funds, fixed deposits, cards, and transactions.
      </p>
      <div className="search-box">
        <input
          type="text"
          placeholder="Try: 'gold loan', 'mutual fund', 'Amazon'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="search-results">
        {results.map((r, i) => (
          <div key={i} className="search-result-item">
            <span className="tag">{r.type}</span>
            <strong>{r.title}</strong>
            <div className="page-sub">{r.detail}</div>
          </div>
        ))}
        {!results.length && query && (
          <p className="page-sub">No results found.</p>
        )}
      </div>
    </Layout>
  );
}
