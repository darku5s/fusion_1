import { Navigate, Route, Routes } from "react-router-dom";
import VmsRoutes from "../vmsRoutes";

function GlobalRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/vms" replace />} />
      <Route path="/vms/*" element={<VmsRoutes />} />
      <Route path="*" element={<Navigate to="/vms" replace />} />
    </Routes>
  );
}

export default GlobalRoutes;
