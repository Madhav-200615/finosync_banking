import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";
import ReactECharts from "echarts-for-react";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/transactions/dashboard");

      // backend response structure:
      // { success: true, dashboard: {...} }
      setDashboard(res.data.dashboard || {});
    } catch (err) {
      console.error("DASHBOARD LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    connectWS((msg) => {
      if (msg.type === "transaction") {
        loadDashboard();
      }
    });
  }, []);

  if (!dashboard || loading) {
    return (
      <Layout title="Dashboard">
        <p>Loading...</p>
      </Layout>
    );
  }

  // Extract values safely
  const {
    accounts = [],
    totalBalance = 0,
    recentTransactions = [],
    totalCredits = 0,
    totalDebits = 0,
    monthly = [],
    byCategory = [],
  } = dashboard || {};

  const income = totalCredits;
  const expenses = totalDebits;
  const net = income - expenses;

  // ---------- Monthly Chart ----------
  const monthlyOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Credit", "Debit"] },
    xAxis: {
      type: "category",
      data: monthly.map((m) => m.label),
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Credit",
        type: "line",
        smooth: true,
        data: monthly.map((m) => m.credit || 0),
        lineStyle: { color: "#43a047", width: 3 },
      },
      {
        name: "Debit",
        type: "line",
        smooth: true,
        data: monthly.map((m) => m.debit || 0),
        lineStyle: { color: "#e53935", width: 3 },
      },
    ],
  };

  // ---------- Category Bar Chart ----------
  const categoryOption = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: byCategory.map((c) => c.category),
      axisLabel: { rotate: 22 },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Spend (₹)",
        type: "bar",
        data: byCategory.map((c) => c.amount),
        itemStyle: {
          color: function (params) {
            const colors = [
              "#1976d2",
              "#e53935",
              "#ffb300",
              "#43a047",
              "#8e24aa",
            ];
            return colors[params.dataIndex % colors.length];
          },
        },
      },
    ],
  };

  // ---------- Pie Chart ----------
  const pieOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: ₹{c} ({d}%)",
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
    },
    series: [
      {
        name: "This Month",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "45%"],
        data: [
          { value: income, name: "Credit" },
          { value: expenses, name: "Debit" },
        ],
        itemStyle: {
          color: (params) =>
            params.dataIndex === 0 ? "#43a047" : "#e53935",
        },
      },
    ],
  };

  return (
    <Layout title="Dashboard">
      {/* SUMMARY */}
      <div className="grid grid-3">
        <article className="card">
          <h2>Income (this month)</h2>
          <p className="amount-positive">₹{income}</p>
        </article>

        <article className="card">
          <h2>Expenses (this month)</h2>
          <p className="amount-negative">₹{expenses}</p>
        </article>

        <article className="card">
          <h2>Net Cashflow</h2>
          <p className={net >= 0 ? "amount-positive" : "amount-negative"}>
            ₹{net}
          </p>
        </article>
      </div>

      {/* ACCOUNTS + RECENT */}
      <div className="grid grid-2" style={{ marginTop: "20px" }}>
        <article className="card">
          <h2>Your Accounts</h2>
          <table className="table">
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc._id}>
                  <td>
                    {acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}
                  </td>
                  <td>₹{acc.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card">
          <h2>Recent activity</h2>

          {recentTransactions.length === 0 ? (
            <p>No activity</p>
          ) : (
            <table className="table">
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>{tx.note || tx.type}</td>
                    <td
                      className={
                        tx.type === "credit"
                          ? "amount-positive"
                          : "amount-negative"
                      }
                    >
                      {tx.type === "debit" ? "-" : "+"}₹{tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </div>

      {/* GRAPHS */}
      <div className="grid grid-2" style={{ marginTop: "20px" }}>
        <article className="card">
          <h2>Monthly cash flow</h2>
          <ReactECharts option={monthlyOption} style={{ height: "260px" }} />
        </article>

        <article className="card">
          <h2>Spends by category</h2>
          <ReactECharts option={categoryOption} style={{ height: "260px" }} />
        </article>
      </div>

      <article className="card" style={{ marginTop: "20px" }}>
        <h2>Credit vs Debit</h2>
        <ReactECharts option={pieOption} style={{ height: "260px" }} />
      </article>
    </Layout>
  );
}
