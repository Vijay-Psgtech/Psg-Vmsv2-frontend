// src/utils/hostNotify.js
import api from "./api";

export async function notifyHost(hostEmail, visitor) {
  // backend should implement /visitors/notify
  return api.post("/visitors/notify", { hostEmail, visitor });
}
