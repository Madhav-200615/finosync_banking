import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";
import ReactECharts from "echarts-for-react";
import { useTheme } from "../contexts/ThemeContext";
import "./Dashboard.css"; // Import scoped CSS

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const [userName, setUserName] = useState("");
  const [welcomeText, setWelcomeText] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName") || "User";
    setUserName(storedName);

    let i = 0;
    const text = `Welcome ${storedName}!`;
    setWelcomeText(""); // Reset

    const interval = setInterval(() => {
      setWelcomeText((prev) => text.substring(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, 50); // Speed of typing

    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/transactions/dashboard");
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

  const {
    totalBalance = 0,
    recentTransactions = [],
    totalCredits = 0, // Weekly
    totalDebits = 0,  // Weekly
    monthly = [], // Daily data
    byCategory = [],
  } = dashboard || {};

  // Calculate Savings Rate (Income - Expenses) / Income
  const savingsRate = totalCredits > 0 ? Math.round(((totalCredits - totalDebits) / totalCredits) * 100) : 0;

  const textColor = theme === 'dark' ? '#e4e6eb' : '#1f1f1f';
  const gridColor = theme === 'dark' ? '#2d3748' : '#f0f0f0';

  // MONTHLY CASHFLOW ANALYSIS (Line Chart)
  const cashflowOption = {
    tooltip: { trigger: "axis" },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: monthly.map((m) => m.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11 }
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      axisLabel: { color: textColor, fontSize: 11 }
    },
    series: [
      {
        name: "Income",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: "#6c5ce7" },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(108, 92, 231, 0.3)' }, { offset: 1, color: 'rgba(108, 92, 231, 0)' }]
          }
        },
        data: monthly.map((m) => m.credit)
      },
      {
        name: "Expenses",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: "#ff7675" },
        data: monthly.map((m) => m.debit)
      }
    ]
  };

  // SPENDING BREAKDOWN (Donut Chart)
  const breakdownOption = {
    tooltip: { trigger: "item" },
    legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: textColor, fontSize: 11 } },
    series: [
      {
        name: "Spending",
        type: "pie",
        radius: ["40%", "65%"],
        center: ["50%", "40%"],
        avoidLabelOverlap: false,
        label: { show: false },
        data: byCategory.slice(0, 4).map((c, i) => ({
          value: c.amount,
          name: c.category,
          itemStyle: { color: ['#6c5ce7', '#ff7675', '#0984e3', '#fdcb6e'][i % 4] }
        }))
      }
    ]
  };

  // SPENDS BY CATEGORY (Bar Chart)
  const categoryOption = {
    tooltip: { trigger: "axis" },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: "category",
      data: byCategory.slice(0, 5).map((c) => c.category),
      axisLabel: { color: textColor, rotate: 0, fontSize: 11 }
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      axisLabel: { color: textColor, fontSize: 11 }
    },
    series: [
      {
        type: "bar",
        barWidth: "40%",
        data: byCategory.slice(0, 5).map((c, i) => ({
          value: c.amount,
          itemStyle: {
            color: ['#6c5ce7', '#ff7675', '#0984e3', '#fdcb6e', '#00b894'][i % 5],
            borderRadius: [4, 4, 0, 0]
          }
        }))
      }
    ]
  };



  return (
    <Layout title={welcomeText || "Welcome"}>
      <div className="dashboard-page-container">
        <div className="dashboard-grid">
          <div className="summary-card purple">
            <h3>Total Balance</h3>
            <div className="amount">₹{totalBalance.toLocaleString()}</div>
            <div className="trend">+12% vs last month</div>
          </div>
          <div className="summary-card blue">
            <h3>Monthly Income</h3>
            <div className="amount">₹{totalCredits.toLocaleString()}</div>
            <div className="trend">This Week</div>
          </div>
          <div className="summary-card red">
            <h3>Monthly Expenses</h3>
            <div className="amount">₹{totalDebits.toLocaleString()}</div>
            <div className="trend">This Week</div>
          </div>
          <div className="summary-card orange">
            <h3>Savings Rate</h3>
            <div className="amount">{savingsRate}%</div>
            <div className="trend">{savingsRate > 20 ? 'Healthy' : 'Needs attention'}</div>
          </div>
        </div>

        {/* MIDDLE CHARTS */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h2>Monthly Cashflow Analysis</h2>
            </div>
            <ReactECharts option={cashflowOption} style={{ height: "100%", minHeight: "200px" }} />
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <h2>Spending Breakdown</h2>
            </div>
            <ReactECharts option={breakdownOption} style={{ height: "100%", minHeight: "200px" }} />
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="bottom-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h2>Recent Activities</h2>
            </div>
            <div className="activity-list">
              {recentTransactions.slice(0, 4).map((tx) => (
                <div className="activity-item" key={tx._id}>
                  <div className="activity-icon" style={{ background: tx.type === 'CREDIT' ? '#e0f2f1' : '#ffebee', color: tx.type === 'CREDIT' ? '#00695c' : '#c62828' }}>
                    {tx.type === 'CREDIT' ? '↓' : '↑'}
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">{tx.description || tx.type}</div>
                    <div className="activity-date">{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="activity-amount" style={{ color: tx.type === 'CREDIT' ? '#00695c' : '#c62828' }}>
                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h2>Spends by Category</h2>
            </div>
            <ReactECharts option={categoryOption} style={{ height: "100%", minHeight: "200px" }} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
