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
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}