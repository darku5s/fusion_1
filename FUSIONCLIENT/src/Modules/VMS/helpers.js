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
  if (error?.response?.data) {
    const data = error.response.data;
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    
    // Check for DRF field validation errors (e.g. {"full_name": ["This field is required."]})
    const keys = Object.keys(data);
    if (keys.length > 0 && Array.isArray(data[keys[0]])) {
        return `${keys[0]}: ${data[keys[0]][0]}`;
    }
    
    return JSON.stringify(data);
  }
  if (typeof error?.message === "string") return error.message;
  return "Request failed. Please try again.";
}
