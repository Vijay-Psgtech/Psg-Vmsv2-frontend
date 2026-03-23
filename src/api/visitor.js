import api from "../utils/api";

export const getAllVisitors = () => api.get("/api/visitor/all");

export const updateVisitorStatus = (id, action) =>
  api.post(`/api/visitor/${action}/${id}`);

export const exportCSV = () =>
  api.get("/api/reports/csv", { responseType: "blob" });

export const exportExcel = () =>
  api.get("/api/reports/excel", { responseType: "blob" });
