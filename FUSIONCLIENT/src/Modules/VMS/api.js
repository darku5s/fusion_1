import axios from "axios";

const API_BASE = import.meta.env.VITE_VMS_API_BASE || "http://127.0.0.1:8000/vms";

function headers(token) {
  return { Authorization: `Token ${token}` };
}

export async function fetchActiveVisits(token) {
  const { data } = await axios.get(`${API_BASE}/active/`, { headers: headers(token) });
  return data;
}

export async function fetchRecentVisits(token) {
  const { data } = await axios.get(`${API_BASE}/recent/`, { headers: headers(token) });
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
