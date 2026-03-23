/**
 * SUPER ADMIN DASHBOARD - FULLY ENHANCED
 * Features added:
 * 1. Export visitors to CSV + Excel (with SheetJS)
 * 2. Date range filter: Today / Last 7 Days / Last 30 Days / Custom
 * 3. Status filter on visitors tab
 * 4. Visitors per host admin bar chart (new Analytics tab)
 * 5. Last login + visitor count per host shown in table
 * 6. Reset host admin password dialog
 * 7. System-wide activity log tab with type filters + export
 * 8. View host admin details dialog
 * 9. All submit-lock bug fixes preserved
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Paper, Stack, TextField, Typography, Avatar,
  Chip, Alert, CircularProgress, Container, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Tooltip, Tab, Tabs,
  MenuItem, Divider, InputAdornment,
} from "@mui/material";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
} from "recharts";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/Warning";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import HistoryIcon from "@mui/icons-material/History";
import LockResetIcon from "@mui/icons-material/LockReset";
import SearchIcon from "@mui/icons-material/Search";
import BarChartIcon from "@mui/icons-material/BarChart";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketProvider";

// ─── Module-level submit locks ────────────────────────────────────────────
let _hostLock = false;
let _secLock = false;

// ─── API instance ─────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000, headers: { "Content-Type": "application/json" } });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("vpass_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ─── Utilities ────────────────────────────────────────────────────────────
function arr(r) {
  const p = r?.data;
  if (!p) return [];
  for (const k of ["visitors","data","security","hostAdmins","users"]) if (Array.isArray(p[k])) return p[k];
  if (Array.isArray(p)) return p;
  return [];
}
function pwd() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
  return Array.from({length:10},()=>c[Math.floor(Math.random()*c.length)]).join("");
}
function fmt(d) { return d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"; }
function fmtDT(d) { return d ? new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"; }

function exportCSV(rows, name) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download: `${name}_${new Date().toISOString().slice(0,10)}.csv` });
  a.click();
}
async function exportXLSX(rows, name) {
  if (!rows.length) return;
  if (!window.XLSX) await new Promise((ok,err)=>{ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; s.onload=ok; s.onerror=err; document.head.appendChild(s); });
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(rows), "Data");
  window.XLSX.writeFile(wb, `${name}_${new Date().toISOString().slice(0,10)}.xlsx`);
}
function dateFilter(items, field, range, from, to) {
  if (range === "all") return items;
  const now = new Date();
  return items.filter(item => {
    const d = item[field] ? new Date(item[field]) : null;
    if (!d) return false;
    if (range === "today") return d.toDateString() === now.toDateString();
    if (range === "week") return d >= new Date(now - 7*864e5);
    if (range === "month") return d >= new Date(now - 30*864e5);
    if (range === "custom" && from && to) return d >= new Date(from) && d <= new Date(to+"T23:59:59");
    return true;
  });
}

// ─── Small Components ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, hex }) {
  return (
    <Box sx={{ background:`${hex}12`, border:`2px solid ${hex}28`, borderRadius:"14px", p:2.5, transition:"all 0.25s", "&:hover":{ borderColor:hex, transform:"translateY(-3px)" } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontSize:11, fontWeight:700, color:hex, textTransform:"uppercase", letterSpacing:"0.5px", mb:0.5 }}>{label}</Typography>
          <Typography sx={{ fontSize:30, fontWeight:800, color:hex, lineHeight:1 }}>{value}</Typography>
          {sub && <Typography sx={{ fontSize:11, color:hex, opacity:0.65, mt:0.5 }}>{sub}</Typography>}
        </Box>
        <Box sx={{ width:44,height:44,borderRadius:"10px",background:`${hex}14`,display:"flex",alignItems:"center",justifyContent:"center" }}>
          {Icon && <Icon sx={{ fontSize:22, color:hex }} />}
        </Box>
      </Stack>
    </Box>
  );
}

function TP({ children, value, index }) {
  return (
    <Box role="tabpanel" sx={{ visibility:value!==index?"hidden":"visible", height:value!==index?0:"auto", overflow:value!==index?"hidden":"visible", pt:value===index?3:0 }}>
      {children}
    </Box>
  );
}

const STATUS_STYLE = {
  PENDING:  { bg:"#fef9c3", fg:"#713f12" },
  APPROVED: { bg:"#dbeafe", fg:"#1e40af" },
  IN:       { bg:"#dcfce7", fg:"#14532d" },
  OVERSTAY: { bg:"#fee2e2", fg:"#991b1b" },
  OUT:      { bg:"#f1f5f9", fg:"#374151" },
  REJECTED: { bg:"#fee2e2", fg:"#991b1b" },
};
function SBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return <Box sx={{ display:"inline-flex",px:"8px",py:"3px",borderRadius:"6px",fontSize:"11px",fontWeight:700,bgcolor:s.bg,color:s.fg }}>{status}</Box>;
}

// ─── Charts Panel ─────────────────────────────────────────────────────────
const COLORS = ["#60A5FA","#34D399","#F59E0B","#94A3B8","#F87171","#A78BFA","#F472B6","#2DD4BF"];
function Charts({ visitors }) {
  const daily = useMemo(() => {
    const m = {};
    for (let i=6;i>=0;i--) { const d=new Date(); d.setDate(d.getDate()-i); m[d.toISOString().slice(0,10)]=0; }
    visitors.forEach(v => { const k=v.createdAt?new Date(v.createdAt).toISOString().slice(0,10):null; if(k&&m[k]!==undefined)m[k]++; });
    return Object.entries(m).map(([k,count])=>({date:k.slice(5),count}));
  }, [visitors]);

  const byStatus = useMemo(() => {
    const m = {};
    visitors.forEach(v => m[v.status]=(m[v.status]||0)+1);
    return Object.entries(m).map(([name,value])=>({name,value}));
  }, [visitors]);

  const byHost = useMemo(() => {
    const m = {};
    visitors.forEach(v => { const n=v.host||"Unknown"; m[n]=(m[n]||0)+1; });
    return Object.entries(m).map(([name,count])=>({ name:name.length>14?name.slice(0,14)+"…":name, count })).sort((a,b)=>b.count-a.count).slice(0,10);
  }, [visitors]);

  return (
    <Box sx={{ display:"grid", gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"}, gap:2 }}>
      <Card sx={{ border:"1px solid #e5e7eb", borderRadius:"14px" }}>
        <CardContent sx={{ p:3 }}>
          <Typography fontSize={14} fontWeight={700} mb={2}>📈 Visitors — Last 7 days</Typography>
          <Box sx={{ height:200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/><stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><ChartTooltip/>
                <Area type="monotone" dataKey="count" stroke="#60A5FA" fill="url(#g1)"/>
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ border:"1px solid #e5e7eb", borderRadius:"14px" }}>
        <CardContent sx={{ p:3 }}>
          <Typography fontSize={14} fontWeight={700} mb={2}>📊 Status breakdown</Typography>
          <Box sx={{ height:200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40} label={({name,percent})=>`${name} ${Math.round(percent*100)}%`} labelLine={false}>
                  {byStatus.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <ChartTooltip/>
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {byHost.length > 0 && (
        <Card sx={{ border:"1px solid #e5e7eb", borderRadius:"14px", gridColumn:{xs:"1",md:"1 / -1"} }}>
          <CardContent sx={{ p:3 }}>
            <Typography fontSize={14} fontWeight={700} mb={2}>👥 Visitors per host admin</Typography>
            <Box sx={{ height:240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byHost} margin={{top:5,right:20,bottom:20,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="name" tick={{fontSize:11}} angle={-15} textAnchor="end" interval={0}/>
                  <YAxis tick={{fontSize:11}}/>
                  <ChartTooltip/>
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {byHost.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────
function ActivityLog({ visitors, hostAdmins }) {
  const [filter, setFilter] = useState("all");

  const events = useMemo(() => {
    const list = [];
    visitors.forEach(v => {
      if (v.createdAt) list.push({ t:new Date(v.createdAt), type:"booking", icon:"📝", label:`${v.name} booked a visit`, sub:`Host: ${v.host||"—"} · Gate: ${v.gate||"—"}`, hex:"#3b82f6" });
      if (v.approvedAt) list.push({ t:new Date(v.approvedAt), type:"approval", icon:"✅", label:`${v.name}'s visit approved`, sub:`Duration: ${v.expectedDuration||120} mins`, hex:"#10b981" });
      if (v.rejectedAt) list.push({ t:new Date(v.rejectedAt), type:"rejection", icon:"❌", label:`${v.name}'s visit rejected`, sub:v.rejectionReason||"No reason", hex:"#ef4444" });
      if (v.checkInTime) list.push({ t:new Date(v.checkInTime), type:"checkin", icon:"🚪", label:`${v.name} checked in`, sub:`Gate: ${v.gate||"—"}`, hex:"#7c3aed" });
      if (v.checkOutTime) list.push({ t:new Date(v.checkOutTime), type:"checkout", icon:"🏃", label:`${v.name} checked out`, sub:`Duration: ${v.actualDuration||"—"} mins`, hex:"#6b7280" });
    });
    hostAdmins.forEach(h => {
      if (h.createdAt) list.push({ t:new Date(h.createdAt), type:"user", icon:"👤", label:`Host admin created: ${h.name}`, sub:`${h.company||"—"} · ${h.email}`, hex:"#d4af37" });
      if (h.lastLogin) list.push({ t:new Date(h.lastLogin), type:"login", icon:"🔑", label:`${h.name} logged in`, sub:h.email, hex:"#0ea5e9" });
    });
    return list.sort((a,b)=>b.t-a.t);
  }, [visitors, hostAdmins]);

  const shown = useMemo(() => filter === "all" ? events : events.filter(e => e.type === filter), [events, filter]);

  const types = ["all","booking","approval","rejection","checkin","checkout","login","user"];

  return (
    <Box sx={{ p:3 }}>
      <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" gap={1} alignItems="center">
        {types.map(t => (
          <Chip key={t} label={t==="all"?"All":t.charAt(0).toUpperCase()+t.slice(1)} size="small"
            onClick={()=>setFilter(t)}
            variant={filter===t?"filled":"outlined"}
            sx={filter===t?{bgcolor:"#0f172a",color:"#fff",fontWeight:700}:{}}
          />
        ))}
        <Button size="small" variant="outlined" startIcon={<DownloadIcon/>} sx={{ ml:"auto" }}
          onClick={()=>exportCSV(shown.map(e=>({Time:e.t.toLocaleString(),Type:e.type,Event:e.label,Detail:e.sub})),"activity_log")}>
          Export
        </Button>
      </Stack>
      <Typography fontSize={12} color="text.secondary" mb={2}>{shown.length} events</Typography>
      {shown.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={6}>No activity found</Typography>
      ) : (
        <Box sx={{ maxHeight:520, overflowY:"auto", pr:1 }}>
          {shown.slice(0,300).map((e,i) => (
            <Box key={i} sx={{ display:"flex", gap:2, py:1.5, px:2, mb:0.5, borderRadius:"10px", background:"#f8fafc", borderLeft:`4px solid ${e.hex}`, "&:hover":{ background:"#f1f5f9" } }}>
              <Typography fontSize={18} sx={{ lineHeight:1.6 }}>{e.icon}</Typography>
              <Box flex={1} minWidth={0}>
                <Typography fontSize={13} fontWeight={600}>{e.label}</Typography>
                <Typography fontSize={11} color="text.secondary" sx={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.sub}</Typography>
              </Box>
              <Typography fontSize={11} color="text.secondary" sx={{ whiteSpace:"nowrap", alignSelf:"center" }}>{fmtDT(e.t)}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const { socket } = useSocket();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [hosts, setHosts] = useState([]);
  const [sec, setSec] = useState([]);
  const [vis, setVis] = useState([]);
  const [depts, setDepts] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  // Visitor filters
  const [dateRange, setDateRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [statusF, setStatusF] = useState("all");

  // Dialogs
  const [hostDlg, setHostDlg] = useState(false);
  const [secDlg, setSecDlg] = useState(false);
  const [resetDlg, setResetDlg] = useState(null);
  const [viewDlg, setViewDlg] = useState(null);
  const [emailErr, setEmailErr] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [creds, setCreds] = useState(null);
  const [hostForm, setHostForm] = useState({ name:"",email:"",phone:"",company:"",department:"",password:"" });
  const [secForm, setSecForm] = useState({ name:"",email:"",phone:"",department:"",badge:"",shift:"DAY" });

  // Auth guard
  useEffect(() => { if (user && user.role !== "superadmin") navigate("/login",{replace:true}); }, [user,navigate]);

  // Load
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    const [vR,hR,sR,dR] = await Promise.allSettled([
      api.get("/visitor/all").catch(()=>api.get("/visitor")),
      api.get("/hostadmin"),
      api.get("/security"),
      api.get("/admin/departments"),
    ]);
    if (vR.status==="fulfilled") setVis(arr(vR.value));
    if (hR.status==="fulfilled") setHosts(arr(hR.value));
    if (sR.status==="fulfilled") setSec(arr(sR.value));
    if (dR.status==="fulfilled") setDepts(dR.value.data?.data||[]);
    else setDepts([{_id:"1",name:"Engineering"},{_id:"2",name:"Human Resources"},{_id:"3",name:"Sales"},{_id:"4",name:"Marketing"},{_id:"5",name:"Operations"},{_id:"6",name:"Finance"}]);
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role==="superadmin") load(); }, [user,load]);

  // Socket
  useEffect(() => {
    if (!socket) return;
    const onNew = v => setVis(p=>[v,...p]);
    const onUpd = v => setVis(p=>p.map(x=>x._id===v._id?v:x));
    ["visitor:new"].forEach(e=>socket.on(e,onNew));
    ["visitor:updated","visitor:approved","visitor:checkin","visitor:checkout"].forEach(e=>socket.on(e,onUpd));
    return () => { ["visitor:new"].forEach(e=>socket.off(e,onNew)); ["visitor:updated","visitor:approved","visitor:checkin","visitor:checkout"].forEach(e=>socket.off(e,onUpd)); };
  }, [socket]);

  // Create host
  const createHost = async () => {
    if (_hostLock) return;
    if (!hostForm.name?.trim()) { setErr("Name required"); return; }
    if (!hostForm.email?.trim()) { setErr("Email required"); return; }
    if (!hostForm.phone?.trim()) { setErr("Phone required"); return; }
    if (!hostForm.company?.trim()) { setErr("Company required"); return; }
    const p = hostForm.password?.trim() || pwd();
    _hostLock = true;
    try {
      setLoading(true); setErr("");
      const r = await api.post("/hostadmin",{ name:hostForm.name.trim(), email:hostForm.email.trim().toLowerCase(), phone:hostForm.phone.trim(), company:hostForm.company.trim(), department:hostForm.department?.trim()||"N/A", password:p });
      setHosts(prev=>[r.data?.data||r.data,...prev]);
      setCreds({ name:hostForm.name.trim(), email:hostForm.email.trim(), password:p });
      setOk("✅ Host admin created!"); setTimeout(()=>setOk(""),4000);
      setHostForm({name:"",email:"",phone:"",company:"",department:"",password:""});
      setHostDlg(false);
    } catch (e) {
      if (e.response?.status===409) { setEmailErr(true); setErr(`Email "${hostForm.email}" already exists.`); }
      else setErr("Failed: "+(e.response?.data?.message||e.message));
    } finally { setLoading(false); setTimeout(()=>{_hostLock=false;},1000); }
  };

  // Reset password
  const resetPwd = async () => {
    if (!newPwd.trim()||newPwd.length<6) { setErr("Min 6 characters"); return; }
    setResetLoading(true);
    try {
      try { await api.patch(`/superadmin/hostadmins/${resetDlg._id}/reset-password`,{newPassword:newPwd}); }
      catch { await api.patch(`/superadmin/users/${resetDlg._id}/reset-password`,{newPassword:newPwd}); }
      setOk(`✅ Password reset for ${resetDlg.name}`);
      setResetDlg(null); setNewPwd("");
    } catch (e) { setErr("Reset failed: "+(e.response?.data?.message||e.message)); }
    finally { setResetLoading(false); }
  };

  // Create security
  const createSec = async () => {
    if (_secLock) return;
    if (!secForm.name?.trim()||!secForm.email?.trim()) { setErr("Name and email required"); return; }
    _secLock = true;
    try {
      setLoading(true); setErr("");
      const r = await api.post("/security",secForm);
      setSec(p=>[r.data?.data||r.data,...p]);
      setOk("✅ Security personnel added!"); setTimeout(()=>setOk(""),4000);
      setSecForm({name:"",email:"",phone:"",department:"",badge:"",shift:"DAY"});
      setSecDlg(false);
    } catch (e) { setErr("Failed: "+(e.response?.data?.message||e.message)); }
    finally { setLoading(false); setTimeout(()=>{_secLock=false;},1000); }
  };

  // Delete
  const delHost = async id => {
    if (!window.confirm("Delete this host admin?")) return;
    try { await api.delete(`/hostadmin/${id}`); setHosts(p=>p.filter(h=>h._id!==id)); setOk("Deleted!"); }
    catch (e) { setErr("Delete failed: "+e.message); }
  };
  const delSec = async id => {
    if (!window.confirm("Delete?")) return;
    try { await api.delete(`/security/${id}`); setSec(p=>p.filter(s=>s._id!==id)); setOk("Deleted!"); }
    catch (e) { setErr("Delete failed: "+e.message); }
  };

  // Stats
  const stats = useMemo(()=>({
    hosts:hosts.length, activeHosts:hosts.filter(h=>h.active!==false).length,
    totalVis:vis.length, todayVis:vis.filter(v=>v.createdAt&&new Date(v.createdAt).toDateString()===new Date().toDateString()).length,
    inside:vis.filter(v=>v.status==="IN").length, overstay:vis.filter(v=>v.status==="OVERSTAY").length,
  }),[hosts,vis]);

  // Visitor count per host
  const hostVisCount = useMemo(()=>{
    const m={};
    vis.forEach(v=>{ if(v.hostId) m[String(v.hostId)]=(m[String(v.hostId)]||0)+1; });
    return m;
  },[vis]);

  // Filtered lists
  const fHosts = useMemo(()=>hosts.filter(h=>!search||(h.name+h.email+h.company+"").toLowerCase().includes(search.toLowerCase())),[hosts,search]);
  const fSec = useMemo(()=>sec.filter(s=>!search||(s.name+s.email+"").toLowerCase().includes(search.toLowerCase())),[sec,search]);
  const fVis = useMemo(()=>{
    let r = vis.filter(v=>!search||(v.name+v.email+v.host+v.visitorId+"").toLowerCase().includes(search.toLowerCase()));
    if (statusF!=="all") r=r.filter(v=>v.status===statusF);
    return dateFilter(r,"createdAt",dateRange,customFrom,customTo);
  },[vis,search,statusF,dateRange,customFrom,customTo]);

  // Export visitors
  const expVisCSV = ()=>exportCSV(fVis.map(v=>({ "ID":v.visitorId||v._id,"Name":v.name,"Email":v.email,"Phone":v.phone,"Company":v.company||"","Host":v.host||"","Gate":v.gate||"","Status":v.status,"Booked":fmt(v.createdAt),"Check-In":fmtDT(v.checkInTime),"Check-Out":fmtDT(v.checkOutTime),"Duration(min)":v.actualDuration||"" })),"visitors");
  const expVisXLSX = ()=>exportXLSX(fVis.map(v=>({ "ID":v.visitorId||v._id,"Name":v.name,"Email":v.email,"Phone":v.phone,"Company":v.company||"","Host":v.host||"","Gate":v.gate||"","Status":v.status,"Booked":fmt(v.createdAt),"Check-In":fmtDT(v.checkInTime),"Check-Out":fmtDT(v.checkOutTime),"Duration(min)":v.actualDuration||"" })),"visitors");
  const expHostCSV = ()=>exportCSV(fHosts.map(h=>({ Name:h.name,Email:h.email,Phone:h.phone,Company:h.company||"",Department:h.department||"",Active:h.active!==false?"Yes":"No","Last Login":fmtDT(h.lastLogin),"Created":fmt(h.createdAt),"Total Visitors":hostVisCount[String(h._id)]||0 })),"host_admins");

  if (!user) return <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#0f172a"><CircularProgress sx={{color:"#d4af37"}}/></Box>;

  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"#f8fafc" }}>

      {/* HEADER */}
      <Box sx={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", borderBottom:"3px solid #d4af37", position:"sticky", top:0, zIndex:100 }}>
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between" alignItems="center" py={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width:52,height:52,borderRadius:"12px",background:"linear-gradient(135deg,#d4af37,#fbbf24)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <AdminPanelSettingsIcon sx={{ fontSize:26, color:"#0f172a" }}/>
              </Box>
              <Box>
                <Typography sx={{ fontSize:24,fontWeight:800,color:"#d4af37" }}>SUPER ADMIN</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width:7,height:7,borderRadius:"50%",bgcolor:socket?.connected?"#22c55e":"#6b7280" }}/>
                  <Typography sx={{ fontSize:11,color:"#94a3b8" }}>{socket?.connected?"LIVE":"OFFLINE"}</Typography>
                  <Typography sx={{ fontSize:11,color:"#64748b",ml:1 }}>{stats.todayVis} bookings today</Typography>
                </Stack>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh"><span><IconButton onClick={load} disabled={loading} sx={{color:"#d4af37"}}><RefreshIcon/></IconButton></span></Tooltip>
              <Tooltip title="Logout"><IconButton onClick={logoutUser} sx={{color:"#ef4444"}}><LogoutIcon/></IconButton></Tooltip>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py:3 }}>

        {/* ALERTS */}
        {err && <Alert severity="error" onClose={()=>setErr("")} sx={{mb:2}}>{err}</Alert>}
        {ok && <Alert severity="success" onClose={()=>setOk("")} sx={{mb:2}}>{ok}</Alert>}
        {stats.overstay>0 && <Alert severity="error" sx={{mb:2,border:"2px solid #ef4444",fontWeight:700}}>🚨 {stats.overstay} visitor(s) are overstaying!</Alert>}

        {/* CREDENTIALS */}
        {creds && (
          <Alert severity="success" sx={{mb:3,border:"2px solid #10b981"}} onClose={()=>setCreds(null)}>
            <Typography fontWeight={700} mb={0.5}>✅ Host admin created — share these credentials:</Typography>
            <Typography fontSize={13}>Name: <strong>{creds.name}</strong> &nbsp;|&nbsp; Email: <strong>{creds.email}</strong></Typography>
            <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
              <Typography fontSize={13}>Password: <code style={{background:"#d1fae5",padding:"2px 8px",borderRadius:4,fontFamily:"monospace"}}>{creds.password}</code></Typography>
              <Tooltip title="Copy"><IconButton size="small" onClick={()=>{navigator.clipboard.writeText(creds.password);setOk("Copied!");}}><ContentCopyIcon fontSize="small"/></IconButton></Tooltip>
            </Stack>
          </Alert>
        )}

        {/* STAT CARDS */}
        <Box sx={{ display:"grid", gridTemplateColumns:{xs:"1fr 1fr",sm:"repeat(3,1fr)",md:"repeat(6,1fr)"}, gap:2, mb:4 }}>
          <StatCard label="Host Admins" value={stats.hosts} sub={`${stats.activeHosts} active`} icon={AdminPanelSettingsIcon} hex="#d4af37"/>
          <StatCard label="Security" value={sec.length} icon={SecurityIcon} hex="#7c3aed"/>
          <StatCard label="Total Visitors" value={stats.totalVis} icon={PeopleIcon} hex="#3b82f6"/>
          <StatCard label="Today" value={stats.todayVis} sub="new bookings" icon={PeopleIcon} hex="#10b981"/>
          <StatCard label="Inside Now" value={stats.inside} icon={PeopleIcon} hex="#0f172a"/>
          <StatCard label="Overstaying" value={stats.overstay} icon={WarningIcon} hex="#ef4444"/>
        </Box>

        {/* TABS */}
        <Paper elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:"16px", bgcolor:"#fff" }}>
          <Tabs value={tab} onChange={(_,v)=>{setTab(v);setPage(0);setSearch("");setStatusF("all");setDateRange("all");}} sx={{px:2,borderBottom:"1px solid #e2e8f0"}} variant="scrollable" scrollButtons="auto">
            <Tab icon={<AdminPanelSettingsIcon/>} iconPosition="start" label="Host Admins"/>
            <Tab icon={<SecurityIcon/>} iconPosition="start" label="Security"/>
            <Tab icon={<PeopleIcon/>} iconPosition="start" label="Visitors"/>
            <Tab icon={<BarChartIcon/>} iconPosition="start" label="Analytics"/>
            <Tab icon={<HistoryIcon/>} iconPosition="start" label="Activity Log"/>
          </Tabs>

          {/* ── HOST ADMINS ── */}
          <TP value={tab} index={0}>
            <Box sx={{p:3}}>
              <Stack direction={{xs:"column",md:"row"}} spacing={2} alignItems={{md:"center"}} mb={3}>
                <TextField size="small" placeholder="Search name, email, company…" value={search} onChange={e=>setSearch(e.target.value)} sx={{flex:1,maxWidth:380}} InputProps={{startAdornment:<InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>}}/>
                <Stack direction="row" spacing={1} sx={{ml:{md:"auto"}}}>
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon/>} onClick={expHostCSV}>CSV</Button>
                  <Button variant="contained" startIcon={<AddIcon/>} onClick={()=>setHostDlg(true)} sx={{background:"linear-gradient(135deg,#d4af37,#fbbf24)",color:"#0f172a",fontWeight:700}}>New Host</Button>
                </Stack>
              </Stack>
              {loading ? <Box textAlign="center" py={6}><CircularProgress sx={{color:"#d4af37"}}/></Box> : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{bgcolor:"#f8fafc"}}>
                          {["Host Admin","Company / Dept","Contact","Visitors","Last Login","Status","Actions"].map(h=>(
                            <TableCell key={h} align={h==="Actions"?"right":undefined} sx={{fontWeight:700,fontSize:12}}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fHosts.slice(page*rpp,page*rpp+rpp).map(a=>(
                          <TableRow key={a._id} sx={{"&:hover":{bgcolor:"#f9fafb"}}}>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{width:34,height:34,background:"linear-gradient(135deg,#d4af37,#7c3aed)",fontSize:13,fontWeight:700}}>{a.name?.[0]?.toUpperCase()}</Avatar>
                                <Box><Typography fontSize={13} fontWeight={600}>{a.name}</Typography><Typography fontSize={11} color="text.secondary">{a.email}</Typography></Box>
                              </Stack>
                            </TableCell>
                            <TableCell><Typography fontSize={12}>{a.company||"—"}</Typography><Typography fontSize={11} color="text.secondary">{a.department||"—"}</Typography></TableCell>
                            <TableCell><Typography fontSize={12}>{a.phone||"—"}</Typography></TableCell>
                            <TableCell>
                              <Chip label={hostVisCount[String(a._id)]||0} size="small" sx={{bgcolor:"#dbeafe",color:"#1e40af",fontWeight:700,fontSize:12}}/>
                            </TableCell>
                            <TableCell><Typography fontSize={11} color={a.lastLogin?"text.primary":"text.secondary"}>{a.lastLogin?fmtDT(a.lastLogin):"Never logged in"}</Typography></TableCell>
                            <TableCell>
                              <Box sx={{display:"inline-flex",px:"8px",py:"3px",borderRadius:"6px",fontSize:"11px",fontWeight:700,bgcolor:a.active!==false?"#dcfce7":"#fef9c3",color:a.active!==false?"#14532d":"#713f12"}}>
                                {a.active!==false?"Active":"Inactive"}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <Tooltip title="View details"><IconButton size="small" onClick={()=>setViewDlg(a)} sx={{color:"#3b82f6"}}><VisibilityIcon fontSize="small"/></IconButton></Tooltip>
                                <Tooltip title="Reset password"><IconButton size="small" onClick={()=>{setResetDlg(a);setNewPwd("");}} sx={{color:"#d4af37"}}><LockResetIcon fontSize="small"/></IconButton></Tooltip>
                                <Tooltip title="Delete"><IconButton size="small" onClick={()=>delHost(a._id)} sx={{color:"#ef4444"}}><DeleteIcon fontSize="small"/></IconButton></Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                        {fHosts.length===0&&<TableRow><TableCell colSpan={7} align="center" sx={{py:6,color:"text.secondary"}}>{search?"No results":"No host admins yet"}</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination rowsPerPageOptions={[5,10,25]} component="div" count={fHosts.length} rowsPerPage={rpp} page={page} onPageChange={(_,p)=>setPage(p)} onRowsPerPageChange={e=>{setRpp(parseInt(e.target.value,10));setPage(0);}}/>
                </>
              )}
            </Box>
          </TP>

          {/* ── SECURITY ── */}
          <TP value={tab} index={1}>
            <Box sx={{p:3}}>
              <Stack direction={{xs:"column",md:"row"}} spacing={2} alignItems={{md:"center"}} mb={3}>
                <TextField size="small" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} sx={{flex:1,maxWidth:380}} InputProps={{startAdornment:<InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>}}/>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={()=>setSecDlg(true)} sx={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontWeight:700,ml:{md:"auto"}}}>Add Security</Button>
              </Stack>
              {loading?<Box textAlign="center" py={6}><CircularProgress/></Box>:(
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{bgcolor:"#f8fafc"}}>
                        {["Personnel","Badge","Shift","Email","Gate","Actions"].map(h=><TableCell key={h} align={h==="Actions"?"right":undefined} sx={{fontWeight:700,fontSize:12}}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fSec.slice(page*rpp,page*rpp+rpp).map(s=>(
                        <TableRow key={s._id} sx={{"&:hover":{bgcolor:"#f9fafb"}}}>
                          <TableCell><Stack direction="row" spacing={1.5} alignItems="center"><Avatar sx={{width:32,height:32,background:"linear-gradient(135deg,#7c3aed,#ec4899)",fontSize:13}}>{s.name?.[0]?.toUpperCase()}</Avatar><Typography fontSize={13} fontWeight={600}>{s.name}</Typography></Stack></TableCell>
                          <TableCell><Chip label={s.badge||"—"} variant="outlined" size="small"/></TableCell>
                          <TableCell><Chip label={s.shift||"DAY"} size="small" sx={{bgcolor:s.shift==="NIGHT"?"#1e293b":"#fef9c3",color:s.shift==="NIGHT"?"#fff":"#713f12",fontWeight:700,fontSize:11}}/></TableCell>
                          <TableCell><Typography fontSize={12}>{s.email}</Typography></TableCell>
                          <TableCell><Typography fontSize={12}>{s.gateId||"—"}</Typography></TableCell>
                          <TableCell align="right"><Tooltip title="Delete"><IconButton size="small" onClick={()=>delSec(s._id)} sx={{color:"#ef4444"}}><DeleteIcon fontSize="small"/></IconButton></Tooltip></TableCell>
                        </TableRow>
                      ))}
                      {fSec.length===0&&<TableRow><TableCell colSpan={6} align="center" sx={{py:6,color:"text.secondary"}}>No security personnel found</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TP>

          {/* ── VISITORS ── */}
          <TP value={tab} index={2}>
            <Box sx={{p:3}}>
              <Stack direction={{xs:"column",md:"row"}} spacing={2} mb={3} flexWrap="wrap" alignItems={{md:"center"}}>
                <TextField size="small" placeholder="Search visitor, host, email…" value={search} onChange={e=>setSearch(e.target.value)} sx={{minWidth:200}} InputProps={{startAdornment:<InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>}}/>
                <TextField select size="small" label="Status" value={statusF} onChange={e=>setStatusF(e.target.value)} sx={{minWidth:130}}>
                  {["all","PENDING","APPROVED","IN","OVERSTAY","OUT","REJECTED"].map(s=><MenuItem key={s} value={s}>{s==="all"?"All Status":s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Date" value={dateRange} onChange={e=>{setDateRange(e.target.value);setPage(0);}} sx={{minWidth:140}}>
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </TextField>
                {dateRange==="custom"&&<>
                  <TextField size="small" type="date" label="From" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} InputLabelProps={{shrink:true}} sx={{minWidth:150}}/>
                  <TextField size="small" type="date" label="To" value={customTo} onChange={e=>setCustomTo(e.target.value)} InputLabelProps={{shrink:true}} sx={{minWidth:150}}/>
                </>}
                <Stack direction="row" spacing={1} sx={{ml:{md:"auto"}}}>
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon/>} onClick={expVisCSV}>CSV</Button>
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon/>} onClick={expVisXLSX} sx={{color:"#166534",borderColor:"#166534"}}>Excel</Button>
                </Stack>
              </Stack>
              <Typography fontSize={12} color="text.secondary" mb={2}>Showing {fVis.length} of {vis.length} visitors</Typography>
              {loading?<Box textAlign="center" py={6}><CircularProgress/></Box>:(
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{bgcolor:"#f8fafc"}}>
                          {["Visitor","Host","Gate","Status","Booked","Check-in","Check-out","Duration"].map(h=><TableCell key={h} sx={{fontWeight:700,fontSize:12}}>{h}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fVis.slice(page*rpp,page*rpp+rpp).map(v=>(
                          <TableRow key={v._id} sx={{bgcolor:v.status==="OVERSTAY"?"#fef2f2":"transparent","&:hover":{bgcolor:v.status==="OVERSTAY"?"#fee2e2":"#f9fafb"}}}>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{width:28,height:28,bgcolor:"#dbeafe",color:"#1e40af",fontSize:11,fontWeight:700}}>{v.name?.[0]?.toUpperCase()}</Avatar>
                                <Box><Typography fontSize={13} fontWeight={600}>{v.name}</Typography><Typography fontSize={11} color="text.secondary">{v.phone||v.email}</Typography></Box>
                              </Stack>
                            </TableCell>
                            <TableCell><Typography fontSize={12}>{v.host||"—"}</Typography></TableCell>
                            <TableCell><Typography fontSize={12}>{v.gate||"—"}</Typography></TableCell>
                            <TableCell><SBadge status={v.status}/></TableCell>
                            <TableCell><Typography fontSize={11}>{fmt(v.createdAt)}</Typography></TableCell>
                            <TableCell><Typography fontSize={11}>{v.checkInTime?fmtDT(v.checkInTime):"—"}</Typography></TableCell>
                            <TableCell><Typography fontSize={11}>{v.checkOutTime?fmtDT(v.checkOutTime):"—"}</Typography></TableCell>
                            <TableCell><Typography fontSize={11}>{v.actualDuration?`${v.actualDuration} min`:"—"}</Typography></TableCell>
                          </TableRow>
                        ))}
                        {fVis.length===0&&<TableRow><TableCell colSpan={8} align="center" sx={{py:6,color:"text.secondary"}}>No visitors match the current filters</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination rowsPerPageOptions={[10,25,50,100]} component="div" count={fVis.length} rowsPerPage={rpp} page={page} onPageChange={(_,p)=>setPage(p)} onRowsPerPageChange={e=>{setRpp(parseInt(e.target.value,10));setPage(0);}}/>
                </>
              )}
            </Box>
          </TP>

          {/* ── ANALYTICS ── */}
          <TP value={tab} index={3}>
            <Box sx={{p:3}}>
              {loading?<Box textAlign="center" py={6}><CircularProgress sx={{color:"#d4af37"}}/></Box>:<Charts visitors={vis}/>}
            </Box>
          </TP>

          {/* ── ACTIVITY LOG ── */}
          <TP value={tab} index={4}>
            <ActivityLog visitors={vis} hostAdmins={hosts}/>
          </TP>
        </Paper>
      </Container>

      {/* ── CREATE HOST DIALOG ── */}
      <Dialog open={hostDlg} onClose={()=>{setHostDlg(false);setErr("");setEmailErr(false);}} maxWidth="sm" fullWidth>
        <DialogTitle sx={{background:"linear-gradient(135deg,#d4af37,#fbbf24)",color:"#0f172a",fontWeight:700}}>Create Host Admin</DialogTitle>
        <DialogContent sx={{pt:3}}>
          <Stack spacing={2} sx={{mt:1}}>
            <TextField label="Full Name *" fullWidth size="small" value={hostForm.name} onChange={e=>setHostForm({...hostForm,name:e.target.value})}/>
            <TextField label="Email *" fullWidth size="small" value={hostForm.email} error={emailErr} helperText={emailErr?"Email already registered":""} onChange={e=>{setHostForm({...hostForm,email:e.target.value});setEmailErr(false);setErr("");}}/>
            <TextField label="Phone *" fullWidth size="small" value={hostForm.phone} onChange={e=>setHostForm({...hostForm,phone:e.target.value})}/>
            <TextField label="Company / Institution *" fullWidth size="small" value={hostForm.company} onChange={e=>setHostForm({...hostForm,company:e.target.value})}/>
            <TextField select label="Department" fullWidth size="small" value={hostForm.department} onChange={e=>setHostForm({...hostForm,department:e.target.value})}>
              <MenuItem value="">— Select —</MenuItem>
              {depts.map(d=><MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>)}
            </TextField>
            <TextField label="Login Password" fullWidth size="small" value={hostForm.password} placeholder="Leave blank to auto-generate" onChange={e=>setHostForm({...hostForm,password:e.target.value})} helperText="Shown once after creation so you can share it."/>
          </Stack>
        </DialogContent>
        <DialogActions sx={{p:2}}>
          <Button onClick={()=>{setHostDlg(false);setErr("");setEmailErr(false);}}>Cancel</Button>
          <span><Button variant="contained" onClick={createHost} disabled={loading} sx={{background:"linear-gradient(135deg,#d4af37,#fbbf24)",color:"#0f172a",fontWeight:700}}>
            {loading?<><CircularProgress size={15} sx={{mr:1,color:"#0f172a"}}/>Creating…</>:"Create Host Admin"}
          </Button></span>
        </DialogActions>
      </Dialog>

      {/* ── RESET PASSWORD DIALOG ── */}
      <Dialog open={!!resetDlg} onClose={()=>{setResetDlg(null);setNewPwd("");}} maxWidth="xs" fullWidth>
        <DialogTitle sx={{fontWeight:700}}>Reset Password — {resetDlg?.name}</DialogTitle>
        <DialogContent sx={{pt:2}}>
          <Typography fontSize={13} color="text.secondary" mb={2}>Set new password for <strong>{resetDlg?.email}</strong>. Share it directly with them.</Typography>
          <Stack spacing={2}>
            <TextField label="New Password *" fullWidth size="small" value={newPwd} onChange={e=>setNewPwd(e.target.value)} helperText="Minimum 6 characters"/>
            <Button size="small" variant="text" onClick={()=>setNewPwd(pwd())} sx={{alignSelf:"flex-start"}}>Generate random password</Button>
            {newPwd&&(
              <Stack direction="row" alignItems="center" spacing={1}>
                <code style={{background:"#f0fdf4",padding:"4px 10px",borderRadius:4,fontFamily:"monospace",fontSize:13}}>{newPwd}</code>
                <Tooltip title="Copy"><IconButton size="small" onClick={()=>{navigator.clipboard.writeText(newPwd);setOk("Copied!");}}><ContentCopyIcon fontSize="small"/></IconButton></Tooltip>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{p:2}}>
          <Button onClick={()=>{setResetDlg(null);setNewPwd("");}}>Cancel</Button>
          <Button variant="contained" onClick={resetPwd} disabled={resetLoading||!newPwd||newPwd.length<6} sx={{bgcolor:"#d4af37",color:"#0f172a",fontWeight:700,"&:hover":{bgcolor:"#b8962e"}}}>
            {resetLoading?<CircularProgress size={16} sx={{color:"#0f172a"}}/>:"Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── VIEW HOST DIALOG ── */}
      <Dialog open={!!viewDlg} onClose={()=>setViewDlg(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{fontWeight:700,borderBottom:"1px solid #e5e7eb"}}>Host Admin Details</DialogTitle>
        <DialogContent sx={{pt:3}}>
          {viewDlg&&(
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Avatar sx={{width:48,height:48,background:"linear-gradient(135deg,#d4af37,#7c3aed)",fontSize:18,fontWeight:700}}>{viewDlg.name?.[0]?.toUpperCase()}</Avatar>
                <Box><Typography fontWeight={700} fontSize={15}>{viewDlg.name}</Typography><Typography fontSize={13} color="text.secondary">{viewDlg.email}</Typography></Box>
              </Stack>
              <Divider/>
              {[["Phone",viewDlg.phone],["Company",viewDlg.company],["Department",viewDlg.department],["Role",viewDlg.role],["Status",viewDlg.active!==false?"Active":"Inactive"],["Last Login",fmtDT(viewDlg.lastLogin)],["Created",fmt(viewDlg.createdAt)],["Total Visitors",hostVisCount[String(viewDlg._id)]||0]].map(([l,v])=>(
                <Stack key={l} direction="row" justifyContent="space-between">
                  <Typography fontSize={13} color="text.secondary">{l}</Typography>
                  <Typography fontSize={13} fontWeight={600}>{v||"—"}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{p:2}}><Button onClick={()=>setViewDlg(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* ── CREATE SECURITY DIALOG ── */}
      <Dialog open={secDlg} onClose={()=>{setSecDlg(false);setErr("");}} maxWidth="sm" fullWidth>
        <DialogTitle sx={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontWeight:700}}>Add Security Personnel</DialogTitle>
        <DialogContent sx={{pt:3}}>
          <Stack spacing={2} sx={{mt:1}}>
            <TextField label="Name *" fullWidth size="small" value={secForm.name} onChange={e=>setSecForm({...secForm,name:e.target.value})}/>
            <TextField label="Email *" fullWidth size="small" value={secForm.email} onChange={e=>setSecForm({...secForm,email:e.target.value})}/>
            <TextField label="Phone" fullWidth size="small" value={secForm.phone} onChange={e=>setSecForm({...secForm,phone:e.target.value})}/>
            <TextField label="Badge ID" fullWidth size="small" value={secForm.badge} onChange={e=>setSecForm({...secForm,badge:e.target.value})}/>
            <TextField select label="Shift" fullWidth size="small" value={secForm.shift} onChange={e=>setSecForm({...secForm,shift:e.target.value})}>
              <MenuItem value="DAY">Day</MenuItem><MenuItem value="NIGHT">Night</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{p:2}}>
          <Button onClick={()=>{setSecDlg(false);setErr("");}}>Cancel</Button>
          <span><Button variant="contained" onClick={createSec} disabled={loading} sx={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontWeight:700}}>
            {loading?<><CircularProgress size={15} sx={{mr:1,color:"#fff"}}/>Adding…</>:"Add Security"}
          </Button></span>
        </DialogActions>
      </Dialog>
    </Box>
  );
}