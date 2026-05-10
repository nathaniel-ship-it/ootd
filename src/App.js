import { useState, useRef, useCallback, useEffect, memo } from "react";
import { initPurchases, purchasePro, checkProStatus, restorePurchases, isNative, manageSubscription } from "./purchases";
import PRIVACY_POLICY_HTML from "./privacyPolicy";

const OCCASIONS = ["everyday","date night","work","party","gym","travel"];
const FAKE_DOMAINS = ["test.com","fake.com","mailinator.com","guerrillamail.com","tempmail.com","throwaway.email","yopmail.com","sharklasers.com","trashmail.com","10minutemail.com","fakeinbox.com","spamgourmet.com","maildrop.cc","dispostable.com","example.com","sample.com"];

const isValidEmail = e => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "Enter a valid email address.";
  if (FAKE_DOMAINS.includes(e.split("@")[1]?.toLowerCase())) return "Please use a real email address.";
  return null;
};

const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del: k => { try { localStorage.removeItem(k); } catch {} },
};

function getWeekStart() {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay());
  return d.toISOString();
}
function normalizeEmail(email) { return (email||"").trim().toLowerCase(); }
function getUserData(email) { return store.get(`ootd_user_${normalizeEmail(email)}`) || null; }
function setUserData(email, data) { store.set(`ootd_user_${normalizeEmail(email)}`, data); }

// ── Index: lightweight hot-field key so getUsageLeft/isPro never deserialize
//    the full user object (history array + avatar base64) just for a flag check.
function getMetaData(email) {
  const meta = store.get(`ootd_meta_${email}`);
  if (meta) return meta;
  // Lazy migration: first time, seed from the full user object.
  const u = getUserData(email); if (!u) return null;
  const m = {pro:u.pro||false, uploads:u.uploads||[], weekStart:u.weekStart||getWeekStart(), totalRatings:u.totalRatings||0};
  store.set(`ootd_meta_${email}`, m); return m;
}
function setMetaData(email, meta) { store.set(`ootd_meta_${email}`, meta); }

// Accept pre-loaded data object to avoid a second localStorage read (N+1 fix).
function getUsageLeft(emailOrData) {
  const u = typeof emailOrData==="string" ? getMetaData(emailOrData) : emailOrData;
  if (!u) return 0; if (u.pro) return 999;
  const ws = getWeekStart();
  const uploads = u.weekStart===ws ? (u.uploads||[]) : [];
  return Math.max(0, 1-uploads.length);
}
function getStreak(emailOrData) {
  const u = typeof emailOrData==="string" ? getUserData(emailOrData) : emailOrData;
  if (!u) return 0;
  const history = u.history||[];
  if (!history.length) return 0;
  let streak = 1;
  const today = new Date(); today.setHours(0,0,0,0);
  const toDate = str => { try { return new Date(str+","+today.getFullYear()); } catch { return null; } };
  const firstDate = toDate(history[0]?.date);
  if (!firstDate) return 0;
  const dayDiff = Math.floor((today-firstDate)/(1000*60*60*24));
  if (dayDiff > 1) return 0;
  for (let i=1; i<history.length; i++) {
    const d = toDate(history[i]?.date);
    const prev = toDate(history[i-1]?.date);
    if (!d||!prev) break;
    if (Math.floor((prev-d)/(1000*60*60*24))===1) streak++;
    else break;
  }
  return streak;
}

function recordRating(email, rating) {
  const u = getUserData(email); if (!u) return;
  const ws = getWeekStart();
  const uploads = u.weekStart===ws ? (u.uploads||[]) : [];
  uploads.push(Date.now());
  const history = u.history || [];
  const {imageB64, ...ratingWithoutImage} = rating;
  history.unshift({...ratingWithoutImage, date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})});
  if (history.length>30) history.pop();
  const totalRatings = (u.totalRatings||0)+1;
  setUserData(email, {...u, weekStart:ws, uploads, totalRatings, history});
  // Keep index in sync
  setMetaData(email, {pro:u.pro||false, uploads, weekStart:ws, totalRatings});
}

function deleteRating(email, index) {
  const u = getUserData(email); if (!u) return;
  const history = [...(u.history||[])];
  history.splice(index, 1);
  setUserData(email, {...u, history});
}

async function createThumbnail(base64) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const MAX = 480;
      const scale = Math.min(MAX/img.width, MAX/img.height, 1);
      const w = Math.round(img.width*scale), h = Math.round(img.height*scale);
      const c = document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      resolve(c.toDataURL("image/jpeg",0.82).split(",")[1]);
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

function useAuth() {
  const [user, setUser] = useState(() => store.get("ootd_u"));
  const login = (email, password) => {
    const norm = normalizeEmail(email);
    const err = isValidEmail(norm); if (err) return err;
    const u = getUserData(norm);
    if (!u) return "No account found. Please sign up.";
    if (u.password !== password) return "Incorrect password.";
    const s = {email:norm, name:u.name}; store.set("ootd_u", s); setUser(s); return null;
  };
  const signup = (name, email, password) => {
    const norm = normalizeEmail(email);
    if (!name.trim()) return "Enter your name.";
    const err = isValidEmail(norm); if (err) return err;
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (getUserData(norm)) return "An account with this email already exists.";
    const now = new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"});
    const ok = store.set(`ootd_user_${norm}`, {name,password,uploads:[],weekStart:getWeekStart(),totalRatings:0,joinedAt:now,pro:false,avatar:null,history:[],onboarded:false});
    if(!ok) return "Couldn't save your account. Try clearing some browser storage and signing up again.";
    const s = {email:norm, name}; store.set("ootd_u", s); setUser(s); return null;
  };
  const logout = () => { store.del("ootd_u"); setUser(null); };
  const setPro = email => {
    const u=getUserData(email); if(!u) return;
    const proSince = Date.now();
    setUserData(email,{...u,pro:true,proSince});
    const m=getMetaData(email); if(m) setMetaData(email,{...m,pro:true,proSince});
  };
  const removePro = email => {
    const u=getUserData(email); if(!u) return;
    setUserData(email,{...u,pro:false});
    const m=getMetaData(email); if(m) setMetaData(email,{...m,pro:false});
  };
  const setAvatar = (email,b64) => { const u=getUserData(email); if(u) setUserData(email,{...u,avatar:b64}); };
  const setOnboarded = email => { const u=getUserData(email); if(u) setUserData(email,{...u,onboarded:true}); };
  return {user,login,signup,logout,setPro,removePro,setAvatar,setOnboarded};
}

const DARK = {
  bg:"#080808", bg2:"#111", bg3:"#1a1a1a",
  border:"rgba(255,255,255,0.1)", border2:"rgba(255,255,255,0.2)",
  text:"#fff", muted:"rgba(255,255,255,0.6)", faint:"rgba(255,255,255,0.25)",
  accent:"#a8ff78", gold:"#FFD166", red:"#e05555",
  card:"#fff", cardText:"#000",
  navBg:"rgba(8,8,8,0.97)", navBorder:"rgba(255,255,255,0.12)",
  inputBg:"#1a1a1a", inputBorder:"rgba(255,255,255,0.15)", inputText:"#fff",
  authCard:"#141414", authTab:"#1e1e1e", authTabActive:"#fff", authTabActiveText:"#000",
  pillActive:"#fff", pillActiveText:"#000", pillBg:"rgba(255,255,255,0.07)", pillBorder:"rgba(255,255,255,0.22)",
  uploadBorder:"rgba(255,255,255,0.4)", uploadBg:"rgba(255,255,255,0.02)", scoreRingBg:"#1a1a1a",
};
const LIGHT = {
  bg:"#fafaf8", bg2:"#fff", bg3:"#f2f0ec",
  border:"rgba(0,0,0,0.08)", border2:"rgba(0,0,0,0.14)",
  text:"#111", muted:"rgba(0,0,0,0.5)", faint:"rgba(0,0,0,0.28)",
  accent:"#2a7a2a", gold:"#a06800", red:"#b83030",
  card:"#111", cardText:"#fff",
  navBg:"rgba(250,250,248,0.97)", navBorder:"rgba(0,0,0,0.08)",
  inputBg:"#f2f0ec", inputBorder:"rgba(0,0,0,0.12)", inputText:"#111",
  authCard:"#fff", authTab:"#f2f0ec", authTabActive:"#111", authTabActiveText:"#fff",
  pillActive:"#111", pillActiveText:"#fff", pillBg:"rgba(0,0,0,0.04)", pillBorder:"rgba(0,0,0,0.14)",
  uploadBorder:"rgba(0,0,0,0.2)", uploadBg:"#fff", scoreRingBg:"#e8e5e0",
};
let T = LIGHT;

// ── Doodles ──
const Squiggle = ({color="#fff",width=80,style={}}) => (
  <svg width={width} height={12} viewBox={`0 0 ${width} 12`} style={{display:"block",...style}}>
    <path d={`M2,8 Q${width*.15},2 ${width*.3},8 Q${width*.45},14 ${width*.6},8 Q${width*.75},2 ${width*.9},8`}
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const Star = ({color="#fff",size=18,style={}}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display:"inline-block",...style}}>
    <path d="M12,2 L13.5,9 L20,8 L15,13 L17,20 L12,16 L7,20 L9,13 L4,8 L10.5,9 Z"
      fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);
const Arrow = ({color="#fff",style={}}) => (
  <svg width={28} height={28} viewBox="0 0 36 36" style={{display:"inline-block",...style}}>
    <path d="M6,28 Q10,10 26,10" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M22,6 L26,10 L20,13" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ZigZag = ({color="#fff",width=100,style={}}) => (
  <svg width={width} height={14} viewBox={`0 0 ${width} 14`} style={{display:"block",...style}}>
    <polyline points={Array.from({length:10},(_,i)=>`${i*(width/9)},${i%2===0?2:12}`).join(" ")}
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function scheduleNotifications(email) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notifDateKey = "ootd_notif_date";
  const lastDate = store.get(notifDateKey);
  const todayStr = new Date().toDateString();
  if (lastDate === todayStr) return;
  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const u = getUserData(email)||{};
  const ratedToday = (u.history||[]).some(h=>h.date===todayLabel);
  // 9 PM streak reminder if not yet rated
  const ninepm = new Date(); ninepm.setHours(21,0,0,0);
  if (!ratedToday && now < ninepm) {
    const ms = ninepm - now;
    setTimeout(()=>{
      const u2 = getUserData(email)||{};
      const label2 = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
      if (!(u2.history||[]).some(h=>h.date===label2) && Notification.permission==="granted") {
        new Notification("OOTD 👗",{body:"3 hours left! Rate your outfit and keep your streak alive 🔥"});
        store.set(notifDateKey, new Date().toDateString());
      }
    }, ms);
  }
  // Weekly motivational on Mon/Wed/Fri
  const dow = now.getDay();
  const msgs = [
    "What are you wearing today? Get it rated 📸",
    "Your streak is waiting — don't let it die 🔥",
    "New day, new fit. See how it scores ✦",
    "Rate your outfit and build your style profile 👗",
  ];
  if ([1,3,5].includes(dow)) {
    const noon = new Date(); noon.setHours(12,0,0,0);
    const delay = now < noon ? noon - now : 0;
    if (delay < 12*60*60*1000) {
      setTimeout(()=>{
        if (Notification.permission==="granted") {
          new Notification("OOTD",{body:msgs[Math.floor(Math.random()*msgs.length)]});
          store.set(notifDateKey, new Date().toDateString());
        }
      }, delay);
    }
  }
}

// ── Score Ring ──
function ScoreRing({score,size=150,dark=false}) {
  const r=(size-14)/2, circ=2*Math.PI*r, offset=circ-(score/100)*circ;
  const color = dark?"#ffffff":"#000000";
  const track = dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)";
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>
    </svg>
  );
}

// ── Streak Animation ──
function StreakAnimation({streak, onDone}) {
  useEffect(()=>{ const t=setTimeout(onDone,3000); return()=>clearTimeout(t); },[onDone]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={onDone}>
      <div style={{textAlign:"center",animation:"fadeUp 0.5s ease",fontFamily:"'DM Mono',monospace"}}>
        <div style={{fontSize:88,marginBottom:8,lineHeight:1}}>🔥</div>
        <div style={{fontSize:52,fontWeight:800,color:"#f0932b",fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1,marginBottom:6}}>{streak}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.9)",letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Day Streak</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",letterSpacing:2}}>tap to continue</div>
      </div>
    </div>
  );
}

// ── Onboarding ──
function Onboarding({onDone, dark}) {
  const [step, setStep] = useState(0);
  const steps = [
    {icon:"👗", title:"Rate Any Outfit", sub:"Upload a photo and get a brutal, honest score out of 100 — AI trained on real style."},
    {icon:"📊", title:"See What's Working", sub:"Get a full breakdown: fit, color coordination, style coherence, and occasion match."},
    {icon:"📈", title:"Track Your Glow Up", sub:"Every rating is saved. Watch your score improve over time and build your style profile."},
    {icon:"✦", title:"Share & Go Viral", sub:"Your score card is made for TikTok and Instagram. Post it. Let people roast or praise."},
    {icon:"🔓", title:"Go Pro, Go Unlimited", sub:"1 free rating a week. Go Pro for $7.99/month — unlimited ratings, full history, style analytics, and trend alerts.", isPro:true},
  ];
  const s = steps[step];
  const dColor = dark?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.18)";
  const isLast = step === steps.length-1;
  return (
    <div style={{position:"fixed",inset:0,background:T.bg,zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,fontFamily:"'DM Mono',monospace"}}>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:24}}>{s.icon}</div>
        <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
          <Star color={dColor} size={14} style={{position:"absolute",top:-16,right:-20}}/>
          <div style={{fontSize:26,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,lineHeight:1.2}}>{s.title}</div>
          <Squiggle color={dColor} width={180} style={{margin:"8px auto 0"}}/>
        </div>
        <p style={{fontSize:13,color:T.muted,lineHeight:1.7,maxWidth:300,margin:"0 auto 36px"}}>{s.sub}</p>
        {s.isPro && (
          <div style={{background:"linear-gradient(135deg,rgba(255,209,102,0.12),rgba(240,147,43,0.08))",border:"1px solid rgba(255,209,102,0.25)",borderRadius:16,padding:16,marginBottom:24,textAlign:"left"}}>
            {[["Unlimited ratings","Rate every outfit every day"],["Style history","Full glow-up tracking"],["Analytics","Know your strengths & weak spots"],["Trend alerts","Stay ahead of what's in"]].map(([t,d])=>(
              <div key={t} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#FFD166",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:9,color:"#000"}}>✓</span>
                </div>
                <div>
                  <span style={{fontSize:11,color:T.text,fontWeight:600}}>{t}</span>
                  <span style={{fontSize:10,color:T.muted}}> — {d}</span>
                </div>
              </div>
            ))}
            <div style={{fontSize:11,color:"#FFD166",marginTop:4,letterSpacing:1}}>$7.99/month · Cancel anytime</div>
          </div>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:28}}>
          {steps.map((_,i)=><div key={i} style={{width:i===step?24:6,height:6,borderRadius:3,background:i===step?T.text:`${T.text}22`,transition:"all 0.3s"}}/>)}
        </div>
        <button onClick={isLast?onDone:()=>setStep(s=>s+1)} style={{width:"100%",background:T.card,color:T.cardText,border:"none",borderRadius:14,padding:"16px 0",fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",boxShadow:dark?"none":"0 4px 20px rgba(0,0,0,0.15)"}}>
          {isLast?"Start Rating ✦":"Next →"}
        </button>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:"none",color:T.faint,fontSize:11,cursor:"pointer",marginTop:14,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Back</button>}
        {!isLast&&<button onClick={onDone} style={{background:"none",border:"none",color:T.faint,fontSize:10,cursor:"pointer",marginTop:8,letterSpacing:1,fontFamily:"'DM Mono',monospace",display:"block",width:"100%"}}>skip</button>}
      </div>
    </div>
  );
}

// ── Re-engagement Banner ──
function ReEngagementBanner({email, dark, onRate}) {
  const u = getUserData(email)||{};
  const history = u.history||[];
  if (history.length===0) return null;
  const lastDate = u.history?.[0]?.date;
  const daysSince = lastDate ? Math.floor((Date.now()-new Date(lastDate+"," + new Date().getFullYear()).getTime())/(1000*60*60*24)) : 99;
  if (daysSince < 1) return null;
  const trend = history.length>=2 ? history[0].score-history[1].score : 0;
  const msgs = [
    {icon:"📉", title:`Your score dropped ${Math.abs(trend)} pts`, sub:"Last outfit didn't hit. Come back and redeem yourself.", show: trend<-3},
    {icon:"🔥", title:"3-day streak broken", sub:"You've been on a roll. Don't lose your momentum.", show: daysSince>=3&&history.length>=3},
  ];
  const msg = msgs.find(m=>m.show);
  if (!msg) return null;
  return (
    <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:16,display:"flex",alignItems:"center",gap:14,boxShadow:dark?"none":"0 2px 16px rgba(0,0,0,0.12)",cursor:"pointer"}} onClick={onRate}>
      <div style={{fontSize:28,flexShrink:0}}>{msg.icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:600,color:T.cardText,marginBottom:3}}>{msg.title}</div>
        <div style={{fontSize:10,color:`${T.cardText}77`}}>{msg.sub}</div>
      </div>
      <div style={{fontSize:18,color:`${T.cardText}44`,flexShrink:0}}>→</div>
    </div>
  );
}

// ── Weekly Report Modal ──
function WeeklyReport({email, dark, onClose}) {
  const u = getUserData(email)||{};
  const history = u.history||[];
  const ws = getWeekStart();
  const thisWeek = history.filter(h=>{
    try{ return new Date(h.date+","+new Date().getFullYear())>=new Date(ws); }catch{return false;}
  });
  const lastWeek = history.slice(thisWeek.length, thisWeek.length+7);
  const thisAvg = thisWeek.length ? Math.round(thisWeek.reduce((a,h)=>a+h.score,0)/thisWeek.length) : 0;
  const lastAvg = lastWeek.length ? Math.round(lastWeek.reduce((a,h)=>a+h.score,0)/lastWeek.length) : 0;
  const diff = thisAvg - lastAvg;
  const scoreColor = thisAvg>=80?(dark?"#a8ff78":"#2a7a2a"):thisAvg>=60?(dark?"#FFD166":"#a06800"):(dark?"#e05555":"#b83030");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:24,padding:28,width:"100%",maxWidth:380,boxShadow:dark?"none":"0 8px 48px rgba(0,0,0,0.15)",animation:"fadeUp 0.3s ease"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:9,color:T.faint,letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>Weekly Style Report</div>
          <div style={{fontSize:28,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:6}}>
            {thisWeek.length===0?"No fits this week":thisAvg>=75?"Strong week 🔥":thisAvg>=60?"Decent week":"Rough week"}
          </div>
          {thisWeek.length>0&&<div style={{fontSize:12,color:T.muted}}>{lastWeek.length>0?`${diff>=0?"+":""}${diff} pts vs last week`:"First week tracked"}</div>}
        </div>
        {thisWeek.length>0?(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
              {[["Fits Rated",thisWeek.length],["Avg Score",thisAvg],["Best",Math.max(...thisWeek.map(h=>h.score))]].map(([label,val])=>(
                <div key={label} style={{background:T.bg3,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",color:scoreColor}}>{val}</div>
                  <div style={{fontSize:8,color:T.faint,letterSpacing:2,textTransform:"uppercase",marginTop:4}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{background:T.bg3,borderRadius:12,padding:14,marginBottom:20}}>
              <div style={{fontSize:9,color:T.faint,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>This Week's Fits</div>
              {thisWeek.slice(0,3).map((h,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:700,color:h.score>=80?"#2d7a2d":h.score>=65?"#b8860b":"#c0392b",width:28}}>{h.score}</div>
                  <div style={{fontSize:11,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{h.vibe}"</div>
                  <div style={{fontSize:9,color:T.faint}}>{h.date}</div>
                </div>
              ))}
            </div>
          </>
        ):(
          <div style={{textAlign:"center",padding:"20px 0 24px"}}>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>You haven't rated any fits this week.<br/>Upload your OOTD and get started.</div>
          </div>
        )}
        <button onClick={onClose} style={{width:"100%",background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"14px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",boxShadow:dark?"none":"0 2px 16px rgba(0,0,0,0.12)"}}>
          {thisWeek.length===0?"Rate Today →":"Close"}
        </button>
      </div>
    </div>
  );
}

// ── Image Preview ──
function ImagePreview({imageB64,imageMime,fit,setFit,onChangePhoto}) {
  return (
    <div style={{position:"relative",borderRadius:20,overflow:"hidden",background:T.bg2,border:`1px solid ${T.border}`,marginBottom:14}}>
      <img src={`data:${imageMime};base64,${imageB64}`} alt="" style={{width:"100%",maxHeight:480,objectFit:fit,display:"block"}}/>
      <div style={{position:"absolute",top:12,right:12,display:"flex",gap:5,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",borderRadius:20,padding:"4px 6px",border:"1px solid rgba(255,255,255,0.1)"}}>
        {[["cover","Fill"],["contain","Fit"],["scale-down","Full"]].map(([val,label])=>(
          <button key={val} onClick={()=>setFit(val)} style={{background:fit===val?"#fff":"transparent",color:fit===val?"#000":"rgba(255,255,255,0.7)",border:"none",borderRadius:14,padding:"4px 10px",fontSize:9,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",transition:"all 0.15s"}}>{label}</button>
        ))}
      </div>
      <button onClick={onChangePhoto} style={{position:"absolute",bottom:12,right:12,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",padding:"6px 14px",borderRadius:20,fontSize:9,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Change</button>
    </div>
  );
}

// ── Analyzing Screen ──
function AnalyzingScreen({imageB64, imageMime, dark}) {
  const phases = ["Scanning silhouette...","Reading color palette...","Checking proportions...","Analyzing occasion fit...","Calculating your score..."];
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(()=>{
    const iv = setInterval(()=>{
      setPhaseIdx(i => Math.min(i+1, phases.length-1));
      setProgress(p => Math.min(p + 100/phases.length, 92));
    }, 1600);
    return ()=>clearInterval(iv);
  },[]);

  return (
    <div className="fadeUp" style={{textAlign:"center",padding:"48px 0 60px"}}>
      <style>{`
        @keyframes scan{0%{top:0;opacity:0}10%{opacity:1}90%{top:calc(100% - 3px);opacity:1}100%{top:calc(100% - 3px);opacity:0}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes floatUp{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Photo with scan effect */}
      <div style={{position:"relative",display:"inline-block",marginBottom:32,borderRadius:20,overflow:"hidden",boxShadow:dark?"0 0 40px rgba(255,255,255,0.08)":"0 8px 40px rgba(0,0,0,0.2)"}}>
        {imageB64&&<img src={`data:${imageMime};base64,${imageB64}`} alt="" style={{width:200,maxHeight:280,objectFit:"cover",display:"block",borderRadius:20}}/>}
        {/* Dark overlay */}
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.35)",borderRadius:20}}/>
        {/* Scan line */}
        <div style={{position:"absolute",left:0,right:0,height:"3px",background:`linear-gradient(90deg,transparent 0%,${dark?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.9)"} 50%,transparent 100%)`,animation:"scan 1.8s ease-in-out infinite",boxShadow:"0 0 16px rgba(255,255,255,0.6)"}}/>
        {/* Corner brackets */}
        {[["0","0","borderTop","borderLeft"],["0","auto","borderTop","borderRight"],["auto","0","borderBottom","borderLeft"],["auto","auto","borderBottom","borderRight"]].map(([t,r,bt,bl],i)=>(
          <div key={i} style={{position:"absolute",top:t==="auto"?undefined:12,bottom:t==="auto"?12:undefined,left:r==="auto"?undefined:12,right:r==="auto"?12:undefined,width:20,height:20,[bt]:"2px solid rgba(255,255,255,0.8)",[bl]:"2px solid rgba(255,255,255,0.8)"}}/>
        ))}
        {/* Score placeholder ring */}
        <div style={{position:"absolute",bottom:12,right:12,width:44,height:44,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}}>
          <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.6)",animation:"blink 1.2s ease-in-out infinite"}}>?</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{width:200,height:2,background:"rgba(255,255,255,0.1)",borderRadius:2,margin:"0 auto 20px",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${progress}%`,background:dark?"#fff":"#111",borderRadius:2,transition:"width 1.5s ease",boxShadow:dark?"0 0 8px rgba(255,255,255,0.5)":"none"}}/>
      </div>

      {/* Phase text */}
      <div key={phaseIdx} style={{animation:"floatUp 0.4s ease forwards"}}>
        <p style={{color:dark?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.8)",fontSize:12,letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>{phases[phaseIdx]}</p>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:16}}>
        {phases.map((_,i)=>(
          <div key={i} style={{width:i===phaseIdx?20:6,height:6,borderRadius:3,background:i<=phaseIdx?(dark?"#fff":"#111"):(dark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.12)"),transition:"all 0.4s ease"}}/>
        ))}
      </div>
    </div>
  );
}

// ── Share Card ──
function ShareCard({result,imageB64,imageMime}) {
  const score = result.score;
  const scoreColor = "#000";
  return (
    <div style={{background:"#fff",borderRadius:24,fontFamily:"'DM Mono',monospace",maxWidth:300,margin:"0 auto",overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
      <div style={{padding:"12px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:7,color:"#ccc",letterSpacing:3,textTransform:"uppercase",marginBottom:2}}>AI Outfit Rater</div>
          <div style={{fontSize:20,fontWeight:800,color:"#000",letterSpacing:-1,fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>OOTD</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:44,fontWeight:800,color:scoreColor,lineHeight:1,fontFamily:"'Playfair Display',Georgia,serif"}}>{score}</div>
          <div style={{fontSize:7,color:"#ccc",letterSpacing:2,textTransform:"uppercase"}}>/100</div>
        </div>
      </div>
      {imageB64&&(
        <div style={{padding:"0 16px 8px",display:"flex",justifyContent:"center"}}>
          <div style={{borderRadius:14,overflow:"hidden",border:"1.5px solid #e8e8e8",width:"70%"}}>
            <img src={`data:${imageMime};base64,${imageB64}`} alt="" style={{width:"100%",display:"block"}}/>
          </div>
        </div>
      )}
      <div style={{padding:"0 16px 8px"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#000",fontFamily:"'Playfair Display',Georgia,serif",marginBottom:6,lineHeight:1.3}}>"{result.vibe}"</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {result.tags?.slice(0,3).map(t=>(
            <span key={t} style={{fontSize:7,color:"#888",letterSpacing:1.5,textTransform:"uppercase",background:"#f4f4f4",padding:"3px 9px",borderRadius:20}}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{padding:"6px 16px 14px",display:"flex",gap:6}}>
        {[["Fit",result.breakdown?.fit],["Color",result.breakdown?.color],["Style",result.breakdown?.style],["Occ",result.breakdown?.occasion]].map(([label,val])=>(
          <div key={label} style={{flex:1,background:"#f8f8f8",borderRadius:10,padding:"7px 4px",textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:800,color:scoreColor,fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>{val}</div>
            <div style={{fontSize:6,color:"#bbb",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── History Page ──
const HISTORY_PAGE_SIZE = 10;

function HistoryPage({email, dark, onRate, onUpgrade, isPro}) {
  const [history, setHistory] = useState(()=>(getUserData(email)||{}).history||[]);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);

  const handleDelete = (index) => {
    deleteRating(email, index);
    setHistory(h => h.filter((_,i)=>i!==index));
    setConfirmDelete(null);
    setSelected(null);
  };

  if (!isPro) return (
    <div className="fadeUp" style={{textAlign:"center",padding:"48px 0"}}>
      <div style={{fontSize:52,marginBottom:20}}>🔒</div>
      <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:8}}>History is Pro only</div>
      <div style={{fontSize:12,color:T.muted,lineHeight:1.7,marginBottom:28,maxWidth:260,margin:"0 auto 28px"}}>Unlock your full rating history and style analytics.</div>
      <button onClick={onUpgrade} style={{background:`linear-gradient(135deg,#FFD166,#f0932b)`,color:"#000",border:"none",borderRadius:14,padding:"14px 32px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Go Pro · $7.99/month</button>
    </div>
  );

  if (history.length===0) return (
    <div className="fadeUp" style={{textAlign:"center",padding:"60px 0"}}>
      <div style={{fontSize:48,marginBottom:16,opacity:0.3}}>◈</div>
      <div style={{fontSize:18,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:8}}>No ratings yet</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:28}}>Rate your first outfit to start tracking</div>
      <button onClick={onRate} style={{background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"13px 28px",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Rate an Outfit →</button>
    </div>
  );

  const avg = Math.round(history.reduce((a,r)=>a+r.score,0)/history.length);
  const best = Math.max(...history.map(r=>r.score));
  const streak = getStreak(email);

  return (
    <div className="fadeUp">
      {/* Share card modal */}
      {selected && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setSelected(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:360}}>
            <ShareCard result={selected.r} imageB64={selected.r.thumbnail||selected.r.imageB64} imageMime="image/jpeg"/>
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button onClick={()=>setSelected(null)} style={{flex:1,background:"#fff",color:"#000",border:"none",borderRadius:12,padding:"13px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Close</button>
              <button onClick={()=>{setConfirmDelete(selected.i);setSelected(null);}} style={{flex:1,background:"rgba(255,80,80,0.15)",color:"#ff5050",border:"1px solid rgba(255,80,80,0.3)",borderRadius:12,padding:"13px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete!==null && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:101,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setConfirmDelete(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:20,padding:28,width:"100%",maxWidth:320,textAlign:"center"}}>
            <div style={{fontSize:18,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:8}}>Delete this rating?</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:24}}>This can't be undone.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:12,padding:"13px 0",fontSize:11,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Cancel</button>
              <button onClick={()=>handleDelete(confirmDelete)} style={{flex:1,background:"#ff5050",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[["🔥",streak>0?`${streak}d`:"0d","Streak"],["◎",avg,"Avg"],["✦",best,"Best"]].map(([icon,val,label])=>(
          <div key={label} style={{background:"#111",borderRadius:16,padding:"16px 10px",textAlign:"center"}}>
            <div style={{fontSize:16,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:22,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",color:"#fff",lineHeight:1}}>{val}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.55)",letterSpacing:2,textTransform:"uppercase",marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Feed — paginated */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {history.slice(0,visibleCount).map((r,i)=>{
          const color = r.score>=80?(dark?"#a8ff78":"#1a7a1a"):r.score>=65?(dark?"#FFD166":"#8a6000"):(dark?"#ff6b6b":"#c00");
          return (
            <div key={i} onClick={()=>setSelected({r,i})} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:18,overflow:"hidden",display:"flex",cursor:"pointer",boxShadow:dark?"none":"0 1px 8px rgba(0,0,0,0.06)"}}>
              <div style={{flex:1,padding:"12px 14px",display:"flex",flexDirection:"column",justifyContent:"center",minWidth:0}}>
                <div style={{fontSize:11,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>"{r.vibe}"</div>
                <div style={{fontSize:9,color:T.faint,letterSpacing:1}}>{r.date} · {r.occasion}</div>
              </div>
              <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:24,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",color}}>{r.score}</div>
                <div style={{fontSize:10,color:T.faint}}>→</div>
              </div>
            </div>
          );
        })}
      </div>
      {visibleCount<history.length&&(
        <button onClick={()=>setVisibleCount(c=>c+HISTORY_PAGE_SIZE)} style={{width:"100%",marginTop:12,background:"none",border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 0",fontSize:10,color:T.muted,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
          Load more ({history.length-visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

function StyleProfilePage({email, dark, isPro, onUpgrade}) {
  const u = getUserData(email)||{};
  const history = u.history||[];

  if (!isPro) return (
    <div className="fadeUp" style={{textAlign:"center",padding:"48px 0"}}>
      <div style={{fontSize:52,marginBottom:20}}>🔒</div>
      <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:8}}>Style Profile is Pro only</div>
      <div style={{fontSize:12,color:T.muted,lineHeight:1.7,marginBottom:28,maxWidth:260,margin:"0 auto 28px"}}>Unlock your style DNA.</div>
      <button onClick={onUpgrade} style={{background:`linear-gradient(135deg,#FFD166,#f0932b)`,color:"#000",border:"none",borderRadius:14,padding:"14px 32px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Go Pro · $7.99/month</button>
    </div>
  );

  if (history.length < 2) return (
    <div className="fadeUp" style={{textAlign:"center",padding:"60px 0"}}>
      <div style={{fontSize:18,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:20}}>Rate 2+ outfits to unlock</div>
      <div style={{background:T.border,borderRadius:6,height:6,overflow:"hidden",maxWidth:200,margin:"0 auto 8px"}}>
        <div style={{background:T.text,height:"100%",width:`${(history.length/2)*100}%`}}/>
      </div>
      <div style={{fontSize:10,color:T.faint,letterSpacing:2}}>{history.length}/2</div>
    </div>
  );

  const avgDim = r => Math.round(history.reduce((a,h)=>a+(h.breakdown?.[r]||0),0)/history.length);
  const dims = [["Fit",avgDim("fit")],["Color",avgDim("color")],["Style",avgDim("style")],["Occasion",avgDim("occasion")]];
  const strongest = [...dims].sort((a,b)=>b[1]-a[1])[0];
  const weakest = [...dims].sort((a,b)=>a[1]-b[1])[0];
  const avgScore = Math.round(history.reduce((a,h)=>a+h.score,0)/history.length);
  const trend = history.length>=3 ? history[0].score - history[history.length-1].score : 0;
  const topTags = Object.entries(history.flatMap(h=>h.tags||[]).reduce((a,t)=>{a[t]=(a[t]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([t])=>t);
  const scoreColor = avgScore>=80?(dark?"#a8ff78":"#1a7a1a"):avgScore>=60?(dark?"#FFD166":"#8a6000"):(dark?"#ff6b6b":"#c00");

  return (
    <div className="fadeUp">
      {/* Score + trend */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:4,textTransform:"uppercase",marginBottom:6}}>Avg Score</div>
          <div style={{fontSize:64,fontWeight:800,color:scoreColor,lineHeight:1,fontFamily:"'Playfair Display',Georgia,serif"}}>{avgScore}</div>
          <div style={{fontSize:9,color:T.faint,marginTop:6}}>{history.length} outfits rated</div>
        </div>
        <div style={{textAlign:"right",paddingBottom:8}}>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Trend</div>
          <div style={{fontSize:22,fontWeight:800,color:trend>3?(dark?"#a8ff78":"#1a7a1a"):trend<-3?(dark?"#ff6b6b":"#c00"):T.faint,fontFamily:"'Playfair Display',Georgia,serif"}}>{trend>3?"↑":trend<-3?"↓":"→"}</div>
        </div>
      </div>

      {/* 4 scores inline */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:0,marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
        {dims.map(([label,val],i)=>(
          <div key={label} style={{textAlign:"center",padding:"0 8px",borderRight:i<3?`1px solid ${T.border}`:"none"}}>
            <div style={{fontSize:26,fontWeight:800,color:T.text,fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>{val}</div>
            <div style={{fontSize:7,color:"rgba(255,255,255,0.6)",letterSpacing:2,textTransform:"uppercase",marginTop:6}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Best / worst */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Strongest</div>
          <div style={{fontSize:22,fontWeight:800,color:dark?"#a8ff78":"#1a7a1a",fontFamily:"'Playfair Display',Georgia,serif"}}>{strongest[0]}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Work On</div>
          <div style={{fontSize:22,fontWeight:800,color:dark?"#ff6b6b":"#c00",fontFamily:"'Playfair Display',Georgia,serif"}}>{weakest[0]}</div>
        </div>
      </div>

      {/* Streak */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Streak</div>
          <div style={{fontSize:28,fontWeight:800,color:"#f0932b",fontFamily:"'Playfair Display',Georgia,serif"}}>{getStreak(email)}d 🔥</div>
        </div>
      </div>

      {/* Aesthetic */}
      {topTags.length>0&&(
        <div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:4,textTransform:"uppercase",marginBottom:14}}>Your Aesthetic</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {topTags.map((t,i)=>(
              <span key={t} style={{fontSize:i===0?15:10,fontWeight:i===0?800:400,fontFamily:i===0?"'Playfair Display',Georgia,serif":"'DM Mono',monospace",letterSpacing:i===0?-0.5:1.5,textTransform:"uppercase",padding:i===0?"8px 18px":"6px 14px",borderRadius:20,background:"#111",color:"#fff",border:"1px solid rgba(255,255,255,0.15)"}}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Paywall Modal ──
function PaywallModal({onClose,onSubscribe}) {
  const [step,setStep] = useState("plan"); // "plan" | "success"
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [restoring,setRestoring] = useState(false);

  const handlePurchase = async () => {
    setError(""); setLoading(true);
    try {
      const isPro = await purchasePro();
      if (isPro) { setStep("success"); }
      else { setError("Subscription not activated. Try restoring purchases below."); }
    } catch(e) {
      // userCancelled means the user dismissed Apple's sheet — not an error
      if (!e?.userCancelled) setError(e?.message || "Purchase failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleRestore = async () => {
    setError(""); setRestoring(true);
    try {
      const isPro = await restorePurchases();
      if (isPro) { setStep("success"); }
      else { setError("No active subscription found on this Apple ID."); }
    } catch(e) {
      setError("Could not restore purchases. Please try again.");
    } finally { setRestoring(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={step==="plan"?onClose:undefined}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{width:40,height:4,background:"#ddd",borderRadius:2,margin:"0 auto 24px"}}/>
        {step==="plan"&&(<>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:11,color:"#f0932b",letterSpacing:3,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>OOTD PRO</div>
            <div style={{fontSize:26,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:"#000",marginBottom:8}}>Unlock Unlimited<br/>Outfit Ratings</div>
            <div style={{fontSize:11,color:"#888",lineHeight:1.7}}>You've used your free rating this week.</div>
          </div>
          {[["Unlimited outfit ratings","No weekly limits"],["Style history & analytics","Track your glow up over time"],["Full score breakdown","Fit, color, style & occasion"],["Trend alerts","Know what's in first"]].map(([t,d])=>(
            <div key={t} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:14}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,color:"#fff"}}>✓</span></div>
              <div><div style={{fontSize:12,color:"#000",marginBottom:2}}>{t}</div><div style={{fontSize:10,color:"#888"}}>{d}</div></div>
            </div>
          ))}
          <div style={{background:"#f5f5f5",borderRadius:12,padding:"14px 18px",margin:"20px 0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:12,color:"#000"}}>OOTD Pro · Monthly</div><div style={{fontSize:10,color:"#888"}}>Cancel anytime in Settings</div></div>
            <div style={{fontSize:20,fontWeight:700,color:"#000",fontFamily:"'Playfair Display',Georgia,serif"}}>$7.99</div>
          </div>
          {error&&<p style={{color:"#c00",fontSize:11,marginBottom:12,textAlign:"center",lineHeight:1.5}}>{error}</p>}
          <button onClick={handlePurchase} disabled={loading} style={{width:"100%",background:loading?"#e0e0e0":"#000",color:loading?"#aaa":"#fff",border:"none",borderRadius:12,padding:"16px 0",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:10}}>
            {loading ? "Connecting to App Store..." : (<>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Subscribe $7.99/month
            </>)}
          </button>
          <button onClick={handleRestore} disabled={restoring} style={{width:"100%",background:"none",border:"none",color:"#888",fontSize:10,cursor:restoring?"not-allowed":"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",padding:"10px 0",marginBottom:4}}>
            {restoring ? "Restoring..." : "Restore Purchases"}
          </button>
          <button onClick={onClose} style={{width:"100%",background:"none",border:"none",color:"#bbb",fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",padding:"8px 0"}}>Maybe later</button>
          <p style={{textAlign:"center",fontSize:9,color:"#ccc",marginTop:10,letterSpacing:1,lineHeight:1.6}}>Payment processed by Apple · Subscription auto-renews monthly · Cancel anytime in iOS Settings</p>
        </>)}
        {step==="success"&&(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px"}}><span style={{fontSize:28,color:"#fff"}}>✦</span></div>
            <div style={{fontSize:24,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:"#000",marginBottom:10}}>You're Pro now!</div>
            <div style={{fontSize:11,color:"#888",lineHeight:1.7,marginBottom:28}}>Payment confirmed via App Store.<br/>Unlimited outfit ratings unlocked.</div>
            <button onClick={onSubscribe} style={{background:"#000",color:"#fff",border:"none",borderRadius:12,padding:"14px 40px",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Start Rating →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profile Page ──
function ProfilePage({user,onUpgrade,isPro,usageLeft,setAvatar,dark,onDelete,onCancelSub,onSignOut}) {
  const [u, setU] = useState(()=>getUserData(user.email)||{});
  const avatarRef = useRef();
  const [avatar,setAvatarLocal] = useState(u.avatar||null);
  const [legalModal,setLegalModal] = useState(null);
  const [showDelete,setShowDelete] = useState(false);
  const [showCancelConfirm,setShowCancelConfirm] = useState(false);
  const [showAccountSettings,setShowAccountSettings] = useState(false);
  const handleAvatarFile = async file => {
    if (!file?.type.startsWith("image/")) return;
    const MAX = 256;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(MAX/bitmap.width, MAX/bitmap.height, 1);
    const w = Math.round(bitmap.width*scale), h = Math.round(bitmap.height*scale);
    const c = document.createElement("canvas"); c.width=w; c.height=h;
    c.getContext("2d").drawImage(bitmap,0,0,w,h);
    bitmap.close();
    const dataUrl = c.toDataURL("image/jpeg", 0.82);
    setAvatarLocal(dataUrl);
    setAvatar(user.email, dataUrl);
  };
  return (
    <div className="fadeUp">
      <div style={{textAlign:"center",padding:"12px 0 24px"}}>
        <div style={{position:"relative",display:"inline-block",marginBottom:10}}>
          <div onClick={()=>avatarRef.current?.click()} style={{width:80,height:80,borderRadius:"50%",background:T.bg3,border:`2px solid ${T.border2}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
            {avatar?<img src={avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:28,color:T.text}}>{user.name.charAt(0).toUpperCase()}</span>}
          </div>
          <div onClick={()=>avatarRef.current?.click()} style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:dark?"#fff":"#000",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:`2px solid ${T.bg}`}}>
            <span style={{fontSize:13,color:dark?"#000":"#fff",fontWeight:700}}>+</span>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleAvatarFile(e.target.files[0])}/>
        </div>
        <div style={{fontSize:9,color:T.faint,letterSpacing:2,marginBottom:10}}>Tap to change photo</div>
        <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,color:T.text}}>{user.name}</div>
        <div style={{fontSize:10,color:T.muted,marginTop:4}}>{user.email}</div>
        {isPro&&<div style={{display:"inline-block",marginTop:10,background:"linear-gradient(135deg,#FFD166,#f0932b)",color:"#000",fontSize:9,padding:"4px 14px",borderRadius:20,letterSpacing:2,fontWeight:700}}>PRO ✦</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        {[["Total",u.totalRatings||0],["Since",u.joinedAt||"Today"],["Week",isPro?"∞":`${usageLeft}/1`],["Status",isPro?"Pro ✦":"Free"]].map(([label,val])=>(
          <div key={label} style={{background:dark?T.bg2:T.card,borderRadius:14,padding:18,boxShadow:dark?"none":"0 2px 16px rgba(0,0,0,0.1)"}}>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>{label}</div>
            <div style={{fontSize:15,fontFamily:"'Playfair Display',Georgia,serif",color:label==="Status"&&isPro?"#FFD166":dark?T.text:T.cardText}}>{val}</div>
          </div>
        ))}
      </div>
      {!isPro&&<div style={{background:"rgba(255,209,102,0.08)",border:"1px solid rgba(255,209,102,0.2)",borderRadius:16,padding:24,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:18,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:8}}>Upgrade to Pro ✦</div>
        <div style={{fontSize:10,color:T.muted,lineHeight:1.8,marginBottom:20}}>Unlimited ratings · Full history<br/>Style profile · Trend alerts</div>
        <button onClick={onUpgrade} style={{width:"100%",background:"linear-gradient(135deg,#FFD166,#f0932b)",color:"#000",border:"none",borderRadius:12,padding:"14px 0",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Subscribe · $7.99/month</button>
      </div>}
      {isPro&&(()=>{
        const proSince = u.proSince;
        const renewsAt = proSince ? new Date(proSince + 30*24*60*60*1000) : null;
        const daysLeft = renewsAt ? Math.max(0, Math.ceil((renewsAt - Date.now())/(1000*60*60*24))) : null;
        const renewStr = renewsAt ? renewsAt.toLocaleDateString("en-US",{month:"short",day:"numeric"}) : null;
        return (
          <div style={{background:"rgba(168,255,120,0.06)",border:"1px solid rgba(168,255,120,0.2)",borderRadius:16,padding:20,marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:13,color:dark?"#a8ff78":"#2a7a2a",letterSpacing:2,marginBottom:6}}>✦ PRO ACTIVE</div>
            <div style={{fontSize:10,color:T.muted,marginBottom:daysLeft!=null?6:14}}>Unlimited outfit ratings enabled.</div>
            {daysLeft!=null&&<div style={{fontSize:10,color:dark?"#a8ff78":"#2a7a2a",marginBottom:14,letterSpacing:0.5}}>
              {daysLeft===0?"Renews today":daysLeft===1?"1 day left":`${daysLeft} days left`}{renewStr?` · renews ${renewStr}`:""}
            </div>}
            {showCancelConfirm ? (
              <div>
                <p style={{fontSize:11,color:T.muted,lineHeight:1.6,marginBottom:12}}>
                  {isNative()
                    ? "You'll be taken to Apple Settings. Your Pro access stays until the end of the billing period."
                    : "This will cancel your Pro subscription immediately."}
                </p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowCancelConfirm(false)} style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,color:T.text,borderRadius:10,padding:"10px 0",fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Keep Pro</button>
                  <button onClick={()=>{setShowCancelConfirm(false);onCancelSub();}} style={{flex:1,background:"rgba(224,85,85,0.12)",border:"1px solid rgba(224,85,85,0.3)",color:T.red,borderRadius:10,padding:"10px 0",fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
                    {isNative()?"Manage →":"Confirm"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setShowCancelConfirm(true)} style={{background:"transparent",border:"1px solid rgba(224,85,85,0.3)",color:T.red,borderRadius:10,padding:"8px 20px",fontSize:9,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
                Cancel Subscription
              </button>
            )}
          </div>
        );
      })()}
      <div style={{background:dark?T.bg2:T.card,borderRadius:14,overflow:"hidden",boxShadow:dark?"none":"0 2px 16px rgba(0,0,0,0.1)"}}>
        {[["Sign Out","→","signout"],["Account Settings","→","account"],["Privacy Policy","→","privacy"],["Terms of Service","→","terms"],["Delete Account","⚠","delete"]].map(([label,icon,action],i)=>(
          <div key={label} onClick={()=>{if(action==="delete")setShowDelete(true);else if(action==="account")setShowAccountSettings(true);else if(action==="signout")onSignOut();else setLegalModal(action);}} style={{padding:"15px 18px",borderBottom:i<4?`1px solid ${dark?T.border:T.cardText+"11"}`:"none",display:"flex",justifyContent:"space-between",cursor:"pointer"}}>
            <span style={{fontSize:12,color:label==="Delete Account"?"#ff6666":dark?T.text:T.cardText}}>{label}</span>
            <span style={{fontSize:12,color:dark?T.faint:`${T.cardText}33`}}>{icon}</span>
          </div>
        ))}
      </div>
      {legalModal&&<LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
      {showDelete&&<DeleteAccountModal onClose={()=>setShowDelete(false)} onConfirm={()=>{store.del(`ootd_user_${user.email}`);store.del(`ootd_meta_${user.email}`);store.del("ootd_u");onDelete();}}/>}
      {showAccountSettings&&<AccountSettingsModal user={user} onClose={()=>setShowAccountSettings(false)} onSave={updated=>{setU(updated);setShowAccountSettings(false);}}/>}
    </div>
  );
}

// ── Notification Prompt ──
function NotificationPrompt({onDone, dark}) {
  const [status, setStatus] = useState("idle"); // idle | granted | denied
  const request = async () => {
    if (!("Notification" in window)) { setStatus("denied"); return; }
    const perm = await Notification.requestPermission();
    setStatus(perm==="granted"?"granted":"denied");
    if (perm==="granted") {
      setTimeout(()=>new Notification("OOTD 👗", {body:"Rate your outfit today and keep your streak alive!"}), 500);
    }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:0}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:"24px 24px 0 0",padding:"32px 24px 48px",width:"100%",maxWidth:480,animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:16}}>🔔</div>
          {status==="idle"&&<>
            <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:10}}>Stay on your style game</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.7,marginBottom:28}}>Get a daily nudge to rate your outfit and keep your streak alive. Turn on notifications — you can always turn them off.</div>
            <button onClick={request} style={{width:"100%",background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"15px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10,boxShadow:dark?"none":"0 4px 20px rgba(0,0,0,0.15)"}}>Enable Notifications</button>
            <button onClick={onDone} style={{width:"100%",background:"none",border:"none",color:T.faint,fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",padding:"8px 0"}}>Maybe later</button>
          </>}
          {status==="granted"&&<>
            <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:10}}>You're all set 🔥</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:24}}>We'll remind you to rate your outfit daily.</div>
            <button onClick={onDone} style={{width:"100%",background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"15px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",boxShadow:dark?"none":"0 4px 20px rgba(0,0,0,0.15)"}}>Let's Go →</button>
          </>}
          {status==="denied"&&<>
            <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:10}}>No worries</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:24}}>You can turn on notifications anytime in your device settings.</div>
            <button onClick={onDone} style={{width:"100%",background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"15px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",boxShadow:dark?"none":"0 4px 20px rgba(0,0,0,0.15)"}}>Got It</button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Native Share ──
async function nativeShare(result) {
  const text = `I just got rated ${result.score}/100 on OOTD 👗\n"${result.vibe}"\n\nRate your fit → ootd.app`;
  if (navigator.share) {
    try { await navigator.share({title:"My OOTD Score", text}); return true; } catch { return false; }
  }
  try { await navigator.clipboard.writeText(text); return "copied"; } catch { return false; }
}

// ── Legal Modal ──
function LegalModal({type,onClose}) {
  const isPrivacy = type==="privacy";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:isPrivacy?"#fff":T.bg2,border:`1px solid ${T.border}`,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{width:40,height:4,background:"#ddd",borderRadius:2,margin:"0 auto 24px"}}/>
        {isPrivacy
          ? <div dangerouslySetInnerHTML={{__html:PRIVACY_POLICY_HTML}}/>
          : <>
              <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:20}}>Terms of Service</div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.9}}>
                <p style={{marginBottom:12}}><strong style={{color:T.text}}>Acceptance</strong><br/>By using OOTD, you agree to these terms. You must be 13 or older to use this service.</p>
                <p style={{marginBottom:12}}><strong style={{color:T.text}}>Content</strong><br/>You retain ownership of photos you upload. By uploading, you grant us permission to analyze them for rating purposes only.</p>
                <p style={{marginBottom:12}}><strong style={{color:T.text}}>Subscriptions</strong><br/>Pro subscriptions are billed monthly at $7.99. Cancel anytime. No refunds for partial billing periods.</p>
                <p style={{marginBottom:12}}><strong style={{color:T.text}}>Disclaimer</strong><br/>Ratings are for entertainment. We're not responsible for any fashion choices made based on our ratings.</p>
                <p style={{color:T.faint,fontSize:10}}>Last updated: May 2026</p>
              </div>
            </>
        }
        <button onClick={onClose} style={{width:"100%",marginTop:24,background:isPrivacy?"#000":T.card,color:isPrivacy?"#fff":T.cardText,border:"none",borderRadius:12,padding:"14px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Close</button>
      </div>
    </div>
  );
}

// ── Delete Account Modal ──
function DeleteAccountModal({onClose,onConfirm}) {
  const [typed,setTyped] = useState("");
  const ready = typed==="DELETE";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{width:40,height:4,background:T.border2,borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <span style={{fontSize:22,color:"#ff6b6b"}}>⚠</span>
          </div>
          <div style={{fontSize:20,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:8}}>Delete Account</div>
          <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>This permanently deletes your account, all ratings, style history, and data. This cannot be undone.</div>
        </div>
        <p style={{fontSize:10,color:T.faint,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Type DELETE to confirm</p>
        <input value={typed} onChange={e=>setTyped(e.target.value.toUpperCase())} placeholder="DELETE"
          style={{width:"100%",background:T.bg3,border:`1px solid ${ready?"#ff6b6b":T.border}`,borderRadius:10,padding:"13px 16px",color:T.text,fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",letterSpacing:3,textAlign:"center",marginBottom:16,display:"block"}}/>
        <button onClick={ready?onConfirm:undefined} style={{width:"100%",background:ready?"#ff6b6b":"rgba(255,107,107,0.15)",color:ready?"#fff":"rgba(255,107,107,0.4)",border:"none",borderRadius:12,padding:"14px 0",fontSize:11,fontWeight:700,cursor:ready?"pointer":"not-allowed",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10,transition:"all 0.2s"}}>
          Delete My Account
        </button>
        <button onClick={onClose} style={{width:"100%",background:"none",border:"none",color:T.faint,fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",padding:"8px 0"}}>Cancel</button>
      </div>
    </div>
  );
}
// ── Account Settings Modal ──
function AccountSettingsModal({user, onClose, onSave}) {
  const u = getUserData(user.email)||{};
  const [name, setName] = useState(u.name||"");
  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const inputStyle = {width:"100%",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 16px",color:T.text,fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",marginBottom:12,display:"block"};

  const handleSave = () => {
    setError("");
    if (name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (changingPw) {
      if (currentPw !== u.password) { setError("Current password is incorrect."); return; }
      if (newPw.length < 6) { setError("New password must be at least 6 characters."); return; }
      if (newPw !== confirmPw) { setError("Passwords don't match."); return; }
    }
    const updated = {...u, name: name.trim()};
    if (changingPw && newPw) updated.password = newPw;
    setUserData(user.email, updated);
    setSaved(true);
    setTimeout(()=>onSave(updated), 800);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{width:40,height:4,background:T.border2,borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{fontSize:18,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:6}}>Account Settings</div>
        <div style={{fontSize:10,color:T.muted,marginBottom:24,letterSpacing:0.5}}>{user.email}</div>

        <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Display Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inputStyle}/>

        <div style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:3,textTransform:"uppercase",marginBottom:3}}>Password</div>
              <div style={{fontSize:12,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{changingPw?"Enter new password below":"••••••••"}</div>
            </div>
            <button onClick={()=>{setChangingPw(c=>!c);setCurrentPw("");setNewPw("");setConfirmPw("");setError("");}} style={{background:"transparent",border:`1px solid ${T.border2}`,borderRadius:8,padding:"6px 12px",fontSize:9,color:T.muted,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{changingPw?"Cancel":"Change"}</button>
          </div>
          {changingPw&&(
            <div style={{marginTop:14}}>
              <input value={currentPw} onChange={e=>setCurrentPw(e.target.value)} type="password" placeholder="Current password" style={{...inputStyle,marginBottom:8}}/>
              <div style={{position:"relative"}}>
                <input value={newPw} onChange={e=>setNewPw(e.target.value)} type={showNew?"text":"password"} placeholder="New password (min 6 chars)" style={{...inputStyle,marginBottom:8,paddingRight:48}}/>
                <button onClick={()=>setShowNew(s=>!s)} style={{position:"absolute",right:14,top:14,background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{showNew?"hide":"show"}</button>
              </div>
              <input value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} type="password" placeholder="Confirm new password" style={{...inputStyle,marginBottom:0}}/>
            </div>
          )}
        </div>

        {error&&<p style={{color:T.red,fontSize:11,marginBottom:12}}>{error}</p>}
        <button onClick={handleSave} style={{width:"100%",background:saved?"rgba(168,255,120,0.15)":T.card,color:saved?"#a8ff78":T.cardText,border:saved?"1px solid rgba(168,255,120,0.3)":"none",borderRadius:12,padding:"14px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10,transition:"all 0.2s"}}>
          {saved?"Saved ✓":"Save Changes"}
        </button>
        <button onClick={onClose} style={{width:"100%",background:"none",border:"none",color:T.faint,fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",padding:"8px 0"}}>Cancel</button>
      </div>
    </div>
  );
}

const AuthScreen = memo(function AuthScreen({onAuth}) {
  const [mode,setMode] = useState("login");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  const [acceptedPP,setAcceptedPP] = useState(false);
  const [acceptedTOS,setAcceptedTOS] = useState(false);
  const [legalType,setLegalType] = useState(null);
  const [forgotStep,setForgotStep] = useState(null); // null | "enter" | "show"
  const [forgotEmail,setForgotEmail] = useState("");
  const [forgotPw,setForgotPw] = useState("");
  const [showForgotPw,setShowForgotPw] = useState(false);
  const nameRef=useRef(),emailRef=useRef(),pwRef=useRef();

  const handleForgot = () => {
    const u = getUserData(forgotEmail.trim().toLowerCase());
    if (!u) { setForgotPw(""); setForgotStep("notfound"); return; }
    setForgotPw(u.password||"");
    setForgotStep("show");
  };

  const submit = useCallback(()=>{
    setError(""); setLoading(true);
    setTimeout(()=>{
      const name=nameRef.current?.value||"", email=emailRef.current?.value||"", pw=pwRef.current?.value||"";
      const err = mode==="login"?onAuth.login(email,pw):onAuth.signup(name,email,pw);
      if(err){
        if(mode==="login"&&err==="No account found. Please sign up."){
          setMode("signup"); setAcceptedPP(false); setAcceptedTOS(false);
          setError("No account found — enter your name below to sign up.");
        } else {
          setError(err);
        }
      }
      setLoading(false);
    },500);
  },[mode,onAuth]);

  const isDark = T===DARK;
  const field = {width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:10,padding:"13px 16px",color:T.inputText,fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",marginBottom:10,display:"block"};
  const canSubmit = mode==="login" || (acceptedPP && acceptedTOS);

  return (
    <>
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Mono',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input::placeholder{color:${isDark?"rgba(255,255,255,0.3)":"rgba(0,0,0,0.3)"}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.15;transform:scale(0.85)}50%{opacity:1;transform:scale(1.15)}}
        .fadeUp{animation:fadeUp 0.45s ease forwards}
        .dot{animation:pulse 1.3s ease-in-out infinite}
      `}</style>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{position:"relative",display:"inline-block"}}>
            <Star color={isDark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.2)"} size={16} style={{position:"absolute",top:-14,right:-22}}/>
            <Star color={isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.12)"} size={10} style={{position:"absolute",top:2,left:-20}}/>
            <div style={{fontSize:38,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,letterSpacing:-1}}>OOTD</div>
            <Squiggle color={isDark?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.18)"} width={90} style={{margin:"2px auto 0"}}/>
          </div>
          <div style={{fontSize:9,color:T.faint,letterSpacing:5,textTransform:"uppercase",marginTop:8}}>AI Outfit Rater</div>
        </div>
        <div style={{background:T.authCard,borderRadius:20,padding:28,boxShadow:isDark?"none":"0 4px 32px rgba(0,0,0,0.1)"}}>
          <div style={{display:"flex",marginBottom:24,background:T.authTab,borderRadius:10,padding:3}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError("");setAcceptedPP(false);setAcceptedTOS(false);}} style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:mode===m?T.authTabActive:"transparent",color:mode===m?T.authTabActiveText:T.muted,fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",fontWeight:mode===m?600:400,transition:"all 0.15s"}}>{m}</button>
            ))}
          </div>
          {mode==="signup"&&<input ref={nameRef} placeholder="Full name" style={field}/>}
          <input ref={emailRef} placeholder="Email address" type="email" style={field}/>
          <input ref={pwRef} placeholder="Password (min 6 chars)" type="password" style={field} onKeyDown={e=>e.key==="Enter"&&canSubmit&&submit()}/>
          {mode==="login"&&<div style={{textAlign:"right",marginTop:-6,marginBottom:10}}>
            <span onClick={()=>setForgotStep("enter")} style={{fontSize:9,color:T.muted,cursor:"pointer",letterSpacing:1,textDecoration:"underline",fontFamily:"'DM Mono',monospace"}}>Forgot password?</span>
          </div>}
          {mode==="signup"&&(
            <div style={{marginBottom:12}}>
              {[["pp","Privacy Policy","privacy"],["tos","Terms of Service","terms"]].map(([key,label,type])=>(
                <label key={key} style={{display:"flex",alignItems:"center",gap:9,marginBottom:8,cursor:"pointer",userSelect:"none"}}>
                  <input type="checkbox" checked={key==="pp"?acceptedPP:acceptedTOS} onChange={e=>key==="pp"?setAcceptedPP(e.target.checked):setAcceptedTOS(e.target.checked)} style={{width:15,height:15,accentColor:T.text,cursor:"pointer",flexShrink:0}}/>
                  <span style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace",lineHeight:1.5}}>I agree to the{" "}<span onClick={e=>{e.preventDefault();setLegalType(type);}} style={{color:T.text,textDecoration:"underline",cursor:"pointer"}}>{label}</span></span>
                </label>
              ))}
            </div>
          )}
          {error&&<p style={{color:T.red,fontSize:11,marginBottom:12,lineHeight:1.5}}>{error}</p>}
          <button onClick={submit} disabled={loading||!canSubmit} style={{width:"100%",background:(loading||!canSubmit)?T.bg3:T.authTabActive,color:(loading||!canSubmit)?T.muted:T.authTabActiveText,border:"none",borderRadius:10,padding:"14px 0",fontSize:11,fontWeight:600,cursor:(loading||!canSubmit)?"not-allowed":"pointer",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",transition:"all 0.15s"}}>
            {loading?"...":(mode==="login"?"Sign In →":"Create Account →")}
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:9,color:T.faint,marginTop:20,letterSpacing:3}}>FREE · 1 OUTFIT/WEEK</p>
      </div>
    </div>
    {legalType&&<LegalModal type={legalType} onClose={()=>setLegalType(null)}/>}
    {forgotStep&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setForgotStep(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div style={{width:40,height:4,background:T.border2,borderRadius:2,margin:"0 auto 24px"}}/>
          <div style={{fontSize:18,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text,marginBottom:6}}>Forgot Password</div>
          {(forgotStep==="enter"||forgotStep==="notfound")&&<>
            <div style={{fontSize:11,color:T.muted,marginBottom:20}}>Enter your email and we'll show your password.</div>
            <input value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="Email address" type="email" style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 16px",color:T.text,fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",marginBottom:10,display:"block"}}/>
            {forgotStep==="notfound"&&<p style={{color:T.red,fontSize:11,marginBottom:10}}>No account found for that email.</p>}
            <button onClick={handleForgot} style={{width:"100%",background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"14px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Look Up →</button>
          </>}
          {forgotStep==="show"&&<>
            <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Your password for <strong style={{color:T.text}}>{forgotEmail}</strong>:</div>
            <div style={{position:"relative",marginBottom:20}}>
              <div style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 48px 13px 16px",color:T.text,fontSize:15,fontFamily:"'DM Mono',monospace",letterSpacing:2}}>
                {showForgotPw ? forgotPw : "•".repeat(forgotPw.length)}
              </div>
              <button onClick={()=>setShowForgotPw(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{showForgotPw?"hide":"show"}</button>
            </div>
            <button onClick={()=>{setForgotStep(null);setShowForgotPw(false);}} style={{width:"100%",background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"14px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Done</button>
          </>}
          <button onClick={()=>setForgotStep(null)} style={{width:"100%",background:"none",border:"none",color:T.faint,fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",padding:"8px 0",marginTop:8}}>Cancel</button>
        </div>
      </div>
    )}
    </>
  );
});

// ── Main App ──
function App({user,logout,setPro,removePro,setAvatar,setOnboarded}) {
  const [dark,setDark] = useState(()=>store.get("ootd_dark")||false);
  T = dark ? DARK : LIGHT;
  const toggleDark = ()=>{ const n=!dark; setDark(n); store.set("ootd_dark",n); };

  // Single read on mount — avoids N+1 localStorage deserializations below
  const _u = getUserData(user.email)||{};
  const _meta = getMetaData(user.email)||{};

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [streak] = useState(()=>getStreak(_u));
  const [showWeeklyReport,setShowWeeklyReport] = useState(false);
  const [showOnboarding,setShowOnboarding] = useState(!_u.onboarded);
  const [showStreakAnim, setShowStreakAnim] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);

  const [tab,setTab] = useState("rate");
  const [screen,setScreen] = useState("upload");
  const [imageB64,setImageB64] = useState(null);
  const [imageMime,setImageMime] = useState("image/jpeg");
  const [imageFit,setImageFit] = useState("cover");
  const [result,setResult] = useState(null);
  const [occasion,setOccasion] = useState("everyday");
  const [animScore,setAnimScore] = useState(0);
  const [showShare,setShowShare] = useState(false);
  const [showPaywall,setShowPaywall] = useState(false);
  const [isPro,setIsPro] = useState(()=>_meta.pro||_u.pro||false);
  const [usageLeft,setUsageLeft] = useState(()=>getUsageLeft(_meta.weekStart?_meta:_u));
  const fileRef = useRef();

  useEffect(()=>{
    if(result?.score){let i=0;const iv=setInterval(()=>{i+=2;setAnimScore(Math.min(i,result.score));if(i>=result.score)clearInterval(iv);},18);return()=>clearInterval(iv);}
  },[result]);

  // Initialize RevenueCat and verify pro status against Apple on every launch
  useEffect(()=>{
    async function syncProStatus(){
      await initPurchases(user.email);
      if(!isNative()) return; // on web, trust localStorage for testing
      const rcPro = await checkProStatus();
      if(rcPro && !isPro){
        // Apple says they're Pro but localStorage doesn't reflect it (e.g. reinstall)
        setPro(user.email); setIsPro(true); setUsageLeft(999);
      } else if(!rcPro && isPro){
        // Subscription lapsed or was cancelled — revoke pro
        const u=getUserData(user.email); if(u) setUserData(user.email,{...u,pro:false});
        setIsPro(false); setUsageLeft(getUsageLeft(user.email));
      }
    }
    syncProStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{ scheduleNotifications(user.email); },[]);

  useEffect(()=>{
    setUsageLeft(getUsageLeft(user.email));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tab]);

  const handleFile = useCallback(async file=>{
    if(!file?.type.startsWith("image/")) return;
    const MAX=1024;
    // createImageBitmap decodes off the main thread (async)
    const bitmap = await createImageBitmap(file);
    let w=bitmap.width, h=bitmap.height;
    if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
    const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
    canvas.getContext("2d").drawImage(bitmap,0,0,w,h);
    bitmap.close(); // free compositor memory
    // canvas.toBlob is async — JPEG encoding doesn't block the main thread
    const blob = await new Promise(res=>canvas.toBlob(res,"image/jpeg",0.85));
    const b64 = await new Promise(res=>{
      const fr=new FileReader(); fr.onload=e=>res(e.target.result.split(",")[1]); fr.readAsDataURL(blob);
    });
    setImageMime("image/jpeg");
    setImageB64(b64);
  },[]);

  const handleUploadClick = ()=>{ if(usageLeft<=0){setShowPaywall(true);return;} fileRef.current?.click(); };

  const analyze = async()=>{
    if(!imageB64) return;
    if(usageLeft<=0){setShowPaywall(true);return;}
    setScreen("analyzing");
    try {
      const prompt = `You are a hype-man fashion stylist who loves real people's style. Rate this outfit 0-100. You know ALL modern aesthetics: streetwear, old money, clean girl, Y2K, quiet luxury, techwear, athleisure, and more.

SCORING — be generous, people worked hard on their look:
- 90-100: Exceptional. Cohesive, intentional, memorable. Reserve for truly great execution.
- 80-89: Really good. Well put-together, clear aesthetic, confident.
- 72-79: Solid look. Good foundation, minor things could be tweaked.
- 65-71: Decent. Pieces work, just needs a bit more intention.
- Below 65: ONLY if there are obvious visible coordination issues.

RULES (strictly follow):
- ANY clean, effort-showing outfit starts at 75 minimum
- Intentional streetwear, minimalist, or athleisure = 78+ minimum
- Neutral color story (black/white/navy/grey/beige/cream) = color score 21+/25
- Good silhouette or proportional fit = fit score 21+/25
- Accessories present = automatic +3 points
- Matching shoes to vibe = automatic +2 points
- Layering done well = automatic +3 points
- NEVER give below 65 unless there are actual clashing colors or broken proportions visible
- Hype them up in the verdict — be the supportive friend who also keeps it real
- vibe: 3-5 punchy words capturing the exact aesthetic, e.g. "Dark Academia Clean Edge"

Analyze the "${occasion}" outfit. Reply ONLY with valid JSON, no markdown:
{"score":82,"breakdown":{"fit":22,"color":21,"style":20,"occasion":19},"vibe":"Clean Quiet Luxury","verdict":"Intentional neutral palette doing the work here. The proportions are well-balanced and the color story is cohesive — you clearly have a point of view.","tags":["minimalist","clean","elevated"],"pros":["Strong color cohesion","Proportions are working perfectly"],"cons":["One accessory away from elite tier","Could experiment with texture"],"upgrade":"A simple gold chain or leather belt would take this to a 90+ immediately."}`;
      const response = await window.puter.ai.chat(prompt, `data:image/jpeg;base64,${imageB64}`, {model:"gpt-4o"});
      const text = typeof response==="string" ? response : response?.message?.content || response?.toString() || JSON.stringify(response);
      const match = text.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
      if(!match) throw new Error("no json found in: " + text.slice(0,100));
      const p = JSON.parse(match[0]);
      const todayLabel = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
      const isFirstToday = !(getUserData(user.email)?.history||[]).some(h=>h.date===todayLabel);
      const thumb = await createThumbnail(imageB64);
      const r = {
        score:Math.min(100,Math.max(0,Number(p.score)||75)),
        breakdown:p.breakdown||{fit:18,color:18,style:18,occasion:18},
        vibe:p.vibe||"Mystery Fit", verdict:p.verdict||"Interesting look.",
        tags:Array.isArray(p.tags)?p.tags:["casual"],
        pros:Array.isArray(p.pros)?p.pros:["Solid base"],
        cons:Array.isArray(p.cons)?p.cons:["Needs work"],
        upgrade:p.upgrade||"Try better lighting.",
        occasion, imageB64, thumbnail:thumb
      };
      setResult(r); recordRating(user.email,r); setUsageLeft(getUsageLeft(user.email));
      const u2=getUserData(user.email);
      if((u2?.totalRatings||0)===1&&!store.get("ootd_notif_asked")){store.set("ootd_notif_asked",true);setTimeout(()=>setShowNotifPrompt(true),2000);}
      if(isFirstToday){ const sc=getStreak(user.email); setTimeout(()=>{setNewStreakCount(sc);setShowStreakAnim(true);},1400); }
      setScreen("result"); return;
    } catch(e) { console.log("Puter error:", e.message); }

    // Fallback smart mock - truly random each time
    await new Promise(r=>setTimeout(r, 2200));
    const rand = (min,max) => min + Math.floor(Math.random() * (max-min+1));
    const occasionBonus = {everyday:0,"date night":6,work:4,party:5,gym:3,travel:2}[occasion]||0;
    const baseScore = rand(74,91) + occasionBonus;
    const score = Math.min(98, baseScore);

    const fit = rand(17,24,1);
    const color = rand(16,24,2);
    const style = rand(16,23,3);
    const occ = Math.min(25, score - fit - color - style + rand(13,22,4));
    const breakdown = {fit, color, style, occasion: Math.max(10, occ)};

    const vibes = {
      everyday:["Off-Duty But Make It Fashion","Elevated Basics Energy","Quiet Confidence","Effortlessly Unbothered","Clean Girl Adjacent"],
      "date night":["Intentionally Dangerous","Dinner Table Ready","Romantic Tension","Soft Launch Approved","Main Character Energy"],
      work:["Corporate Baddie","Boardroom to Bar","Quiet Luxury Intern","Desk to Drinks Ready","Professional Menace"],
      party:["Chaotic Good Drip","Room Stopper Attempt","Social Currency Flex","Party Pic Ready","Unhinged in the Best Way"],
      gym:["Functional Drip","Sweaty But Make It Fashion","Athletic Villain","Core Era Activated","Gym Baddie Unlocked"],
      travel:["Airport Fit Checked","Passport Ready","Jet Set Adjacent","Terminal Chic","Carry-On Couture"],
    };
    const vibe = vibes[occasion][rand(0,4,5)];

    const verdicts = [
      `A solid ${occasion} look that plays it safe without being boring. The proportions work and the color story is cohesive — just missing that one element that would make it memorable.`,
      `There's clear intention here. The fit is doing most of the heavy lifting, and it shows. For ${occasion}, this reads well — comfortable enough to not overthink, polished enough to not be invisible.`,
      `This outfit has a point of view, which already puts it ahead of most. The silhouette is the strongest part. A few details are holding it back from being a full send.`,
      `Clean foundation, needs execution. The bones are good — whoever put this together knows the basics. The ${occasion} context works in its favor.`,
    ];
    const verdict = verdicts[rand(0,3,6)];

    const pros = [
      ["Silhouette is doing the work","Color palette is intentional"],
      ["Proportions are well-balanced","Fits the occasion without overthinking"],
      ["Clean and cohesive base","Fabric choices are reading well"],
      ["Strong foundational pieces","The fit isn't fighting itself"],
    ][rand(0,3,7)];

    const cons = [
      ["Accessories are MIA","Shoes need a conversation"],
      ["Missing a focal point","Could push the occasion further"],
      ["Playing it too safe in spots","The top and bottom aren't talking to each other"],
      ["Lacks a signature moment","Layering opportunity being ignored"],
    ][rand(0,3,8)];

    const upgrades = [
      "Add one statement accessory — a watch, chain, or bag — to give the eye somewhere to land.",
      "Swap the shoes for something with more personality. The rest can stay exactly as is.",
      "Try tucking the top halfway to define the waist and break the silhouette intentionally.",
      "A single layer — overshirt, light jacket, or structured cardigan — would take this from good to great.",
      "Experiment with proportion: if the top is relaxed, tighten the bottom and vice versa.",
    ][rand(0,4,9)];

    const tagSets = {
      everyday:[["casual","effortless","basics"],["streetwear","relaxed","clean"],["minimalist","everyday","off-duty"]],
      "date night":[["romantic","intentional","elevated"],["date-ready","polished","soft"],["sultry","curated","evening"]],
      work:[["professional","sharp","business"],["office-ready","clean","structured"],["corporate","minimal","polished"]],
      party:[["bold","festive","statement"],["going-out","vibrant","elevated"],["party-ready","expressive","fun"]],
      gym:[["athletic","functional","sporty"],["activewear","clean","performance"],["gym","fitted","sporty"]],
      travel:[["comfortable","chic","practical"],["airport","effortless","travel"],["casual","smart","mobile"]],
    };
    const tags = (tagSets[occasion]||tagSets.everyday)[rand(0,2,10)];

    const todayLabelFb = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
    const isFirstTodayFb = !(getUserData(user.email)?.history||[]).some(h=>h.date===todayLabelFb);
    const thumbFb = await createThumbnail(imageB64);
    const r = {score, breakdown, vibe, verdict, tags, pros, cons, upgrade:upgrades, occasion, imageB64, thumbnail:thumbFb};
    setResult(r);
    recordRating(user.email, r);
    setUsageLeft(getUsageLeft(user.email));
    const u2 = getUserData(user.email);
    if ((u2?.totalRatings||0)===1 && !store.get("ootd_notif_asked")) {
      store.set("ootd_notif_asked", true);
      setTimeout(()=>setShowNotifPrompt(true), 2000);
    }
    if(isFirstTodayFb){ const sc=getStreak(user.email); setTimeout(()=>{setNewStreakCount(sc);setShowStreakAnim(true);},1400); }
    setScreen("result");
  };

  // Called after RevenueCat confirms a successful purchase
  const handleSubscribe = ()=>{ setPro(user.email); setIsPro(true); setUsageLeft(999); setShowPaywall(false); };
  const reset = ()=>{ setScreen("upload");setImageB64(null);setResult(null);setAnimScore(0);setShowShare(false);setOccasion("everyday");setImageFit("cover"); };
  const handleOnboardDone = ()=>{ setOnboarded(user.email); setShowOnboarding(false); };

  const dColor = dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)";

  return (
    <div style={{height:"100vh",background:T.bg,color:T.text,fontFamily:"'DM Mono',monospace",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes pulse{0%,100%{opacity:0.15;transform:scale(0.85)}50%{opacity:1;transform:scale(1.15)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .fadeUp{animation:fadeUp 0.45s ease forwards}
        .dot{animation:pulse 1.3s ease-in-out infinite}
      `}</style>

      {showOnboarding && <Onboarding onDone={handleOnboardDone} dark={dark}/>}

      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"0 16px"}}>
      {/* Header */}
      <div style={{width:"100%",maxWidth:420,padding:"28px 0 20px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
        <div style={{position:"relative"}}>
          <div style={{fontSize:26,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:800,color:T.text}}>OOTD</div>
          <Squiggle color={dColor} width={60} style={{marginTop:2}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
            <div style={{fontSize:9,color:T.faint,letterSpacing:4,textTransform:"uppercase"}}>AI Outfit Rater</div>
            <div style={{fontSize:9,color:streak>0?"#f0932b":T.faint,letterSpacing:1,fontWeight:streak>0?600:400}}>
              {streak>0?`🔥 ${streak}d streak`:"🔥 0d"}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setShowWeeklyReport(true)} style={{background:"transparent",border:`1px solid ${T.border2}`,borderRadius:20,padding:"5px 10px",fontSize:9,cursor:"pointer",color:T.muted,letterSpacing:1,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
            Weekly
          </button>
          <button onClick={toggleDark} style={{background:dark?"#fff":"#111",border:"none",borderRadius:20,padding:"6px 12px",fontSize:9,cursor:"pointer",color:dark?"#000":"#fff",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
            {dark?"☀":"◑"}
          </button>
          {isPro?<div style={{fontSize:9,color:"#FFD166",letterSpacing:2}}>PRO ✦</div>
            :<div style={{fontSize:9,color:usageLeft>0?T.muted:T.red,letterSpacing:2,textTransform:"uppercase"}}>{usageLeft}/1</div>}
        </div>
      </div>

      <div style={{width:"100%",maxWidth:420}}>

        {/* RATE TAB */}
        {tab==="rate"&&(
          <>
            {screen==="upload"&&(
              <div className="fadeUp">
                <ReEngagementBanner email={user.email} dark={dark} onRate={()=>fileRef.current?.click()}/>
                <p style={{fontSize:9,color:T.faint,letterSpacing:4,textTransform:"uppercase",marginBottom:10}}>Occasion</p>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:20}}>
                  {OCCASIONS.map(o=>(
                    <button key={o} onClick={()=>setOccasion(o)} style={{background:occasion===o?T.pillActive:T.pillBg,color:occasion===o?T.pillActiveText:T.text,border:`1px solid ${occasion===o?T.pillActive:T.pillBorder}`,padding:"7px 16px",borderRadius:20,fontSize:9,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase",transition:"all 0.15s",fontFamily:"'DM Mono',monospace",fontWeight:occasion===o?600:400}}>{o}</button>
                  ))}
                </div>
                {imageB64
                  ?<ImagePreview imageB64={imageB64} imageMime={imageMime} fit={imageFit} setFit={setImageFit} onChangePhoto={()=>fileRef.current?.click()}/>
                  :<div onClick={handleUploadClick} onDrop={e=>{e.preventDefault();if(usageLeft>0)handleFile(e.dataTransfer.files[0]);else setShowPaywall(true);}} onDragOver={e=>e.preventDefault()}
                    style={{border:`2px dashed ${T.uploadBorder}`,borderRadius:20,minHeight:280,cursor:"pointer",background:T.uploadBg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:dark?"none":"inset 0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{textAlign:"center",padding:40}}>
                      <div style={{width:64,height:64,borderRadius:"50%",background:dark?"#fff":"#111",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:`0 4px 24px ${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.15)"}`}}>
                        <span style={{fontSize:26,color:dark?"#000":"#fff"}}>↑</span>
                      </div>
                      <div style={{position:"relative",display:"inline-block"}}>
                        <Star color={dColor} size={14} style={{position:"absolute",top:-18,right:-20}}/>
                        <Star color={dColor} size={10} style={{position:"absolute",top:-8,left:-18}}/>
                        <div style={{fontSize:16,fontFamily:"'Playfair Display',Georgia,serif",marginBottom:4,color:T.text,fontWeight:700}}>Upload your OOTD</div>
                        <Squiggle color={dColor} width={160} style={{margin:"0 auto"}}/>
                      </div>
                      <div style={{fontSize:10,color:T.faint,letterSpacing:2,marginTop:10}}>tap or drag a photo</div>
                    </div>
                  </div>
                }
                <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
                {!imageB64&&(getUserData(user.email)?.totalRatings||0)===0&&(
                  <div style={{marginTop:16,textAlign:"center"}}>
                    <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:14}}>
                      {[["72","everyday"],["88","date night"],["61","work"]].map(([score,label])=>(
                        <div key={label} style={{background:T.card,borderRadius:12,padding:"10px 14px",textAlign:"center",boxShadow:dark?"none":"0 2px 12px rgba(0,0,0,0.1)"}}>
                          <div style={{fontSize:18,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",color:Number(score)>=80?(dark?"#a8ff78":"#2a7a2a"):Number(score)>=60?(dark?"#FFD166":"#a06800"):(dark?"#e05555":"#b83030")}}>{score}</div>
                          <div style={{fontSize:8,color:`${T.cardText}55`,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{fontSize:11,color:T.faint,letterSpacing:1}}>What will yours be?</p>
                  </div>
                )}
                {imageB64&&<button onClick={analyze} style={{width:"100%",background:dark?"#fff":"#111",color:dark?"#000":"#fff",border:"none",borderRadius:14,padding:"16px 0",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",boxShadow:dark?"none":"0 4px 20px rgba(0,0,0,0.15)"}}>Rate My Outfit →</button>}
                <div style={{textAlign:"center",marginTop:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <Star color={dColor} size={12}/><p style={{fontSize:9,color:T.faint,letterSpacing:3,textTransform:"uppercase"}}>Brutal · Honest · Accurate</p><Star color={dColor} size={12}/>
                </div>
              </div>
            )}

            {screen==="analyzing"&&(
              <AnalyzingScreen imageB64={imageB64} imageMime={imageMime} dark={dark}/>
            )}

            {screen==="result"&&result&&(
              <div className="fadeUp">
                {result.error?(
                  <div style={{textAlign:"center",padding:"40px 0"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:`${T.red}22`,border:`1px solid ${T.red}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
                      <span style={{fontSize:20,color:T.red}}>✗</span>
                    </div>
                    <div style={{fontSize:16,fontFamily:"'Playfair Display',Georgia,serif",color:T.text,marginBottom:12}}>Couldn't rate this fit</div>
                    <div style={{fontSize:12,color:T.muted,lineHeight:1.7,maxWidth:300,margin:"0 auto 28px"}}>{result.error}</div>
                    <button onClick={reset} style={{background:T.card,color:T.cardText,border:"none",borderRadius:12,padding:"13px 28px",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",boxShadow:dark?"none":"0 2px 16px rgba(0,0,0,0.12)"}}>Try Again</button>
                  </div>
                ):(
                  <>
                    <div style={{textAlign:"center",paddingBottom:24}}>
                      {imageB64&&<img src={`data:${imageMime};base64,${imageB64}`} alt="" style={{width:70,height:88,objectFit:imageFit,borderRadius:14,border:`2px solid ${T.border2}`,marginBottom:20}}/>}
                      <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
                        <ScoreRing score={animScore} size={150} dark={dark}/>
                        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                          <div style={{fontSize:46,fontWeight:800,color:animScore>=80?"#2d7a2d":animScore>=65?"#b8860b":"#c0392b",lineHeight:1,fontFamily:"'Playfair Display',Georgia,serif"}}>{animScore}</div>
                          <div style={{fontSize:9,color:T.faint,letterSpacing:2}}>/100</div>
                        </div>
                      </div>
                      <div style={{position:"relative",display:"inline-block",marginBottom:8}}>
                        <Star color={dColor} size={13} style={{position:"absolute",top:-16,left:-20}}/>
                        <Star color={dColor} size={9} style={{position:"absolute",top:-10,right:-16}}/>
                        <div style={{fontSize:19,fontFamily:"'Playfair Display',Georgia,serif",color:T.text}}>"{result.vibe}"</div>
                        <Squiggle color={dColor} width={200} style={{margin:"4px auto 0"}}/>
                      </div>
                      <div style={{fontSize:12,color:T.muted,lineHeight:1.7,maxWidth:320,margin:"10px auto 0"}}>{result.verdict}</div>
                    </div>

                    {result.breakdown&&(
                      <div style={{background:"#111",borderRadius:14,padding:18,marginBottom:14}}>
                        <p style={{fontSize:8,color:"rgba(255,255,255,0.65)",letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>Score Breakdown</p>
                        {[["Fit & Silhouette",result.breakdown.fit,25],["Color Coordination",result.breakdown.color,25],["Style Coherence",result.breakdown.style,25],["Occasion Match",result.breakdown.occasion,25]].map(([label,val,max])=>(
                          <div key={label} style={{marginBottom:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <span style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:500}}>{label}</span>
                              <span style={{fontSize:10,color:"#fff",fontWeight:700}}>{val}/{max}</span>
                            </div>
                            <div style={{background:"rgba(255,255,255,0.12)",borderRadius:4,height:4}}>
                              <div style={{background:"#fff",borderRadius:4,height:4,width:`${(val/max)*100}%`,transition:"width 1s ease"}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginBottom:14}}>
                      {result.tags?.map(t=><span key={t} style={{background:T.card,color:T.cardText,fontSize:9,padding:"5px 14px",borderRadius:20,letterSpacing:2,textTransform:"uppercase",fontWeight:600,boxShadow:dark?"none":"0 1px 8px rgba(0,0,0,0.1)"}}>{t}</span>)}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                      <div style={{background:"#111",borderRadius:14,padding:16}}>
                        <p style={{fontSize:8,color:"rgba(255,255,255,0.65)",letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Working ✓</p>
                        {result.pros?.map((p,i)=><p key={i} style={{fontSize:11,color:"#a8ff78",marginBottom:6,lineHeight:1.5}}>{p}</p>)}
                      </div>
                      <div style={{background:"#111",borderRadius:14,padding:16}}>
                        <p style={{fontSize:8,color:"rgba(255,255,255,0.65)",letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fix This ✗</p>
                        {result.cons?.map((c,i)=><p key={i} style={{fontSize:11,color:"rgba(255,255,255,0.85)",marginBottom:6,lineHeight:1.5}}>{c}</p>)}
                      </div>
                    </div>

                    <div style={{background:"#111",borderRadius:14,padding:16,marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                        <p style={{fontSize:8,color:"rgba(255,255,255,0.65)",letterSpacing:3,textTransform:"uppercase"}}>Upgrade Move</p>
                        <Arrow color="rgba(255,255,255,0.4)" style={{width:22,height:22}}/>
                      </div>
                      <p style={{fontSize:12,color:"rgba(255,255,255,0.9)",lineHeight:1.6}}>{result.upgrade}</p>
                    </div>

                    <div style={{display:"flex",gap:10,marginBottom:16}}>
                      <button onClick={async()=>{
                        const r = await nativeShare(result);
                        if(r==="copied") setShareMsg("Link copied!");
                        else if(r) setShareMsg("Shared!");
                        else setShowShare(s=>!s);
                        if(r&&r!==false) setTimeout(()=>setShareMsg(""),2500);
                      }} style={{flex:1,background:dark?"#fff":"#111",color:dark?"#000":"#fff",border:"none",borderRadius:12,padding:"14px 0",fontSize:10,fontWeight:600,cursor:"pointer",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",boxShadow:dark?"none":"0 4px 16px rgba(0,0,0,0.2)"}}>
                        {shareMsg||"↑ Share"}
                      </button>
                      <button onClick={()=>setShowShare(s=>!s)} style={{flex:1,background:"transparent",color:T.text,border:`1px solid ${T.border2}`,borderRadius:12,padding:"14px 0",fontSize:10,cursor:"pointer",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
                        {showShare?"Hide Card":"Share Card"}
                      </button>
                    </div>

                    {showShare&&(
                      <div style={{marginBottom:16}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                          <ZigZag color={dColor} width={48}/>
                          <p style={{fontSize:9,color:T.faint,letterSpacing:3,textTransform:"uppercase"}}>Screenshot & post this</p>
                          <ZigZag color={dColor} width={48}/>
                        </div>
                        <ShareCard result={result} imageB64={imageB64} imageMime={imageMime} fit={imageFit}/>
                        <button onClick={reset} style={{width:"100%",marginTop:12,background:"transparent",color:T.text,border:`1px solid ${T.border2}`,borderRadius:12,padding:"13px 0",fontSize:10,cursor:"pointer",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Rate Another Outfit</button>
                      </div>
                    )}
                    {!showShare&&<button onClick={reset} style={{width:"100%",marginBottom:16,background:"transparent",color:T.text,border:`1px solid ${T.border2}`,borderRadius:12,padding:"13px 0",fontSize:10,cursor:"pointer",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Rate Another Outfit</button>}

                    {!isPro&&(
                      <div style={{background:"rgba(255,209,102,0.08)",border:"1px solid rgba(255,209,102,0.2)",borderRadius:16,padding:22,textAlign:"center"}}>
                        <p style={{fontSize:16,fontFamily:"'Playfair Display',Georgia,serif",marginBottom:6,color:T.text}}>Go Pro ✦</p>
                        <p style={{fontSize:10,color:T.muted,marginBottom:16,lineHeight:1.7}}>Unlimited ratings · Style history<br/>Wardrobe tracker · Trend alerts</p>
                        <button onClick={()=>setShowPaywall(true)} style={{background:"linear-gradient(135deg,#FFD166,#f0932b)",color:"#000",border:"none",borderRadius:10,padding:"11px 30px",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>$7.99 / month</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {tab==="history"&&<HistoryPage email={user.email} dark={dark} onRate={()=>setTab("rate")} isPro={isPro} onUpgrade={()=>setShowPaywall(true)}/>}
        {tab==="profile_tab"&&<StyleProfilePage email={user.email} dark={dark} isPro={isPro} onUpgrade={()=>setShowPaywall(true)}/>}
        {tab==="profile"&&<ProfilePage user={user} onUpgrade={()=>setShowPaywall(true)} isPro={isPro} usageLeft={usageLeft} setAvatar={setAvatar} dark={dark} onDelete={logout} onSignOut={logout} onCancelSub={()=>{removePro(user.email);setIsPro(false);setUsageLeft(getUsageLeft(getMetaData(user.email)||getUserData(user.email)||{}));}}/>}
      </div>

      </div>

      {/* Bottom Nav */}
      <div style={{background:T.navBg,backdropFilter:"blur(20px)",borderTop:`1px solid ${T.navBorder}`,display:"flex",justifyContent:"center",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{display:"flex",width:"100%",maxWidth:420}}>
          {[["rate","✦","Rate"],["history","◈","History"],["profile_tab","◎","Style"],["profile","○","Profile"]].map(([t,icon,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"12px 0",background:"none",border:"none",color:tab===t?T.text:T.faint,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"color 0.15s"}}>
              <span style={{fontSize:16}}>{icon}</span>
              <span style={{fontSize:7,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",fontWeight:tab===t?600:400}}>{label}</span>
              {tab===t&&<div style={{width:16,height:2,background:T.text,borderRadius:1}}/>}
            </button>
          ))}
        </div>
      </div>

      {showPaywall&&<PaywallModal onClose={()=>setShowPaywall(false)} onSubscribe={handleSubscribe}/>}
      {showWeeklyReport&&<WeeklyReport email={user.email} dark={dark} onClose={()=>setShowWeeklyReport(false)}/>}
      {showNotifPrompt&&<NotificationPrompt dark={dark} onDone={()=>setShowNotifPrompt(false)}/>}
      {showStreakAnim&&<StreakAnimation streak={newStreakCount} onDone={()=>setShowStreakAnim(false)}/>}
    </div>
  );
}

export default function Root() {
  const auth = useAuth();
  if (!auth.user) return <AuthScreen onAuth={auth}/>;
  return <App user={auth.user} logout={auth.logout} setPro={auth.setPro} removePro={auth.removePro} setAvatar={auth.setAvatar} setOnboarded={auth.setOnboarded}/>;
}
