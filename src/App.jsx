import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MOODS = ["😄", "😊", "😐", "😔", "😴"];

const today = new Date();
const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
const dateStr = today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

const initDiary = () => DAYS.reduce((a, d) => ({ ...a, [d]: { note: "", mood: "", tasks: [] } }), {});
const initBiz = () => DAYS.reduce((a, d) => ({ ...a, [d]: { revenue: "", sales: "", cogs: "" } }), {});

const OLIVE = "#6b7c4a";
const OLIVE_LIGHT = "#e8edd8";
const OLIVE_MID = "#9aaa70";
const WHITE = "#ffffff";
const TEXT = "#3a3a2e";
const MUTED = "#8a9070";
const RED = "#c0392b";
const GREEN = "#4a7c59";
const AMBER = "#c47c00";

const fmtMoney = v => { const n = parseFloat(v); if (isNaN(n)) return "—"; return `$${(Math.ceil(n * 100) / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; };
const fmtPct = v => { const n = parseFloat(v); if (isNaN(n)) return "—"; return `${(n <= 1 ? n * 100 : n).toFixed(1)}%`; };
const num = v => parseFloat(v) || 0;
const cogsColor = v => { const n = parseFloat(v) * (parseFloat(v) <= 1 ? 100 : 1); if (isNaN(n)) return MUTED; if (n <= 30) return GREEN; if (n <= 35) return AMBER; return RED; };
const gpColor = v => { const n = parseFloat(v) * (parseFloat(v) <= 1 ? 100 : 1); if (isNaN(n)) return MUTED; if (n >= 70) return GREEN; if (n >= 65) return AMBER; return RED; };
const findColIdx = (headers, keys) => { const h = headers.map(x => (x || "").toString().toLowerCase().trim()); for (const k of keys) { const i = h.findIndex(x => x.includes(k)); if (i !== -1) return i; } return -1; };

const STORAGE_KEYS = { diary: "uk_diary", biz: "uk_biz", recipes: "uk_recipes" };

const saveToStorage = async (key, value) => {
  try { await window.storage.set(key, JSON.stringify(value)); } catch (e) { console.error("Save failed:", e); }
};
const loadFromStorage = async (key, fallback) => {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fallback; } catch { return fallback; }
};

export default function App() {
  const [diary, setDiaryRaw] = useState(initDiary());
  const [biz, setBizRaw] = useState(initBiz());
  const [recipes, setRecipesRaw] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(todayIdx);
  const [view, setView] = useState("today");
  const [taskInput, setTaskInput] = useState("");
  const [csvError, setCsvError] = useState("");
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [foodError, setFoodError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const bizFileRef = useRef();
  const foodFileRef = useRef();

  // Load all data on mount
  useEffect(() => {
    (async () => {
      const d = await loadFromStorage(STORAGE_KEYS.diary, initDiary());
      const b = await loadFromStorage(STORAGE_KEYS.biz, initBiz());
      const r = await loadFromStorage(STORAGE_KEYS.recipes, []);
      setDiaryRaw(d);
      setBizRaw(b);
      setRecipesRaw(r);
      setLoaded(true);
    })();
  }, []);

  const showSaved = () => { setSaveStatus("Saved ✓"); setTimeout(() => setSaveStatus(""), 2000); };

  const setDiary = fn => setDiaryRaw(prev => { const next = typeof fn === "function" ? fn(prev) : fn; saveToStorage(STORAGE_KEYS.diary, next).then(showSaved); return next; });
  const setBiz = fn => setBizRaw(prev => { const next = typeof fn === "function" ? fn(prev) : fn; saveToStorage(STORAGE_KEYS.biz, next).then(showSaved); return next; });
  const setRecipes = fn => setRecipesRaw(prev => { const next = typeof fn === "function" ? fn(prev) : fn; saveToStorage(STORAGE_KEYS.recipes, next).then(showSaved); return next; });

  const day = DAYS[selected];
  const entry = diary[day];
  const todayEntry = diary[DAYS[todayIdx]];
  const todayBiz = biz[DAYS[todayIdx]];

  const updateNote = v => setDiary(p => ({ ...p, [day]: { ...p[day], note: v } }));
  const updateMood = v => setDiary(p => ({ ...p, [day]: { ...p[day], mood: entry.mood === v ? "" : v } }));
  const addTask = () => { if (!taskInput.trim()) return; setDiary(p => ({ ...p, [day]: { ...p[day], tasks: [...p[day].tasks, { text: taskInput.trim(), done: false }] } })); setTaskInput(""); };
  const toggleTask = (d, i) => { const tasks = diary[d].tasks.map((t, idx) => idx === i ? { ...t, done: !t.done } : t); setDiary(p => ({ ...p, [d]: { ...p[d], tasks } })); };
  const deleteTask = i => setDiary(p => ({ ...p, [day]: { ...p[day], tasks: entry.tasks.filter((_, idx) => idx !== i) } }));
  const updateBiz = (d, k, v) => setBiz(p => ({ ...p, [d]: { ...p[d], [k]: v } }));

  const weekRevenue = DAYS.reduce((s, d) => s + num(biz[d].revenue), 0);
  const weekSales = DAYS.reduce((s, d) => s + num(biz[d].sales), 0);
  const weekCogs = DAYS.reduce((s, d) => s + num(biz[d].cogs), 0);
  const weekProfit = weekRevenue - weekCogs;
  const weekMargin = weekRevenue > 0 ? (weekProfit / weekRevenue * 100).toFixed(1) : 0;
  const upcomingTasks = DAYS.slice(todayIdx + 1).map(d => ({ d, tasks: diary[d].tasks.filter(t => !t.done) })).filter(x => x.tasks.length > 0);

  const handleBizCSV = e => {
    const file = e.target.files[0]; if (!file) return; setCsvError("");
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const lines = ev.target.result.trim().split("\n").map(l => l.split(",").map(c => c.trim().replace(/"/g, "")));
        const headers = lines[0].map(h => h.toLowerCase());
        const dayCol = headers.findIndex(h => h.includes("day"));
        const revCol = headers.findIndex(h => h.includes("rev") || h.includes("sales") || h.includes("income"));
        const cogsCol = headers.findIndex(h => h.includes("cog") || h.includes("cost"));
        const txnCol = headers.findIndex(h => h.includes("txn") || h.includes("transaction") || h.includes("count"));
        if (dayCol === -1 || revCol === -1) { setCsvError("CSV needs at least a 'Day' and 'Revenue' column."); return; }
        const updated = { ...biz };
        lines.slice(1).forEach(row => { const d = DAYS.find(day => day.toLowerCase().startsWith(row[dayCol]?.toLowerCase().slice(0, 3))); if (d) updated[d] = { revenue: row[revCol]?.replace(/[$,]/g, "") || updated[d].revenue, cogs: cogsCol > -1 ? row[cogsCol]?.replace(/[$,]/g, "") || updated[d].cogs : updated[d].cogs, sales: txnCol > -1 ? row[txnCol] || updated[d].sales : updated[d].sales }; });
        setBiz(updated);
      } catch { setCsvError("Couldn't parse CSV."); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const handleFoodExcel = e => {
    const file = e.target.files[0]; if (!file) return; setFoodError("");
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const loaded = [];
        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          if (rows.length < 2) return;
          let headerIdx = 0, bestScore = 0;
          for (let i = 0; i < Math.min(15, rows.length); i++) {
            const r = rows[i].map(x => (x || "").toString().toLowerCase().trim());
            const score = r.filter(c => c.length > 1 && ["recipe","cost","sell","gp","portion","cogs","price","measure","ingredient","quantity","unit","actual","serve"].some(k => c.includes(k))).length;
            if (score > bestScore) { bestScore = score; headerIdx = i; }
          }
          const maxCols = Math.max(...rows.map(r => r.length));
          const headers = Array.from({ length: maxCols }, (_, i) => (rows[headerIdx][i] ?? "").toString().trim());
          const ingredients = rows.slice(headerIdx + 1).filter(r => r.some(c => c !== "" && c !== null)).map(r => Array.from({ length: maxCols }, (_, i) => (r[i] ?? "").toString()));
          const summaryFields = { totalCost: findColIdx(headers, ["total cost"]), costPerServe: findColIdx(headers, ["cost per serve", "cost per serving"]), sellPrice: findColIdx(headers, ["selling price per serve", "sell price per serve"]), sellExGst: findColIdx(headers, ["ex gst"]), cogs: findColIdx(headers, ["cogs"]), gp: findColIdx(headers, ["gp"]), portions: findColIdx(headers, ["portions per recipe"]) };
          const lastRow = ingredients.length > 0 ? ingredients[ingredients.length - 1] : [];
          const summary = {};
          Object.entries(summaryFields).forEach(([k, idx]) => { summary[k] = idx !== -1 ? lastRow[idx] || "" : ""; });
          if (ingredients.length > 0) loaded.push({ name, headers, ingredients, summary, summaryFields });
        });
        if (loaded.length === 0) { setFoodError("No recipe data found."); return; }
        setRecipes(loaded); setExpandedRecipe(null);
      } catch (err) { setFoodError("Couldn't read Excel file: " + err.message); }
    };
    reader.readAsArrayBuffer(file); e.target.value = "";
  };

  const recalcSummary = (recipe, updatedIngredients) => {
    const { summaryFields: sf, headers } = recipe;
    const hLow = headers.map(h => h.toLowerCase());

    // Find cost and portion columns
    const costColIdx = findColIdx(headers, ["total cost", "cost"]);
    const portionColIdx = findColIdx(headers, ["portions per recipe", "portions per"]);
    const sellColIdx = sf.sellPrice !== -1 ? sf.sellPrice : findColIdx(headers, ["selling price per serve", "sell price"]);
    const exGstColIdx = sf.sellExGst !== -1 ? sf.sellExGst : findColIdx(headers, ["ex gst"]);

    // Sum total cost from all ingredient rows
    const totalCost = updatedIngredients.reduce((sum, row) => {
      const val = parseFloat((row[costColIdx] || "").toString().replace(/[$,]/g, ""));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    // Get portions from last row or summary
    const portions = parseFloat(recipe.summary.portions) || 1;

    // Recalculate
    const costPerServe = portions > 0 ? totalCost / portions : 0;
    const sellPrice = parseFloat(recipe.summary.sellPrice) || 0;
    const sellExGst = sellPrice > 0 ? sellPrice / 1.1 : 0;
    const cogs = sellPrice > 0 ? (costPerServe / sellPrice) * 100 : 0;
    const gp = 100 - cogs;

    return {
      ...recipe.summary,
      totalCost: totalCost.toFixed(4),
      costPerServe: costPerServe.toFixed(4),
      sellExGst: sellExGst.toFixed(2),
      cogs: cogs.toFixed(2),
      gp: gp.toFixed(2),
    };
  };

  const updateIngredientCell = (ri, rowIdx, colIdx, val) => setRecipes(p => p.map((r, i) => {
    if (i !== ri) return r;
    const updatedIngredients = r.ingredients.map((row, ii) => ii !== rowIdx ? row : row.map((c, ci) => ci === colIdx ? val : c));
    const updatedSummary = recalcSummary({ ...r, ingredients: updatedIngredients }, updatedIngredients);
    return { ...r, ingredients: updatedIngredients, summary: updatedSummary };
  }));

  const updateSummary = (ri, key, val) => setRecipes(p => p.map((r, i) => {
    if (i !== ri) return r;
    const updatedSummary = { ...r.summary, [key]: val };
    // Recalc when sell price or portions change
    if (key === "sellPrice" || key === "portions") {
      const recalc = recalcSummary({ ...r, summary: updatedSummary }, r.ingredients);
      return { ...r, summary: { ...recalc, [key]: val } };
    }
    return { ...r, summary: updatedSummary };
  }));
  const addIngredientRow = ri => setRecipes(p => p.map((r, i) => i !== ri ? r : { ...r, ingredients: [...r.ingredients, Array(r.headers.length).fill("")] }));
  const deleteIngredientRow = (ri, rowIdx) => setRecipes(p => p.map((r, i) => i !== ri ? r : { ...r, ingredients: r.ingredients.filter((_, ii) => ii !== rowIdx) }));
  const addBlankRecipe = () => {
    const headers = ["Ingredient", "Measure", "Qty", "Cost", "Actual", "Portions", "Total Cost", "Cost/Serve", "Sell Price", "Ex GST", "COGS %", "GP %"];
    setRecipes(p => [...p, { name: "New Recipe", headers, ingredients: [Array(headers.length).fill("")], summary: { totalCost: "", costPerServe: "", sellPrice: "", sellExGst: "", cogs: "", gp: "", portions: "" }, summaryFields: { totalCost: 6, costPerServe: 7, sellPrice: 8, sellExGst: 9, cogs: 10, gp: 11 } }]);
    setExpandedRecipe(recipes.length);
  };

  const exportData = () => {
    const data = { diary, biz, recipes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "urban-kitchen-diary.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.diary) setDiary(data.diary);
        if (data.biz) setBiz(data.biz);
        if (data.recipes) setRecipes(data.recipes);
      } catch { alert("Couldn't read backup file."); }
    };
    reader.readAsText(file); e.target.value = "";
  };
  const importRef = useRef();

  const navItems = [{ id: "today", label: "Today", icon: "☀️" }, { id: "business", label: "Business", icon: "📊" }, { id: "food", label: "Food Cost", icon: "🍽️" }, { id: "week", label: "Week", icon: "📅" }, { id: "day", label: "Day", icon: "📝" }];
  const StatCard = ({ label, value, color }) => (<div style={{ background: WHITE, borderRadius: 10, padding: "14px 16px", flex: 1, minWidth: 90 }}><div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>{label}</div><div style={{ fontSize: 18, fontWeight: "bold", color: color || OLIVE }}>{value}</div></div>);
  const BizInput = ({ label, field, d }) => (<div style={{ flex: 1 }}><div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{label}</div><div style={{ position: "relative" }}>{field !== "sales" && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: 13 }}>$</span>}<input type="number" min="0" value={biz[d][field]} onChange={e => updateBiz(d, field, e.target.value)} placeholder="0" style={{ width: "100%", padding: field !== "sales" ? "8px 8px 8px 22px" : "8px 10px", borderRadius: 7, border: `1px solid ${OLIVE_LIGHT}`, background: OLIVE_LIGHT, fontFamily: "Georgia, serif", fontSize: 13, color: TEXT, outline: "none", boxSizing: "border-box" }} /></div></div>);

  if (!loaded) return <div style={{ minHeight: "100vh", background: OLIVE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: OLIVE, fontSize: 16 }}>☕ Loading your diary…</div>;

  return (
    <div style={{ minHeight: "100vh", background: OLIVE_LIGHT, fontFamily: "Georgia, serif", color: TEXT, display: "flex", flexDirection: "column" }}>
      <div style={{ background: OLIVE, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: WHITE, fontSize: 17 }}>☕ Weekly Diary</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveStatus && <div style={{ color: "#d4e0b8", fontSize: 12 }}>{saveStatus}</div>}
          <div style={{ color: "#d4e0b8", fontSize: 12 }}>{dateStr}</div>
        </div>
      </div>

      <div style={{ background: WHITE, display: "flex", borderBottom: `1px solid ${OLIVE_LIGHT}`, overflowX: "auto" }}>
        {navItems.map(n => (<button key={n.id} onClick={() => { setView(n.id); if (n.id === "day") setSelected(todayIdx); }} style={{ flex: 1, padding: "10px 6px", border: "none", background: "transparent", borderBottom: view === n.id ? `2px solid ${OLIVE}` : "2px solid transparent", color: view === n.id ? OLIVE : MUTED, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11, whiteSpace: "nowrap" }}>{n.icon} {n.label}</button>))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>

        {/* TODAY */}
        {view === "today" && (
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <h2 style={{ color: OLIVE, fontWeight: "normal", fontSize: 20, marginBottom: 4 }}>Good morning! 👋</h2>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 0, marginBottom: 20 }}>Here's what's on for {DAYS[todayIdx]}.</p>
            <div style={{ background: WHITE, borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 10 }}>HOW ARE YOU FEELING?</div>
              <div style={{ display: "flex", gap: 10 }}>{MOODS.map(m => (<button key={m} onClick={() => setDiary(p => ({ ...p, [DAYS[todayIdx]]: { ...p[DAYS[todayIdx]], mood: todayEntry.mood === m ? "" : m } }))} style={{ fontSize: 22, background: todayEntry.mood === m ? OLIVE_LIGHT : "transparent", border: `1px solid ${todayEntry.mood === m ? OLIVE : OLIVE_LIGHT}`, borderRadius: 8, width: 42, height: 42, cursor: "pointer" }}>{m}</button>))}</div>
            </div>
            <div style={{ background: WHITE, borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 12 }}>TODAY'S BUSINESS SNAPSHOT</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatCard label="REVENUE" value={fmtMoney(todayBiz.revenue)} />
                <StatCard label="COGS" value={fmtMoney(todayBiz.cogs)} />
                <StatCard label="PROFIT" value={num(todayBiz.revenue) > 0 ? fmtMoney(num(todayBiz.revenue) - num(todayBiz.cogs)) : "—"} color={num(todayBiz.revenue) - num(todayBiz.cogs) >= 0 ? GREEN : RED} />
                <StatCard label="MARGIN" value={num(todayBiz.revenue) > 0 ? `${((num(todayBiz.revenue) - num(todayBiz.cogs)) / num(todayBiz.revenue) * 100).toFixed(1)}%` : "—"} color={OLIVE} />
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: MUTED }}>{todayBiz.sales ? `${todayBiz.sales} transactions` : "No transactions entered"} · <span style={{ color: OLIVE, cursor: "pointer" }} onClick={() => setView("business")}>Update →</span></div>
            </div>
            <div style={{ background: WHITE, borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 12 }}>TODAY'S TASKS</div>
              {todayEntry.tasks.length === 0 ? <div style={{ color: MUTED, fontSize: 13 }}>No tasks yet — <span style={{ color: OLIVE, cursor: "pointer" }} onClick={() => { setSelected(todayIdx); setView("day"); }}>add some</span>.</div>
                : todayEntry.tasks.map((t, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i > 0 ? `1px solid ${OLIVE_LIGHT}` : "none" }}><input type="checkbox" checked={t.done} onChange={() => toggleTask(DAYS[todayIdx], i)} style={{ width: 17, height: 17, accentColor: OLIVE, cursor: "pointer" }} /><span style={{ fontSize: 14, textDecoration: t.done ? "line-through" : "none", color: t.done ? MUTED : TEXT }}>{t.text}</span></div>))}
              {todayEntry.tasks.length > 0 && <div style={{ marginTop: 10 }}><div style={{ height: 3, background: OLIVE_LIGHT, borderRadius: 2 }}><div style={{ height: 3, borderRadius: 2, background: OLIVE, width: `${(todayEntry.tasks.filter(t => t.done).length / todayEntry.tasks.length) * 100}%`, transition: "width 0.3s" }} /></div><div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{todayEntry.tasks.filter(t => t.done).length} of {todayEntry.tasks.length} done</div></div>}
            </div>
            <div style={{ background: WHITE, borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 10 }}>TODAY'S NOTE</div>
              <textarea value={todayEntry.note} onChange={e => setDiary(p => ({ ...p, [DAYS[todayIdx]]: { ...p[DAYS[todayIdx]], note: e.target.value } }))} placeholder="Jot something down…" style={{ width: "100%", minHeight: 80, border: "none", background: "transparent", fontFamily: "Georgia, serif", fontSize: 14, color: TEXT, resize: "none", outline: "none", lineHeight: 1.8, boxSizing: "border-box" }} />
            </div>
            {upcomingTasks.length > 0 && <div style={{ background: WHITE, borderRadius: 10, padding: 16 }}><div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 12 }}>COMING UP THIS WEEK</div>{upcomingTasks.map(({ d, tasks }) => (<div key={d} style={{ marginBottom: 10 }}><div style={{ fontSize: 12, color: OLIVE, fontWeight: "bold", marginBottom: 4 }}>{d}</div>{tasks.map((t, i) => <div key={i} style={{ fontSize: 13, color: TEXT, padding: "3px 0 3px 10px", borderLeft: `2px solid ${OLIVE_LIGHT}` }}>{t.text}</div>)}</div>))}</div>}

            {/* Backup */}
            <div style={{ background: WHITE, borderRadius: 10, padding: 16, marginTop: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 12 }}>BACKUP & RESTORE</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={exportData} style={{ flex: 1, background: OLIVE_LIGHT, color: OLIVE, border: `1px solid ${OLIVE_MID}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}>⬇ Export Backup</button>
                <button onClick={() => importRef.current.click()} style={{ flex: 1, background: OLIVE_LIGHT, color: OLIVE, border: `1px solid ${OLIVE_MID}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}>⬆ Restore Backup</button>
                <input ref={importRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>Your data saves automatically. Use Export to back it up or transfer to another device.</div>
            </div>
          </div>
        )}

        {/* BUSINESS */}
        {view === "business" && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ color: OLIVE, fontWeight: "normal", fontSize: 20, marginBottom: 4 }}>Business Dashboard</h2>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 0, marginBottom: 18 }}>Track daily revenue, sales and COGS.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <StatCard label="WEEK REVENUE" value={fmtMoney(weekRevenue)} />
              <StatCard label="WEEK COGS" value={fmtMoney(weekCogs)} />
              <StatCard label="GROSS PROFIT" value={fmtMoney(weekProfit)} color={weekProfit >= 0 ? GREEN : RED} />
              <StatCard label="MARGIN" value={`${weekMargin}%`} color={parseFloat(weekMargin) >= 50 ? GREEN : parseFloat(weekMargin) >= 30 ? OLIVE : RED} />
            </div>
            {weekSales > 0 && <div style={{ fontSize: 13, color: MUTED, marginBottom: 18 }}>Total transactions: <strong style={{ color: TEXT }}>{weekSales}</strong> · Avg sale: <strong style={{ color: TEXT }}>{weekRevenue > 0 ? fmtMoney(weekRevenue / weekSales) : "—"}</strong></div>}
            <div style={{ background: WHITE, borderRadius: 10, padding: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 10 }}>IMPORT FROM CSV</div>
              <button onClick={() => bizFileRef.current.click()} style={{ background: OLIVE_LIGHT, color: OLIVE, border: `1px solid ${OLIVE}`, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>📂 Upload CSV</button>
              <input ref={bizFileRef} type="file" accept=".csv" onChange={handleBizCSV} style={{ display: "none" }} />
              {csvError && <div style={{ color: RED, fontSize: 12, marginTop: 8 }}>{csvError}</div>}
            </div>
            <div style={{ background: WHITE, borderRadius: 10, padding: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 14 }}>DAILY ENTRY</div>
              {DAYS.map((d, i) => { const b = biz[d]; const profit = num(b.revenue) - num(b.cogs); const margin = num(b.revenue) > 0 ? (profit / num(b.revenue) * 100).toFixed(1) : null; return (
                <div key={d} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < 6 ? `1px solid ${OLIVE_LIGHT}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 14, color: i === todayIdx ? OLIVE : TEXT, fontWeight: i === todayIdx ? "bold" : "normal" }}>{d}{i === todayIdx ? " · Today" : ""}</div>
                    {margin && <div style={{ fontSize: 12, color: profit >= 0 ? GREEN : RED }}>{margin}% margin</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}><BizInput label="Revenue" field="revenue" d={d} /><BizInput label="COGS" field="cogs" d={d} /><BizInput label="Transactions" field="sales" d={d} /></div>
                  {num(b.revenue) > 0 && <div style={{ marginTop: 8, fontSize: 12, color: MUTED }}>Gross profit: <strong style={{ color: profit >= 0 ? GREEN : RED }}>{fmtMoney(profit)}</strong>{b.sales ? ` · Avg sale: ${fmtMoney(num(b.revenue) / num(b.sales))}` : ""}</div>}
                </div>);})}
            </div>
            <div style={{ background: WHITE, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 14 }}>WEEKLY COGS REPORT</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `2px solid ${OLIVE_LIGHT}` }}>{["Day","Revenue","COGS","Profit","Margin"].map(h => <th key={h} style={{ textAlign: h==="Day"?"left":"right", padding: "6px 4px", color: MUTED, fontWeight: "normal", fontSize: 11 }}>{h.toUpperCase()}</th>)}</tr></thead>
                <tbody>
                  {DAYS.map((d, i) => { const b=biz[d]; const profit=num(b.revenue)-num(b.cogs); const margin=num(b.revenue)>0?(profit/num(b.revenue)*100).toFixed(1)+"%":"—"; return (<tr key={d} style={{ borderBottom:`1px solid ${OLIVE_LIGHT}`, background:i===todayIdx?OLIVE_LIGHT:"transparent" }}><td style={{ padding:"8px 4px", color:i===todayIdx?OLIVE:TEXT, fontWeight:i===todayIdx?"bold":"normal" }}>{SHORT[i]}</td><td style={{ padding:"8px 4px", textAlign:"right" }}>{fmtMoney(b.revenue)}</td><td style={{ padding:"8px 4px", textAlign:"right" }}>{fmtMoney(b.cogs)}</td><td style={{ padding:"8px 4px", textAlign:"right", color:num(b.revenue)>0?(profit>=0?GREEN:RED):MUTED }}>{num(b.revenue)>0?fmtMoney(profit):"—"}</td><td style={{ padding:"8px 4px", textAlign:"right", color:num(b.revenue)>0?(parseFloat(margin)>=30?GREEN:RED):MUTED }}>{margin}</td></tr>);})}
                  <tr style={{ borderTop:`2px solid ${OLIVE}` }}><td style={{ padding:"8px 4px", fontWeight:"bold", color:OLIVE }}>Total</td><td style={{ padding:"8px 4px", textAlign:"right", fontWeight:"bold" }}>{fmtMoney(weekRevenue)}</td><td style={{ padding:"8px 4px", textAlign:"right", fontWeight:"bold" }}>{fmtMoney(weekCogs)}</td><td style={{ padding:"8px 4px", textAlign:"right", fontWeight:"bold", color:weekProfit>=0?GREEN:RED }}>{fmtMoney(weekProfit)}</td><td style={{ padding:"8px 4px", textAlign:"right", fontWeight:"bold", color:parseFloat(weekMargin)>=30?GREEN:RED }}>{weekMargin}%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FOOD COST */}
        {view === "food" && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ color: OLIVE, fontWeight: "normal", fontSize: 20, marginBottom: 4 }}>Food Cost Calculator</h2>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 0, marginBottom: 18 }}>Each Excel tab becomes its own recipe card.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <button onClick={() => foodFileRef.current.click()} style={{ background: OLIVE, color: WHITE, border: "none", borderRadius: 7, padding: "10px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>📂 Upload Excel File</button>
              <button onClick={addBlankRecipe} style={{ background: WHITE, color: OLIVE, border: `1px solid ${OLIVE}`, borderRadius: 7, padding: "10px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ New Recipe</button>
              <input ref={foodFileRef} type="file" accept=".xlsx,.xlsm,.xls" onChange={handleFoodExcel} style={{ display: "none" }} />
            </div>
            {foodError && <div style={{ color: RED, fontSize: 12, marginBottom: 14 }}>{foodError}</div>}
            {recipes.length > 0 && expandedRecipe === null && <div style={{ color: GREEN, fontSize: 12, marginBottom: 18 }}>✓ {recipes.length} recipe{recipes.length > 1 ? "s" : ""} saved</div>}

            {expandedRecipe === null ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {recipes.map((r, ri) => (
                  <div key={ri} onClick={() => setExpandedRecipe(ri)} style={{ background: WHITE, borderRadius: 12, padding: 20, border: `1px solid ${OLIVE_LIGHT}`, cursor: "pointer", position: "relative" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(107,124,74,0.15)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <button onClick={ev => { ev.stopPropagation(); setRecipes(p => p.filter((_, i) => i !== ri)); }} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: OLIVE_LIGHT, cursor: "pointer", fontSize: 18 }}>×</button>
                    <div style={{ fontSize: 16, fontWeight: "bold", color: OLIVE, marginBottom: 14, paddingRight: 20 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>{r.ingredients.length} ingredient{r.ingredients.length !== 1 ? "s" : ""}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${OLIVE_LIGHT}` }}>
                      <div><div style={{ fontSize: 10, color: MUTED }}>COST/SERVE</div><div style={{ fontSize: 14, color: TEXT, fontWeight: "bold" }}>{r.summary.costPerServe ? fmtMoney(r.summary.costPerServe) : "—"}</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: MUTED }}>SELL PRICE</div><div style={{ fontSize: 14, color: TEXT, fontWeight: "bold" }}>{r.summary.sellPrice ? fmtMoney(r.summary.sellPrice) : "—"}</div></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                      <div><div style={{ fontSize: 10, color: MUTED }}>COGS %</div><div style={{ fontSize: 14, fontWeight: "bold", color: cogsColor(r.summary.cogs) }}>{r.summary.cogs ? fmtPct(r.summary.cogs) : "—"}</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: MUTED }}>GP %</div><div style={{ fontSize: 14, fontWeight: "bold", color: gpColor(r.summary.gp) }}>{r.summary.gp ? fmtPct(r.summary.gp) : "—"}</div></div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: OLIVE_MID }}>Tap to edit →</div>
                  </div>
                ))}
                {recipes.length === 0 && (<div style={{ gridColumn: "1/-1", background: WHITE, borderRadius: 12, padding: 40, textAlign: "center", color: MUTED }}><div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div><div style={{ fontSize: 15, marginBottom: 6 }}>No recipes yet</div><div style={{ fontSize: 13 }}>Upload your Excel file or create a new recipe.</div></div>)}
              </div>
            ) : (() => {
              const r = recipes[expandedRecipe]; const ri = expandedRecipe;
              return (
                <div style={{ background: WHITE, borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <button onClick={() => setExpandedRecipe(null)} style={{ background: OLIVE_LIGHT, color: OLIVE, border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>← Back</button>
                    <input value={r.name} onChange={e => setRecipes(p => p.map((rec, i) => i !== ri ? rec : { ...rec, name: e.target.value }))}
                      style={{ fontSize: 20, fontWeight: "bold", color: OLIVE, background: "transparent", border: "none", borderBottom: `2px solid ${OLIVE_LIGHT}`, outline: "none", fontFamily: "Georgia, serif", padding: "2px 4px", flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                    {[{ label: "TOTAL COST", key: "totalCost" }, { label: "COST/SERVE", key: "costPerServe" }, { label: "SELL PRICE", key: "sellPrice" }, { label: "SELL EX GST", key: "sellExGst" }, { label: "COGS %", key: "cogs", colorFn: cogsColor }, { label: "GP %", key: "gp", colorFn: gpColor }].map(({ label, key, colorFn }) => (
                      <div key={key} style={{ background: OLIVE_LIGHT, borderRadius: 10, padding: "12px 14px", flex: 1, minWidth: 90 }}>
                        <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                        <input value={r.summary[key]} onChange={e => updateSummary(ri, key, e.target.value)}
                          style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${OLIVE_MID}`, fontFamily: "Georgia, serif", fontSize: 15, fontWeight: "bold", color: colorFn ? colorFn(r.summary[key]) : OLIVE, outline: "none", padding: "2px 0", boxSizing: "border-box" }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 10 }}>INGREDIENTS</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead><tr style={{ background: OLIVE_LIGHT }}>{r.headers.map((h, ci) => (<th key={ci} style={{ padding: "6px 8px", textAlign: ci===0?"left":"right", whiteSpace: "nowrap" }}><input value={h} onChange={e => setRecipes(p => p.map((rec, i) => i!==ri?rec:{ ...rec, headers: rec.headers.map((hh,hi)=>hi===ci?e.target.value:hh) }))} style={{ background: "transparent", border: "none", borderBottom: `1px dashed ${OLIVE_MID}`, fontFamily: "Georgia, serif", fontSize: 11, color: OLIVE, fontWeight: "bold", outline: "none", padding: "2px 4px", width: ci===0?160:75, textAlign: ci===0?"left":"center", boxSizing: "border-box" }} /></th>))}<th style={{ width: 30 }}></th></tr></thead>
                      <tbody>{r.ingredients.map((row, rowIdx) => (<tr key={rowIdx} style={{ borderBottom: `1px solid ${OLIVE_LIGHT}`, background: rowIdx%2===0?"transparent":"#f9fbf5" }}>{row.map((cell, ci) => (<td key={ci} style={{ padding: "2px 4px" }}><input value={cell} onChange={e => updateIngredientCell(ri, rowIdx, ci, e.target.value)} style={{ background: "transparent", border: "none", borderBottom: "1px solid transparent", fontFamily: "Georgia, serif", fontSize: 12, color: ci===0?TEXT:MUTED, outline: "none", padding: "5px 4px", width: ci===0?155:70, textAlign: ci===0?"left":"right", boxSizing: "border-box" }} onFocus={e => e.target.style.borderBottomColor=OLIVE_MID} onBlur={e => e.target.style.borderBottomColor="transparent"} /></td>))}<td style={{ padding:"2px 4px", textAlign:"center" }}><button onClick={() => deleteIngredientRow(ri, rowIdx)} style={{ background:"none", border:"none", color:OLIVE_LIGHT, cursor:"pointer", fontSize:16 }}>×</button></td></tr>))}</tbody>
                    </table>
                  </div>
                  <button onClick={() => addIngredientRow(ri)} style={{ marginTop: 12, background: OLIVE_LIGHT, color: OLIVE, border: `1px solid ${OLIVE_MID}`, borderRadius: 7, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}>+ Add Ingredient</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* WEEK */}
        {view === "week" && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ color: OLIVE, fontWeight: "normal", fontSize: 20, marginBottom: 16 }}>This Week</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DAYS.map((d, i) => { const e=diary[d]; const b=biz[d]; return (<div key={d} onClick={() => { setSelected(i); setView("day"); }} style={{ background:i===todayIdx?OLIVE:WHITE, borderRadius:10, padding:"12px 16px", cursor:"pointer", border:`1px solid ${i===todayIdx?OLIVE:OLIVE_LIGHT}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}><div><div style={{ fontWeight:"bold", fontSize:14, color:i===todayIdx?WHITE:OLIVE }}>{d}{i===todayIdx?" · Today":""}</div><div style={{ fontSize:12, color:i===todayIdx?"#d4e0b8":MUTED, marginTop:2 }}>{e.note?`"${e.note.slice(0,35)}…"`:"No entry"}</div></div><div style={{ textAlign:"right" }}><div style={{ fontSize:13, color:i===todayIdx?WHITE:OLIVE, fontWeight:"bold" }}>{b.revenue?fmtMoney(b.revenue):""}</div><div style={{ fontSize:11, color:i===todayIdx?"#d4e0b8":MUTED }}>{e.mood} {e.tasks.length>0?`${e.tasks.filter(t=>t.done).length}/${e.tasks.length} tasks`:""}</div></div></div>);})}
            </div>
          </div>
        )}

        {/* DAY */}
        {view === "day" && (
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display:"flex", gap:6, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
              {SHORT.map((s,i)=>(<button key={s} onClick={()=>setSelected(i)} style={{ background:selected===i?OLIVE:WHITE, color:selected===i?WHITE:i===todayIdx?OLIVE:TEXT, border:`1px solid ${selected===i?OLIVE:OLIVE_LIGHT}`, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"Georgia, serif", fontSize:13, flexShrink:0, fontWeight:i===todayIdx?"bold":"normal" }}>{s}</button>))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:"normal", color:OLIVE }}>{day}</h2>
              {todayIdx===selected&&<span style={{ background:OLIVE, color:WHITE, borderRadius:12, padding:"2px 10px", fontSize:11 }}>Today</span>}
            </div>
            <div style={{ background:WHITE, borderRadius:10, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:11, color:MUTED, letterSpacing:1, marginBottom:10 }}>MOOD</div>
              <div style={{ display:"flex", gap:10 }}>{MOODS.map(m=>(<button key={m} onClick={()=>updateMood(m)} style={{ fontSize:22, background:entry.mood===m?OLIVE_LIGHT:"transparent", border:`1px solid ${entry.mood===m?OLIVE:OLIVE_LIGHT}`, borderRadius:8, width:42, height:42, cursor:"pointer" }}>{m}</button>))}</div>
            </div>
            <div style={{ background:WHITE, borderRadius:10, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:11, color:MUTED, letterSpacing:1, marginBottom:10 }}>JOURNAL</div>
              <textarea value={entry.note} onChange={e=>updateNote(e.target.value)} placeholder="What's on your mind today?" style={{ width:"100%", minHeight:100, border:"none", background:"transparent", fontFamily:"Georgia, serif", fontSize:14, color:TEXT, resize:"vertical", outline:"none", lineHeight:1.8, boxSizing:"border-box" }} />
            </div>
            <div style={{ background:WHITE, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:11, color:MUTED, letterSpacing:1, marginBottom:12 }}>TASKS</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <input value={taskInput} onChange={e=>setTaskInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Add a task…" style={{ flex:1, padding:"8px 12px", borderRadius:7, border:`1px solid ${OLIVE_LIGHT}`, background:OLIVE_LIGHT, fontFamily:"Georgia, serif", fontSize:13, color:TEXT, outline:"none" }} />
                <button onClick={addTask} style={{ background:OLIVE, color:WHITE, border:"none", borderRadius:7, padding:"8px 16px", cursor:"pointer", fontSize:13 }}>Add</button>
              </div>
              {entry.tasks.length===0&&<div style={{ color:MUTED, fontSize:13 }}>No tasks yet.</div>}
              {entry.tasks.map((t,i)=>(<div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderTop:i>0?`1px solid ${OLIVE_LIGHT}`:"none" }}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(day,i)} style={{ width:16, height:16, accentColor:OLIVE, cursor:"pointer" }} /><span style={{ flex:1, fontSize:14, textDecoration:t.done?"line-through":"none", color:t.done?MUTED:TEXT }}>{t.text}</span><button onClick={()=>deleteTask(i)} style={{ background:"none", border:"none", color:OLIVE_LIGHT, cursor:"pointer", fontSize:18 }}>×</button></div>))}
              {entry.tasks.length>0&&(<div style={{ marginTop:12 }}><div style={{ height:3, background:OLIVE_LIGHT, borderRadius:2 }}><div style={{ height:3, borderRadius:2, background:OLIVE, width:`${(entry.tasks.filter(t=>t.done).length/entry.tasks.length)*100}%`, transition:"width 0.3s" }}/></div><div style={{ fontSize:11, color:MUTED, marginTop:4 }}>{entry.tasks.filter(t=>t.done).length} of {entry.tasks.length} done</div></div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
