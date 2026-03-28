import axios from "axios";

const API_BASE = import.meta.env.VITE_VMS_API_BASE || "http://127.0.0.1:8000/vms";

function headers(token) {
  return { Authorization: `Token ${token}` };
}

export async function fetchActiveVisits(token) {
  const { data } = await axios.get(`${API_BASE}/active/`, { headers: headers(token) });
  return data;
}

export async function fetchRecentVisits(token, limit = 100) {
  const { data } = await axios.get(`${API_BASE}/recent/?limit=${limit}`, { headers: headers(token) });
  return data;
}

export async function fetchIncidents(token) {
  const { data } = await axios.get(`${API_BASE}/incidents/`, { headers: headers(token) });
  return data;
}

export async function registerVisitor(token, payload) {
  const { data } = await axios.post(`${API_BASE}/register/`, payload, { headers: headers(token) });
  return data;
}

export async function verifyVisitor(token, payload) {
  const { data } = await axios.post(`${API_BASE}/verify/`, payload, { headers: headers(token) });
  return data;
}

export async function issuePass(token, payload) {
  const { data } = await axios.post(`${API_BASE}/pass/`, payload, { headers: headers(token) });
  return data;
}

export async function recordEntry(token, payload) {
  const { data } = await axios.post(`${API_BASE}/entry/`, payload, { headers: headers(token) });
  return data;
}

export async function recordExit(token, payload) {
  const { data } = await axios.post(`${API_BASE}/exit/`, payload, { headers: headers(token) });
  return data;
}

export async function denyEntry(token, payload) {
  const { data } = await axios.post(`${API_BASE}/deny/`, payload, { headers: headers(token) });
  return data;
}

export async function approveVisit(token, payload) {
  const { data } = await axios.post(`${API_BASE}/approve/`, payload, { headers: headers(token) });
  return data;
}

export async function fetchBlacklist(token) {
  const { data } = await axios.get(`${API_BASE}/blacklist/`, { headers: headers(token) });
  return data;
}

export async function addBlacklist(token, payload) {
  const { data } = await axios.post(`${API_BASE}/blacklist/`, payload, { headers: headers(token) });
  return data;
}

export async function removeBlacklist(token, id_number) {
  const { data } = await axios.delete(`${API_BASE}/blacklist/${id_number}/`, { headers: headers(token) });
  return data;
}

export async function reportIncident(token, payload) {
  const { data } = await axios.post(`${API_BASE}/incidents/`, payload, { headers: headers(token) });
  return data;
}

export async function fetchReports(token) {
  const { data } = await axios.get(`${API_BASE}/reports/`, { headers: headers(token) });
  return data;
}

export async function fetchSettings(token) {
  const { data } = await axios.get(`${API_BASE}/settings/`, { headers: headers(token) });
  return data;
}

export async function updateSetting(token, payload) {
  const { data } = await axios.post(`${API_BASE}/settings/`, payload, { headers: headers(token) });
  return data;
}

export async function exportData(token) {
  // It's a file download typically, but if it returns JSON data we can handle it normally
  const { data } = await axios.get(`${API_BASE}/import-export/`, { headers: headers(token) });
  return data;
}

export async function importData(token, formData) {
  // requires multipart form-data
  const { data } = await axios.post(`${API_BASE}/import-export/`, formData, { 
    headers: { ...headers(token), 'Content-Type': 'multipart/form-data' } 
  });
  return data;
}
