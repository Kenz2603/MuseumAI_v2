import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Artifacts from "../pages/Artifacts";
import ExhibitionAreas from "../pages/ExhibitionAreas";
import Exhibitions from "../pages/Exhibitions";
import Visitors from "../pages/Visitors";
import Tickets from "../pages/Tickets";
import Feedback from "../pages/Feedback";
import Users from "../pages/Users";
import AIAnalysis from "../pages/AIAnalysis";
import LoginHistory from "../pages/LoginHistory";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/artifacts" element={<Artifacts />} />
          <Route path="/exhibition-areas" element={<ExhibitionAreas />} />
          <Route path="/exhibitions" element={<Exhibitions />} />
          <Route path="/visitors" element={<Visitors />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/users" element={<Users />} />
          <Route path="/login-history" element={<LoginHistory />} />
          <Route path="/ai-analysis" element={<AIAnalysis />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}