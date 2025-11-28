import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";

export default function Statements() {
  const [statements, setStatements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/statements");
        setStatements(res.data || []);
      } catch (err) {
        console.error("STATEMENT LOAD ERROR:", err);
      }
    };

    fetchData();
  }, []);

  // FIXED PDF DOWNLOAD (with auth + blob)
  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get("/statements/export/pdf", {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Create PDF Blob 
      const pdfBlob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);

      // Auto-download
      const link = document.createElement("a");
      link.href = url;
      link.download = "monthly_statements.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("PDF DOWNLOAD ERROR:", err);
    }
  };

  return (
    <Layout title="Statements">

      {/* PDF Button */}
      <button
        className="btn-primary"
        onClick={downloadPDF}
        style={{ marginBottom: "20px" }}
      >
        Download PDF Statement
      </button>

      <p className="page-sub">
        Monthly statements with closing balance. PDF export is enabled.
      </p>

      {/* Statement Cards */}
      <div className="grid grid-3">
        {statements.map((s, idx) => (
          <article className="card" key={idx}>
            <h2>{s.month}</h2>

            <div className="summary-row">
              <span>Income</span>
              <span className="amount-positive">₹{s.income}</span>
            </div>

            <div className="summary-row">
              <span>Expenses</span>
              <span className="amount-negative">-₹{s.expenses}</span>
            </div>

            <hr />

            <div className="summary-row total">
              <span>Closing Balance</span>
              <span>₹{s.closingBalance}</span>
            </div>
          </article>
        ))}
      </div>
    </Layout>
  );
}
