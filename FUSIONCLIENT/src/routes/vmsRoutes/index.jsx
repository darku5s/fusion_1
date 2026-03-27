import { Navigate, Route, Routes } from "react-router-dom";
import { VmsPage } from "../../Modules/VMS";

function VmsRoutes() {
  return (
    <Routes>
      <Route index element={<VmsPage />} />
      <Route path="*" element={<Navigate to="/vms" replace />} />
    </Routes>
  );
}

export default VmsRoutes;
