import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Statements from "./pages/Statements";
import Cards from "./pages/Cards";
import Loans from "./pages/Loans";
import FD from "./pages/FD";
import Investments from "./pages/Investments";
import Analytics from "./pages/Analytics";
import Search from "./pages/Search";
import LoanApply from "./pages/LoanApply";

import LandingPage from "./pages/LandingPage";
import Transfer from "./pages/Transfer";

// Payment Module
import PaymentHub from "./pages/PaymentHub";
import SelfTransfer from "./pages/SelfTransfer";
import TransferToOthers from "./pages/TransferToOthers";
import PayBills from "./pages/PayBills";
import BillPayment from "./pages/BillPayment";
import OTPVerification from "./pages/OTPVerification";
import PaymentResult from "./pages/PaymentResult";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/accounts"
        element={
          <PrivateRoute>
            <Accounts />
          </PrivateRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        }
      />

      <Route
        path="/statements"
        element={
          <PrivateRoute>
            <Statements />
          </PrivateRoute>
        }
      />

      <Route
        path="/cards"
        element={
          <PrivateRoute>
            <Cards />
          </PrivateRoute>
        }
      />

      <Route
        path="/loans"
        element={
          <PrivateRoute>
            <Loans />
          </PrivateRoute>
        }
      />
      <Route path="/loan/apply" element={<LoanApply />} />


      <Route
        path="/fd"
        element={
          <PrivateRoute>
            <FD />
          </PrivateRoute>
        }
      />

      <Route
        path="/investments"
        element={
          <PrivateRoute>
            <Investments />
          </PrivateRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        }
      />

      <Route
        path="/search"
        element={
          <PrivateRoute>
            <Search />
          </PrivateRoute>
        }
      />

      {/* Payment Module Routes */}
      <Route
        path="/payments"
        element={
          <PrivateRoute>
            <PaymentHub />
          </PrivateRoute>
        }
      />

      <Route
        path="/payments/self"
        element={
          <PrivateRoute>
            <SelfTransfer />
          </PrivateRoute>
        }
      />

      <Route
        path="/payments/transfer"
        element={
          <PrivateRoute>
            <TransferToOthers />
          </PrivateRoute>
        }
      />

      <Route
        path="/payments/bills"
        element={
          <PrivateRoute>
            <PayBills />
          </PrivateRoute>
        }
      />

      <Route
        path="/payments/bill-pay"
        element={
          <PrivateRoute>
            <BillPayment />
          </PrivateRoute>
        }
      />

      <Route
        path="/payments/otp"
        element={
          <PrivateRoute>
            <OTPVerification />
          </PrivateRoute>
        }
      />

      <Route
        path="/payments/result"
        element={
          <PrivateRoute>
            <PaymentResult />
          </PrivateRoute>
        }
      />

      {/* Redirect old transfer route to new payment hub */}
      <Route path="/transfer" element={<Navigate to="/payments" replace />} />
    </Routes>
  );
}
