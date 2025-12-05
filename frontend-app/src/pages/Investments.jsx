import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";

export default function Investments() {
  const [mf, setMf] = useState([]);
  const [equity, setEquity] = useState([]);
  const [intraday, setIntraday] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get("/investments");
      setMf(res.data.mutualFunds || []);
      setEquity(res.data.equity || []);
      setIntraday(res.data.intraday || []);
    };
    fetchData().catch(console.error);
  }, []);

  return (
    <Layout title="Investments">
      <div className="grid grid-3">
        <article className="card">
          <h2>Mutual funds</h2>
          {mf.map((m) => (
            <div key={m.id} className="mini-card">
              <p>
                <strong>{m.name}</strong>
              </p>
              <p className="page-sub">{m.type}</p>
              <div className="summary-row">
                <span>Value</span>
                <span>₹{m.value}</span>
              </div>
              <div className="summary-row">
                <span>P&amp;L</span>
                <span className={m.pnl >= 0 ? "amount-positive" : "amount-negative"}>
                  {m.pnl >= 0 ? "+" : "-"}₹{Math.abs(m.pnl)}
                </span>
              </div>
            </div>
          ))}
        </article>

        <article className="card">
          <h2>Stocks / Equity</h2>
          {equity.map((e) => (
            <div key={e.id} className="mini-card">
              <p>
                <strong>{e.symbol}</strong>
              </p>
              <div className="summary-row">
                <span>Qty</span>
                <span>{e.qty}</span>
              </div>
              <div className="summary-row">
                <span>Avg price</span>
                <span>₹{e.avg}</span>
              </div>
              <div className="summary-row">
                <span>LTP</span>
                <span>₹{e.ltp}</span>
              </div>
            </div>
          ))}
        </article>

        <article className="card">
          <h2>Intraday</h2>
          {intraday.map((p) => (
            <div key={p.id} className="mini-card">
              <p>
                <strong>{p.symbol}</strong>
              </p>
              <div className="summary-row">
                <span>Side</span>
                <span>{p.side}</span>
              </div>
              <div className="summary-row">
                <span>Qty</span>
                <span>{p.qty}</span>
              </div>
              <div className="summary-row">
                <span>P&amp;L</span>
                <span className={p.pl >= 0 ? "amount-positive" : "amount-negative"}>
                  {p.pl >= 0 ? "+" : "-"}₹{Math.abs(p.pl)}
                </span>
              </div>
            </div>
          ))}
        </article>
      </div>
    </Layout>
  );
}
