import React, { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const authH = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const fmt = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

const NAV = [
  { id: "overview",  icon: "📊", label: "Dashboard",      section: "Overview"   },
  { id: "hospitals", icon: "🏨", label: "Hospitals",       section: "Management" },
  { id: "users",     icon: "👥", label: "Users",           section: "Management" },
  { id: "orders",    icon: "💊", label: "Medicine Orders", section: "Management" },
  { id: "feedback",  icon: "💬", label: "Feedback",        section: "Management" },
  { id: "activity",  icon: "📋", label: "Activity Log",    section: "System"     },
];

const STATUS_OPTIONS = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];

/* ── StatusBadge */
const StatusBadge = ({ status }) => {
  const cls = { Placed:"by", Processing:"bp", Shipped:"bb", Delivered:"bg", Cancelled:"br" };
  return <span className={`adm-bdg ${cls[status] || "bgr"}`}>{status}</span>;
};

/* ADMIN DASHBOARD */
const AdminDashboard = () => {
  const [activePage,    setActivePage]    = useState("overview");
  const [hospitals,     setHospitals]     = useState([]);
  const [users,         setUsers]         = useState([]);
  const [feedbacks,     setFeedbacks]     = useState([]);
  const [activity,      setActivity]      = useState([]);
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toastMsg,      setToastMsg]      = useState(null);

  // Hospital controls
  const [hSearch, setHSearch] = useState("");
  const [hFilter, setHFilter] = useState("all");
  // User controls
  const [uSearch, setUSearch] = useState("");
  // Feedback controls
  const [fbFilter, setFbFilter] = useState("all");
  const [fbSearch, setFbSearch] = useState("");
  const [activeFb, setActiveFb] = useState(null);
  const [replyText, setReplyText] = useState("");
  // Order controls
  const [ordSearch, setOrdSearch] = useState("all");
  const [ordFilter, setOrdFilter] = useState("all");
  const [activeOrder, setActiveOrder] = useState(null);
  const [ordStatusSel, setOrdStatusSel] = useState("Placed");

  const showToast = (msg, type = "i") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3200);
  };

  const apiFetch = async (path, opts = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...opts, headers: { ...authH(), ...(opts.headers || {}) },
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.message || d.msg || `${res.status}`);
    return d;
  };

  /* ── fetchers ──────────────────────────────────────────────────────────── */
  const fetchHospitals = useCallback(async () => {
    try { setHospitals(await apiFetch("/api/admin/hospitals")); }
    catch (e) { showToast(e.message, "e"); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try { setUsers(await apiFetch("/api/admin/users")); }
    catch (e) { console.warn(e.message); }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try { setFeedbacks(await apiFetch("/api/admin/feedback")); }
    catch (e) { console.warn(e.message); }
  }, []);

  const fetchActivity = useCallback(async () => {
    try { setActivity(await apiFetch("/api/admin/activity")); }
    catch (e) { console.warn(e.message); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try { setOrders(await apiFetch("/api/admin/orders")); }
    catch (e) { console.warn(e.message); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([fetchHospitals(), fetchUsers(), fetchFeedbacks(), fetchActivity(), fetchOrders()])
      .finally(() => setLoading(false));
  }, [fetchHospitals, fetchUsers, fetchFeedbacks, fetchActivity, fetchOrders]);

  /* ── actions ───────────────────────────────────────────────────────────── */
  const updateHospital = async (id, accepted) => {
    setActionLoading(id);
    try {
      await apiFetch(`/api/admin/hospitals/${id}`, { method: "PUT", body: JSON.stringify({ accepted }) });
      showToast(accepted ? "✅ Hospital approved" : "⚠️ Revoked", accepted ? "s" : "i");
      await fetchHospitals();
    } catch (e) { showToast(e.message, "e"); }
    finally { setActionLoading(null); }
  };

  const deleteHospital = async (id) => {
    if (!window.confirm("Remove this hospital permanently?")) return;
    try {
      await apiFetch(`/api/admin/hospitals/${id}`, { method: "DELETE" });
      showToast("Hospital removed", "i");
      await fetchHospitals();
    } catch (e) { showToast(e.message, "e"); }
  };

  const sendFbReply = async () => {
    if (!replyText.trim()) { showToast("Type a reply first", "e"); return; }
    try {
      await apiFetch(`/api/admin/feedback/${activeFb._id}`, {
        method: "PUT", body: JSON.stringify({ status: "replied", adminReply: replyText }),
      });
      showToast("Reply sent ✉️", "s");
      setActiveFb(null); setReplyText("");
      await fetchFeedbacks();
    } catch (e) { showToast(e.message, "e"); }
  };

  const markFbRead = async (id) => {
    try {
      await apiFetch(`/api/admin/feedback/${id}`, { method: "PUT", body: JSON.stringify({ status: "read" }) });
      await fetchFeedbacks();
    } catch { /* silent */ }
  };

  const deleteFb = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await apiFetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      showToast("Deleted", "i"); setActiveFb(null);
      await fetchFeedbacks();
    } catch (e) { showToast(e.message, "e"); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      const updated = await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH", body: JSON.stringify({ orderStatus: newStatus }),
      });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, orderStatus: updated.orderStatus } : o));
      if (activeOrder?._id === orderId) setActiveOrder((p) => ({ ...p, orderStatus: updated.orderStatus }));
      showToast({ Placed:"📦 Placed", Processing:"⚙️ Processing", Shipped:"🚚 Shipped!", Delivered:"✅ Delivered!", Cancelled:"❌ Cancelled" }[newStatus] || "Updated", "s");
    } catch (e) { showToast(e.message, "e"); }
    finally { setActionLoading(null); }
  };

  /* ── derived ───────────────────────────────────────────────────────────── */
  const hospPend  = hospitals.filter((h) => !h.accepted).length;
  const fbUnread  = feedbacks.filter((f) => f.status === "unread").length;
  const ordPlaced = orders.filter((o) => o.orderStatus === "Placed").length;

  const filtH = hospitals.filter((h) => {
    const m = hFilter === "all" || (hFilter === "approved" && h.accepted) || (hFilter === "pending" && !h.accepted);
    const q = (h.hospitalName + h.email + (h.city || "") + (h.adminName || "")).toLowerCase().includes(hSearch.toLowerCase());
    return m && q;
  });
  const filtU = users.filter((u) =>
    (u.name + u.email + (u.phone || "")).toLowerCase().includes(uSearch.toLowerCase())
  );
  const filtFB = feedbacks.filter((f) => {
    const m = fbFilter === "all" || f.status === fbFilter;
    const q = (f.name + f.email + f.message).toLowerCase().includes(fbSearch.toLowerCase());
    return m && q;
  });
  const filtOrd = orders.filter((o) => {
    const m = ordFilter === "all" || o.orderStatus === ordFilter;
    const u = o.user || {};
    const items = (o.items || []).map((i) => i.name).join(" ");
    const q = (u.name + u.email + (u.phone || "") + items).toLowerCase().includes(
      ordSearch === "all" ? "" : ordSearch.toLowerCase()
    );
    return m && q;
  });

  const badges = { hospitals: hospPend, feedback: fbUnread, orders: ordPlaced };

  /* RENDER */
  return (
    <div className="adm-root">

      {/* ── SIDEBAR */}
      <aside className="adm-sb">
        <div className="adm-sbl">
          <div className="adm-sbli">🏥</div>
          <div className="adm-sblt">Medi<em>Care</em><span className="adm-atag">ADMIN</span></div>
        </div>
        <nav className="adm-sbn">
          {["Overview","Management","System"].map((section) => (
            <React.Fragment key={section}>
              <div className="adm-sbsc">{section}</div>
              {NAV.filter((n) => n.section === section).map((n) => (
                <div key={n.id} className={`adm-ni${activePage === n.id ? " active" : ""}`}
                  onClick={() => setActivePage(n.id)}>
                  <span className="adm-ic">{n.icon}</span>{n.label}
                  {(badges[n.id] > 0) && (
                    <span className={`adm-nbdg${n.id === "orders" ? " g" : n.id === "feedback" ? "" : " y"}`}>
                      {badges[n.id]}
                    </span>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </nav>
        <div className="adm-sbf">
          <div className="adm-abr">
            <div className="adm-av">SA</div>
            <div className="adm-inf">
              <div className="adm-nm">Super Admin</div>
              <div className="adm-rl">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="adm-main">
        {/* Topbar */}
        <div className="adm-tb">
          <div className="adm-tbt">
            {{ overview:"Dashboard", hospitals:"Hospital Management", users:"User Management",
               orders:"Medicine Orders", feedback:"Feedback", activity:"Activity Log" }[activePage]}
          </div>
          <div className="adm-tbd" />
          <button className="adm-tbr" onClick={() => {
            setLoading(true);
            Promise.allSettled([fetchHospitals(),fetchUsers(),fetchFeedbacks(),fetchActivity(),fetchOrders()]).finally(()=>setLoading(false));
          }}>↻ Refresh</button>
          <div className="adm-tbm">{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</div>
        </div>

        {/* Page area */}
        <div className="adm-pg">
          {loading && <div className="adm-lds"><div className="adm-spin"/><span>Loading dashboard…</span></div>}

          {/* ═══ OVERVIEW ═══ */}
          {!loading && activePage === "overview" && (<>
            <div className="adm-sg">
              <div className="adm-sc b"><div className="adm-ico">🏨</div><div className="adm-val">{hospitals.length}</div><div className="adm-lbl">Hospitals</div><div className="adm-chg up">{hospPend} pending</div></div>
              <div className="adm-sc y"><div className="adm-ico">👥</div><div className="adm-val">{users.filter(u=>u.role==="user").length}</div><div className="adm-lbl">Users</div><div className="adm-chg up">Registered</div></div>
              <div className="adm-sc g"><div className="adm-ico">📦</div><div className="adm-val">{orders.length}</div><div className="adm-lbl">Orders</div><div className="adm-chg up">{orders.filter(o=>o.orderStatus==="Delivered").length} delivered</div></div>
              <div className="adm-sc p"><div className="adm-ico">💬</div><div className="adm-val">{feedbacks.length}</div><div className="adm-lbl">Feedback</div><div className="adm-chg wa">{fbUnread} unread</div></div>
            </div>
            <div className="adm-sg" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
              <div className="adm-sc y"><div className="adm-ico">🕐</div><div className="adm-val">{ordPlaced}</div><div className="adm-lbl">Placed</div></div>
              <div className="adm-sc b"><div className="adm-ico">🚚</div><div className="adm-val">{orders.filter(o=>o.orderStatus==="Shipped").length}</div><div className="adm-lbl">Shipped</div></div>
              <div className="adm-sc g"><div className="adm-ico">✅</div><div className="adm-val">{orders.filter(o=>o.orderStatus==="Delivered").length}</div><div className="adm-lbl">Delivered</div></div>
            </div>
            <div className="adm-grid2">
              <div className="adm-card">
                <div className="adm-ch"><div className="adm-ct">🏥 Pending Hospitals</div><button className="adm-btn bgh bsm" onClick={()=>setActivePage("hospitals")}>View All</button></div>
                {hospitals.filter(h=>!h.accepted).length === 0
                  ? <div className="adm-empty"><div className="adm-ico">🏥</div><p>No pending hospitals</p></div>
                  : hospitals.filter(h=>!h.accepted).slice(0,5).map(h=>(
                    <div key={h._id} className="adm-ov-row">
                      <div className="adm-tpico-b" style={{fontSize:16}}>🏨</div>
                      <div style={{flex:1}}><div className="adm-tdm">{h.hospitalName}</div><div className="adm-sub">{h.city} · {h.adminName}</div></div>
                      <button className="adm-btn bap bsm" onClick={()=>updateHospital(h._id,true)} disabled={actionLoading===h._id}>✔ Approve</button>
                    </div>
                  ))
                }
              </div>
              <div className="adm-card">
                <div className="adm-ch"><div className="adm-ct">💊 Recent Orders</div><button className="adm-btn bgh bsm" onClick={()=>setActivePage("orders")}>View All</button></div>
                {orders.length === 0
                  ? <div className="adm-empty"><div className="adm-ico">📦</div><p>No orders yet</p></div>
                  : orders.slice(0,5).map(o=>(
                    <div key={o._id} className="adm-ov-row">
                      <div className="adm-tpico-g" style={{fontSize:16}}>💊</div>
                      <div style={{flex:1}}><div className="adm-tdm">#{o._id.slice(-6).toUpperCase()} · {o.user?.name||"—"}</div><div className="adm-sub">₹{o.totalAmount} · {o.items?.length} item(s)</div></div>
                      <StatusBadge status={o.orderStatus}/>
                    </div>
                  ))
                }
              </div>
            </div>
          </>)}

          {/* ═══ HOSPITALS ═══ */}
          {!loading && activePage === "hospitals" && (
            <div className="adm-card">
              <div className="adm-ch">
                <div className="adm-ct">🏨 Hospital Management</div>
                <div className="adm-ca"><span className="adm-count">{hospitals.length} total · {hospPend} pending</span><button className="adm-btn bgh bsm" onClick={fetchHospitals}>↻ Refresh</button></div>
              </div>
              <div className="adm-fbar">
                <input className="adm-fi" placeholder="Search hospital, city, admin…" value={hSearch} onChange={e=>setHSearch(e.target.value)}/>
                {[["all","All"],["pending","Pending"],["approved","Approved"]].map(([v,l])=>(
                  <button key={v} className={`adm-fb${hFilter===v?" active":""}`} onClick={()=>setHFilter(v)}>{l}</button>
                ))}
              </div>
              <div className="adm-tw"><table>
                <thead><tr><th>Hospital</th><th>Location</th><th>Admin</th><th>Doctors</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtH.length===0
                    ? <tr><td colSpan="7"><div className="adm-empty"><div className="adm-ico">🏥</div><p>No hospitals found</p></div></td></tr>
                    : filtH.map(h=>(
                      <tr key={h._id}>
                        <td><div className="adm-tdm">{h.hospitalName}</div><div className="adm-sub">{h.email}</div></td>
                        <td>{h.city}, {h.state}</td>
                        <td>{h.adminName}</td>
                        <td>{(h.doctors||[]).length}</td>
                        <td className="adm-sub">{fmt(h.createdAt)}</td>
                        <td>{h.accepted?<span className="adm-bdg bg">Approved</span>:<span className="adm-bdg by">Pending</span>}</td>
                        <td><div className="adm-ag">
                          {!h.accepted&&<button className="adm-btn bap bsm" disabled={actionLoading===h._id} onClick={()=>updateHospital(h._id,true)}>✔ Approve</button>}
                          {h.accepted&&<button className="adm-btn brj bsm" disabled={actionLoading===h._id} onClick={()=>updateHospital(h._id,false)}>Revoke</button>}
                          <button className="adm-btn bdl bsm" onClick={()=>deleteHospital(h._id)}>🗑</button>
                        </div></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table></div>
            </div>
          )}

          {/* ═══ USERS ═══ */}
          {!loading && activePage === "users" && (
            <div className="adm-card">
              <div className="adm-ch">
                <div className="adm-ct">👥 Registered Users</div>
                <div className="adm-ca"><span className="adm-count">{users.length} total</span><button className="adm-btn bgh bsm" onClick={fetchUsers}>↻ Refresh</button></div>
              </div>
              <div className="adm-fbar">
                <input className="adm-fi" placeholder="Search name, email, phone…" value={uSearch} onChange={e=>setUSearch(e.target.value)}/>
              </div>
              <div className="adm-tw"><table>
                <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Blood Group</th><th>Gender</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>
                  {filtU.length===0
                    ? <tr><td colSpan="7"><div className="adm-empty"><div className="adm-ico">👥</div><p>No users found</p></div></td></tr>
                    : filtU.map(u=>(
                      <tr key={u._id}>
                        <td><div style={{display:"flex",alignItems:"center"}}><span className="adm-uav">{(u.name||"?")[0].toUpperCase()}</span><span className="adm-tdm">{u.name}</span></div></td>
                        <td className="adm-sub">{u.email}</td>
                        <td>{u.phone||"—"}</td>
                        <td>{u.bloodGroup&&u.bloodGroup!=="Unknown"?<span className="adm-bdg br">{u.bloodGroup}</span>:<span className="adm-mu">—</span>}</td>
                        <td>{u.gender||"—"}</td>
                        <td><span className={`adm-bdg ${u.role==="super_admin"?"bb":u.role==="admin"?"bp":"bgr"}`}>{u.role}</span></td>
                        <td className="adm-sub">{fmt(u.createdAt)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table></div>
            </div>
          )}

          {/* ═══ ORDERS ═══ */}
          {!loading && activePage === "orders" && (<>
            <div className="adm-sg" style={{gridTemplateColumns:"repeat(4,1fr)",marginBottom:20}}>
              <div className="adm-sc b"><div className="adm-ico">📦</div><div className="adm-val">{orders.length}</div><div className="adm-lbl">Total Orders</div></div>
              <div className="adm-sc y"><div className="adm-ico">🕐</div><div className="adm-val">{ordPlaced}</div><div className="adm-lbl">Placed</div></div>
              <div className="adm-sc p"><div className="adm-ico">🚚</div><div className="adm-val">{orders.filter(o=>o.orderStatus==="Shipped").length}</div><div className="adm-lbl">Shipped</div></div>
              <div className="adm-sc g"><div className="adm-ico">✅</div><div className="adm-val">{orders.filter(o=>o.orderStatus==="Delivered").length}</div><div className="adm-lbl">Delivered</div></div>
            </div>
            <div className="adm-card">
              <div className="adm-ch">
                <div className="adm-ct">💊 Medicine Orders</div>
                <div className="adm-ca"><span className="adm-count">{filtOrd.length} shown</span><button className="adm-btn bgh bsm" onClick={fetchOrders}>↻ Refresh</button></div>
              </div>
              <div className="adm-fbar">
                <input className="adm-fi" placeholder="Search patient, medicine, email…" value={ordSearch==="all"?"":ordSearch} onChange={e=>setOrdSearch(e.target.value||"all")}/>
                {[["all","All"],["Placed","Placed"],["Processing","Processing"],["Shipped","Shipped"],["Delivered","Delivered"],["Cancelled","Cancelled"]].map(([v,l])=>(
                  <button key={v} className={`adm-fb${v==="Delivered"?" g":v==="Cancelled"?" r":v==="Placed"?" y":""}${ordFilter===v?" active":""}`} onClick={()=>setOrdFilter(v)}>{l}</button>
                ))}
              </div>
              <div className="adm-tw"><table>
                <thead><tr><th>Order ID</th><th>Patient</th><th>Items</th><th>Total</th><th>Payment</th><th>Address</th><th>Ordered On</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtOrd.length===0
                    ? <tr><td colSpan="9"><div className="adm-empty"><div className="adm-ico">💊</div><p>No orders found</p></div></td></tr>
                    : filtOrd.map(o=>{
                        const u=o.user||{};
                        const addr=o.address
                          ? typeof o.address==="string" ? o.address
                            : `${o.address.city||""}${o.address.state?", "+o.address.state:""}`
                          : "—";
                        return (
                          <tr key={o._id}>
                            <td><span className="adm-tdm">#{o._id.slice(-6).toUpperCase()}</span></td>
                            <td><div className="adm-tdm">{u.name||"—"}</div><div className="adm-sub">{u.email}</div><div className="adm-sub">{u.phone||""}</div></td>
                            <td>{(o.items||[]).map((item,i)=><div key={i} className="adm-item-mini">{item.name} <span className="adm-ac">×{item.quantity}</span></div>)}</td>
                            <td className="adm-tdm">₹{o.totalAmount}</td>
                            <td><span className={`adm-bdg ${o.paymentStatus==="Paid"?"bg":"by"}`}>{o.paymentStatus||"Pending"}</span><div className="adm-sub" style={{marginTop:3}}>{o.paymentMethod||""}</div></td>
                            <td className="adm-sub">{addr}</td>
                            <td className="adm-sub">{fmt(o.createdAt)}</td>
                            <td><StatusBadge status={o.orderStatus}/></td>
                            <td><button className="adm-btn bgh bsm" onClick={()=>{setActiveOrder(o);setOrdStatusSel(o.orderStatus);}}>View & Update</button></td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table></div>
            </div>
          </>)}

          {/* ═══ FEEDBACK ═══ */}
          {!loading && activePage === "feedback" && (
            <div className="adm-card">
              <div className="adm-ch">
                <div className="adm-ct">💬 Feedback</div>
                <div className="adm-ca"><span className="adm-count">{feedbacks.length} total · {fbUnread} unread</span><button className="adm-btn bgh bsm" onClick={fetchFeedbacks}>↻ Refresh</button></div>
              </div>
              <div className="adm-fbar">
                <input className="adm-fi" placeholder="Search feedback…" value={fbSearch} onChange={e=>setFbSearch(e.target.value)}/>
                {[["all","All"],["unread","Unread"],["read","Read"],["replied","Replied"]].map(([v,l])=>(
                  <button key={v} className={`adm-fb${fbFilter===v?" active":""}`} onClick={()=>setFbFilter(v)}>{l}</button>
                ))}
              </div>
              <div className="adm-tw"><table>
                <thead><tr><th>From</th><th>Category</th><th>Rating</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtFB.length===0
                    ? <tr><td colSpan="7"><div className="adm-empty"><div className="adm-ico">💬</div><p>No feedback found</p></div></td></tr>
                    : filtFB.map(f=>(
                      <tr key={f._id}>
                        <td><div className="adm-tdm">{f.name}</div><div className="adm-sub">{f.email}</div></td>
                        <td style={{textTransform:"capitalize"}}>{f.category||"general"}</td>
                        <td><span className="adm-stars">{"★".repeat(f.rating||0)}{"☆".repeat(5-(f.rating||0))}</span></td>
                        <td style={{maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.message}</td>
                        <td className="adm-sub">{fmt(f.createdAt)}</td>
                        <td><span className={`adm-bdg ${f.status==="unread"?"br":f.status==="replied"?"bg":"bgr"}`}>{f.status}</span></td>
                        <td><div className="adm-ag">
                          <button className="adm-btn bgh bsm" onClick={()=>{setActiveFb(f);setReplyText("");if(f.status==="unread")markFbRead(f._id);}}>Reply</button>
                          <button className="adm-btn bdl bsm" onClick={()=>deleteFb(f._id)}>Delete</button>
                        </div></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table></div>
            </div>
          )}

          {/* ═══ ACTIVITY ═══ */}
          {!loading && activePage === "activity" && (
            <div className="adm-card">
              <div className="adm-ch"><div className="adm-ct">📋 Activity Log</div><button className="adm-btn bgh bsm" onClick={fetchActivity}>↻ Refresh</button></div>
              <div style={{padding:"4px 20px 20px"}}>
                {activity.length===0
                  ? <div className="adm-empty"><div className="adm-ico">📋</div><p>No activity yet</p></div>
                  : activity.map((a,i)=>(
                    <div key={i} className="adm-act-row">
                      <div className={`adm-act-dot ${a.status==="Approved"?"green":"yellow"}`}/>
                      <div>
                        <div className="adm-tdm">{a.hospitalName}<span className={`adm-bdg ${a.status==="Approved"?"bg":"by"}`} style={{marginLeft:8}}>{a.status}</span></div>
                        <div className="adm-sub">{a.city} · Admin: {a.adminName} · {fmt(a.updatedAt)}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

        </div>{/* /adm-pg */}
      </div>{/* /adm-main */}

      {/* ── ORDER MODAL */}
      {activeOrder && (
        <div className="adm-mov" onClick={e=>{if(e.target===e.currentTarget)setActiveOrder(null);}}>
          <div className="adm-modal" style={{maxWidth:640}}>
            <div className="adm-mh">
              <div>
                <div className="adm-mt">Order #{activeOrder._id.slice(-6).toUpperCase()}</div>
                <div style={{marginTop:4}}>
                  <StatusBadge status={activeOrder.orderStatus}/>
                  <span className={`adm-bdg ${activeOrder.paymentStatus==="Paid"?"bg":"by"}`} style={{marginLeft:8}}>{activeOrder.paymentStatus||"Pending"}</span>
                </div>
              </div>
              <button className="adm-mcl" onClick={()=>setActiveOrder(null)}>✕</button>
            </div>
            <div className="adm-modal-grid2">
              <div className="adm-modal-box">
                <div className="adm-modal-lbl">👤 Patient</div>
                <div className="adm-tdm">{activeOrder.user?.name||"—"}</div>
                <div className="adm-sub">{activeOrder.user?.email}</div>
                <div className="adm-sub">{activeOrder.user?.phone}</div>
              </div>
              <div className="adm-modal-box">
                <div className="adm-modal-lbl">📍 Delivery Address</div>
                {activeOrder.address && typeof activeOrder.address==="object"
                  ? <div style={{fontSize:13,lineHeight:1.7}}>
                      {activeOrder.address.name}<br/>
                      {activeOrder.address.address}<br/>
                      {activeOrder.address.city}{activeOrder.address.state?", "+activeOrder.address.state:""} {activeOrder.address.pincode}<br/>
                      <span className="adm-sub">{activeOrder.address.phone}</span>
                    </div>
                  : <div className="adm-sub">{activeOrder.address||"—"}</div>
                }
              </div>
            </div>
            <div className="adm-modal-box" style={{marginBottom:14}}>
              <div className="adm-modal-lbl">💊 Items Ordered</div>
              {(activeOrder.items||[]).map((item,i)=>(
                <div key={i} className="adm-ord-item-row">
                  <div><div className="adm-tdm">{item.name}</div><div className="adm-sub">Qty: {item.quantity}</div></div>
                  <div style={{fontWeight:600,color:"var(--adm-ac)"}}>₹{(item.price*item.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="adm-ord-total-row">
                <span className="adm-sub">Total</span>
                <span style={{fontWeight:700,color:"var(--adm-ac)"}}>₹{activeOrder.totalAmount}</span>
              </div>
            </div>
            <div className="adm-modal-grid3">
              <div className="adm-modal-box"><div className="adm-modal-lbl">Payment</div><div className="adm-tdm">{activeOrder.paymentMethod||"—"}</div></div>
              <div className="adm-modal-box"><div className="adm-modal-lbl">Pay Status</div><div className="adm-tdm">{activeOrder.paymentStatus||"—"}</div></div>
              <div className="adm-modal-box"><div className="adm-modal-lbl">Ordered On</div><div className="adm-tdm">{fmt(activeOrder.createdAt)}</div></div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}>
              <select className="adm-modal-select" value={ordStatusSel} onChange={e=>setOrdStatusSel(e.target.value)} disabled={actionLoading===activeOrder._id}>
                {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <button className="adm-btn bap" disabled={actionLoading===activeOrder._id}
                onClick={()=>updateOrderStatus(activeOrder._id,ordStatusSel)}>
                {actionLoading===activeOrder._id?"Updating…":"Update Status"}
              </button>
              <button className="adm-btn bgh" onClick={()=>setActiveOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FEEDBACK MODAL */}
      {activeFb && (
        <div className="adm-mov" onClick={e=>{if(e.target===e.currentTarget)setActiveFb(null);}}>
          <div className="adm-modal">
            <div className="adm-mh"><div className="adm-mt">Feedback Detail</div><button className="adm-mcl" onClick={()=>setActiveFb(null)}>✕</button></div>
            <div className="adm-dg">
              <div className="adm-di"><label>From</label><span>{activeFb.name}</span></div>
              <div className="adm-di"><label>Email</label><span>{activeFb.email}</span></div>
              <div className="adm-di"><label>Rating</label><span className="adm-stars">{"★".repeat(activeFb.rating||0)}{"☆".repeat(5-(activeFb.rating||0))}</span></div>
              <div className="adm-di"><label>Category</label><span style={{textTransform:"capitalize"}}>{activeFb.category||"general"}</span></div>
              <div className="adm-di adm-full"><label>Message</label><div className="adm-fb-msg">{activeFb.message}</div></div>
            </div>
            {activeFb.adminReply && (
              <div className="adm-fb-prev-w">
                <div className="adm-modal-lbl" style={{color:"var(--adm-ac)"}}>Previous Reply</div>
                <div className="adm-fb-prev">{activeFb.adminReply}</div>
              </div>
            )}
            <textarea className="adm-mreply" placeholder="Type your reply…" value={replyText} onChange={e=>setReplyText(e.target.value)}/>
            <div style={{display:"flex",gap:8}}>
              <button className="adm-btn bpr" onClick={sendFbReply}>Send Reply</button>
              <button className="adm-btn bgh" onClick={()=>markFbRead(activeFb._id)}>Mark Read</button>
              <button className="adm-btn bdl" onClick={()=>deleteFb(activeFb._id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST */}
      {toastMsg && (
        <div className="adm-tc">
          <div className={`adm-toast ${toastMsg.type}`}>
            <span>{{s:"✅",e:"❌",i:"ℹ️"}[toastMsg.type]}</span> {toastMsg.msg}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;