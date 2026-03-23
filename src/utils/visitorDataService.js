/**
 * VISITOR DATA SERVICE - FIXED
 * ✅ hostAdminDataService now relies on JWT auth (req.user._id) on backend
 * ✅ No longer passes hostId as query param — backend reads it from token
 * ✅ Correct response shape extraction
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vpass_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── helper: pull array out of any response shape ──────────────────────────
function extractArray(data) {
  if (Array.isArray(data))           return data;
  if (Array.isArray(data?.visitors)) return data.visitors;
  if (Array.isArray(data?.data))     return data.data;
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// HOST ADMIN DATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const hostAdminDataService = {

  /**
   * Fetch visitors for the currently logged-in host admin.
   * The backend reads req.user._id from the JWT — no need to pass hostId.
   * hostId param is kept for API compatibility but is NOT sent to backend.
   */
  async getHostVisitors(_hostId = null) {
    console.log('📊 [HostAdminDataService] Fetching visitors for host...');

    // Level 1 — /visitor/host-visitors (primary, uses JWT auth)
    try {
      const res = await api.get('/visitor/host-visitors');
      console.log('📡 [HostAdminDataService] API Response:', res.data);
      const visitors = extractArray(res.data);
      console.log(`✅ [HostAdminDataService] Loaded ${visitors.length} visitors`);
      return visitors;
    } catch (err1) {
      console.warn(`⚠️ /visitor/host-visitors failed (${err1.response?.status}), trying /visitor/by-host...`);
    }

    // Level 2 — /visitor/by-host (fallback, also uses JWT auth)
    try {
      const res = await api.get('/visitor/by-host');
      const visitors = extractArray(res.data);
      console.log(`✅ [HostAdminDataService] L2 loaded ${visitors.length} visitors`);
      return visitors;
    } catch (err2) {
      console.warn(`⚠️ /visitor/by-host failed (${err2.response?.status}), returning []`);
    }

    return [];
  },

  filterPending(visitors)   { return visitors.filter(v => v.status === 'PENDING');   },
  filterApproved(visitors)  { return visitors.filter(v => v.status === 'APPROVED');  },
  filterInside(visitors)    { return visitors.filter(v => v.status === 'IN');         },
  filterCompleted(visitors) { return visitors.filter(v => v.status === 'OUT');        },
  filterOverstay(visitors)  { return visitors.filter(v => v.status === 'OVERSTAY');  },

  calculateStats(visitors) {
    return {
      pending:   this.filterPending(visitors).length,
      approved:  this.filterApproved(visitors).length,
      inside:    this.filterInside(visitors).length,
      completed: this.filterCompleted(visitors).length,
      overstay:  this.filterOverstay(visitors).length,
      total:     visitors.length,
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const adminDataService = {
  async getAllVisitors() {
    console.log('📊 [AdminDataService] Fetching all visitors...');
    try {
      const res = await api.get('/visitor/all');
      const visitors = extractArray(res.data);
      console.log(`✅ [AdminDataService] Loaded ${visitors.length} visitors`);
      return visitors;
    } catch (_err) {
      try {
        const res = await api.get('/visitor');
        const visitors = extractArray(res.data);
        console.log(`✅ [AdminDataService] Fallback loaded ${visitors.length} visitors`);
        return visitors;
      } catch (err2) {
        console.error('❌ [AdminDataService] Error:', err2.message);
        return [];
      }
    }
  },

  filterPending(visitors)   { return visitors.filter(v => v.status === 'PENDING');   },
  filterApproved(visitors)  { return visitors.filter(v => v.status === 'APPROVED');  },
  filterInside(visitors)    { return visitors.filter(v => v.status === 'IN');         },
  filterCompleted(visitors) { return visitors.filter(v => v.status === 'OUT');        },
  filterOverstay(visitors)  { return visitors.filter(v => v.status === 'OVERSTAY');  },

  calculateStats(visitors) {
    return {
      pending:   this.filterPending(visitors).length,
      approved:  this.filterApproved(visitors).length,
      inside:    this.filterInside(visitors).length,
      completed: this.filterCompleted(visitors).length,
      overstay:  this.filterOverstay(visitors).length,
      total:     visitors.length,
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN DATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const superAdminDataService = {
  async getAllHostAdmins() {
    console.log('📊 [SuperAdminDataService] Fetching all host admins...');
    try {
      const res = await api.get('/hostadmin');
      const admins = extractArray(res.data);
      console.log(`✅ [SuperAdminDataService] Loaded ${admins.length} host admins`);
      return admins;
    } catch (err) {
      console.error('❌ [SuperAdminDataService] Error:', err.message);
      return [];
    }
  },

  filterPending(admins)  { return admins.filter(a => !a.isApproved);           },
  filterActive(admins)   { return admins.filter(a => a.status === 'ACTIVE');    },
  filterInactive(admins) { return admins.filter(a => a.status === 'INACTIVE');  },
  filterSuspended(admins){ return admins.filter(a => a.status === 'SUSPENDED'); },

  calculateStats(admins) {
    return {
      total:     admins.length,
      pending:   this.filterPending(admins).length,
      active:    this.filterActive(admins).length,
      inactive:  this.filterInactive(admins).length,
      suspended: this.filterSuspended(admins).length,
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY DATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const securityDataService = {
  async getGateVisitors(gateId = null) {
    console.log('📊 [SecurityDataService] Fetching gate visitors...');
    try {
      const res = await api.get('/visitor');
      let visitors = extractArray(res.data);
      if (gateId) visitors = visitors.filter(v => v.gate === gateId);
      visitors = visitors.filter(v => ['IN', 'OVERSTAY'].includes(v.status));
      console.log(`✅ [SecurityDataService] Loaded ${visitors.length} gate visitors`);
      return visitors;
    } catch (err) {
      console.error('❌ [SecurityDataService] Error:', err.message);
      return [];
    }
  },

  filterOverstay(visitors) { return visitors.filter(v => v.status === 'OVERSTAY'); },
  filterInside(visitors)   { return visitors.filter(v => v.status === 'IN');        },

  calculateStats(visitors) {
    return {
      total:    visitors.length,
      inside:   this.filterInside(visitors).length,
      overstay: this.filterOverstay(visitors).length,
    };
  },
};

export default {
  admin:      adminDataService,
  hostAdmin:  hostAdminDataService,
  superAdmin: superAdminDataService,
  security:   securityDataService,
};