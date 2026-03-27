export function mapVisitStatus(status) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    registered: "Pending Verification",
    id_verified: "Verified",
    pass_issued: "Pass Issued",
    inside: "Inside Campus",
    exited: "Completed",
    denied: "Denied",
  };
  return map[normalized] || status || "Unknown";
}

export function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "denied") return "statusDenied";
  if (normalized === "inside") return "statusInside";
  if (normalized === "pass_issued") return "statusPass";
  if (normalized === "exited") return "statusExited";
  return "statusDefault";
}

export function parseError(error) {
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.response?.data?.error) return error.response.data.error;
  if (typeof error?.message === "string") return error.message;
  return "Request failed. Please try again.";
}
