import { useState, useRef, useEffect } from "react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MOODS = ["😄","😊","😐","😔","😴"];
const today = new Date();
const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
const dateStr = today.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"});

const OLIVE="#6b7c4a",OLIVE_LIGHT="#e8edd8",OLIVE_MID="#9aaa70",WHITE="#ffffff",TEXT="#3a3a2e",MUTED="#8a9070",RED="#c0392b",GREEN="#4a7c59",AMBER="#c47c00";

const fmtMoney = v => { const n=parseFloat(v); if(isNaN(n)) return "—"; return "$"+(Math.ceil(n*100)/100).toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2}); };
const num = v => parseFloat(v)||0;
const cogsColor = v => { const n=parseFloat(v)*(parseFloat(v)<=1?100:1); if(isNaN(n)) return MUTED; if(n<=30) return GREEN; if(n<=35) return AMBER; return RED; };
const gpColor = v => { const n=parseFloat(v)*(parseFloat(v)<=1?100:1); if(isNaN(n)) return MUTED; if(n>=70) return GREEN; if(n>=65) return AMBER; return RED; };

const initDiary = () => DAYS.reduce((a,d)=>({...a,[d]:{note:"",mood:"",tasks:[]}}),{});
const initBiz = () => DAYS.reduce((a,d)=>({...a,[d]:{revenue:"",sales:"",cogs:""}}),{});

const SK = {diary:"uk_diary",biz:"uk_biz",recipes:"uk_recipes"};
const saveData = async (k,v) => { try { await window.storage.set(k,JSON.stringify(v)); } catch(e){} };
const loadData = async (k,fb) => { try { const r=await window.storage.get(k); return r?JSON.parse(r.value):fb; } catch { return fb; } };

const ING = [
  {name:"Bread Roll",measure:"Box",contentsQty:48,contentsUnit:"Per Bun",unitCost:60.90/48},
  {name:"Eggs",measure:"each",contentsQty:1,contentsUnit:"per each",unitCost:0.29},
  {name:"Cheese Slice",measure:"Pack",contentsQty:90,contentsUnit:"Per Slice",unitCost:15.95/90},
  {name:"Tomato Relish",measure:"Tub",contentsQty:2700,contentsUnit:"Per Gram",unitCost:29.87/2700},
  {name:"Spinach",measure:"kg",contentsQty:1000,contentsUnit:"Per Gram",unitCost:13.50/1000},
  {name:"Bacon",measure:"kg",contentsQty:1000,contentsUnit:"Per Gram",unitCost:12.36/1000},
  {name:"Charcoal Brioche Bun",measure:"Box",contentsQty:65,contentsUnit:"Per Bun",unitCost:92.50/65},
  {name:"Pulled Pork",measure:"kg",contentsQty:1000,contentsUnit:"Per Gram",unitCost:21.12/1000},
  {name:"Slaw Mix",measure:"Bag",contentsQty:300,contentsUnit:"Per Gram",unitCost:3.00/300},
  {name:"House Made BBQ",measure:"kg",contentsQty:1,contentsUnit:"Per Tablespoon",unitCost:0.20},
  {name:"Slaw Dressing",measure:"Tub",contentsQty:2400,contentsUnit:"Per Gram",unitCost:20.33/2400},
  {name:"Flour",measure:"Bag",contentsQty:10000,contentsUnit:"Per Gram",unitCost:11.66/10000},
  {name:"Swiss Cheese",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:0.50},
  {name:"American Cheese",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:0.50},
  {name:"Shredded Cheese",measure:"kg",contentsQty:5000,contentsUnit:"Per Gram",unitCost:57.00/5000},
  {name:"Yogurt",measure:"kg",contentsQty:10000,contentsUnit:"Per Gram",unitCost:41.00/10000},
  {name:"BBQ Sauce",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:20.00/1000},
  {name:"Croissants",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:0.74},
  {name:"Vegan Mayo",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:13.35/1000},
  {name:"Brioche Buns",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.20},
  {name:"Mayo",measure:"kg",contentsQty:15000,contentsUnit:"per gram",unitCost:117.00/15000},
  {name:"Butter",measure:"kg",contentsQty:1500,contentsUnit:"Per Gram",unitCost:23.00/1500},
  {name:"Hollandaise",measure:"kg",contentsQty:1000,contentsUnit:"Per Gram",unitCost:14.10/1000},
  {name:"American Mustard",measure:"kg",contentsQty:2980,contentsUnit:"per gram",unitCost:21.84/2980},
  {name:"Sauerkraut",measure:"kg",contentsQty:2500,contentsUnit:"per gram",unitCost:16.00/2500},
  {name:"Smoked Paprika",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:14.55/1000},
  {name:"Frozen Bananas",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:4.63/1000},
  {name:"Frozen Blueberries",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:11.94/1000},
  {name:"Frozen Mango",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:7.50/1000},
  {name:"Frozen Raspberries",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:9.29/1000},
  {name:"Grated Parmesan",measure:"kg",contentsQty:2000,contentsUnit:"per gram",unitCost:41.00/2000},
  {name:"Chocolate",measure:"kg",contentsQty:15000,contentsUnit:"per gram",unitCost:95.00/15000},
  {name:"Black Peppercorns",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:23.65/1000},
  {name:"Almond Milk",measure:"lt",contentsQty:1000,contentsUnit:"per ml",unitCost:2.92/1000},
  {name:"Oat Milk",measure:"lt",contentsQty:1000,contentsUnit:"per ml",unitCost:2.92/1000},
  {name:"Soy Milk",measure:"lt",contentsQty:1000,contentsUnit:"per ml",unitCost:3.84/1000},
  {name:"Extra Creamy Milk",measure:"lt",contentsQty:2000,contentsUnit:"per ml",unitCost:3.48/2000},
  {name:"Skim Milk",measure:"lt",contentsQty:2000,contentsUnit:"per ml",unitCost:3.28/2000},
  {name:"Lactose Free Milk",measure:"lt",contentsQty:1000,contentsUnit:"per ml",unitCost:3.59/1000},
  {name:"Condensed Milk",measure:"kg",contentsQty:12500,contentsUnit:"per gram",unitCost:90.00/12500},
  {name:"Dark Brown Sugar",measure:"kg",contentsQty:3000,contentsUnit:"per gram",unitCost:15.25/3000},
  {name:"Oats",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:4.11/1000},
  {name:"Desiccated Coconut",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:9.60/1000},
  {name:"Sugar",measure:"kg",contentsQty:25000,contentsUnit:"per gram",unitCost:63.65/25000},
  {name:"White Chocolate",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:17.50/1000},
  {name:"Ground Cinnamon",measure:"kg",contentsQty:600,contentsUnit:"per gram",unitCost:12.90/600},
  {name:"Mediterranean Panini",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.78},
  {name:"Sliced Bread",measure:"slice",contentsQty:1,contentsUnit:"slice",unitCost:0.65},
  {name:"Steakhouse Panini",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.47},
  {name:"Cream",measure:"lt",contentsQty:1000,contentsUnit:"per ml",unitCost:7.49/1000},
  {name:"Tortilla Plain",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:0.52},
  {name:"Avocado",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:3.50},
  {name:"Kiwi",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.20},
  {name:"Strawberries",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:22.00/1000},
  {name:"Cauliflower",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:10.00/1000},
  {name:"Zucchini",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:4.00/1000},
  {name:"Broccoli",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:5.00/1000},
  {name:"Rocket",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:10.00/1000},
  {name:"Tomatoes",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:3.80/1000},
  {name:"Coffee Beans",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:26.00/1000},
  {name:"Mushrooms",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:15.00/1000},
  {name:"Decaf Beans",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:42.00/1000},
  {name:"Chicken Thigh",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:14.00/1000},
  {name:"Chicken Breast",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:14.00/1000},
  {name:"Black Angus Rump",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:16.50/1000},
  {name:"Brisket",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:18.00/1000},
  {name:"Scotch Fillet",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:48.00/1000},
  {name:"Chorizo",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:26.30/1000},
  {name:"Sliced Ham",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:16.00/1000},
  {name:"Sliced Pastrami",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:26.50/1000},
  {name:"Hash Browns",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:0.23},
  {name:"Burger Mince",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:13.50/1000},
  {name:"Piadina",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.75},
  {name:"Plain Bagels",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.50},
  {name:"Everything Bagels",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.70},
  {name:"GF Flour",measure:"kg",contentsQty:12500,contentsUnit:"per gram",unitCost:88.24/12500},
  {name:"Cocoa Powder",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:35.00/1000},
  {name:"Macadamia Milk",measure:"lt",contentsQty:1000,contentsUnit:"per ml",unitCost:4.00/1000},
  {name:"Golden Syrup",measure:"kg",contentsQty:3000,contentsUnit:"per gram",unitCost:35.50/3000},
  {name:"Salted Butter",measure:"kg",contentsQty:500,contentsUnit:"per gram",unitCost:8.20/500},
  {name:"Danish Feta",measure:"kg",contentsQty:16000,contentsUnit:"per gram",unitCost:105.35/16000},
  {name:"Mozzarella",measure:"kg",contentsQty:10000,contentsUnit:"per gram",unitCost:109.00/10000},
  {name:"Haloumi",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:22.69/1000},
  {name:"Vanilla Ice Cream",measure:"kg",contentsQty:10000,contentsUnit:"per gram",unitCost:25.22/10000},
  {name:"Falafel Bites",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:0.72},
  {name:"Hummus",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:13.36/1000},
  {name:"Cream Cheese",measure:"kg",contentsQty:2000,contentsUnit:"per gram",unitCost:25.38/2000},
  {name:"Lemons",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:7.50/1000},
  {name:"Onions",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:2.00/1000},
  {name:"Pickles",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:4.50/1000},
  {name:"Herb Garlic Mayo",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:12.80/1000},
  {name:"Pulled Beef",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:22.50/1000},
  {name:"Chimichurri",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:16.00/1000},
  {name:"Pickled Onions",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:8.00/1000},
  {name:"Baby Cos",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:11.20/1000},
  {name:"Roast Pumpkin",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:5.00/1000},
  {name:"Pistachio Paste",measure:"kg",contentsQty:5000,contentsUnit:"per gram",unitCost:88.00/5000},
  {name:"Chocolate Callebaut",measure:"kg",contentsQty:5000,contentsUnit:"per gram",unitCost:105.00/5000},
  {name:"Ham Hock",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:25.00/1000},
  {name:"Bacon Chorizo Jam",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:35.00/1000},
  {name:"Caramelised Onion Jam",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:20.00/1000},
  {name:"Bechamel",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:9.00/1000},
  {name:"Chocolate Sauce",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:8.91/1000},
  {name:"Carrots",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:1.80/1000},
  {name:"Oil",measure:"lt",contentsQty:1000,contentsUnit:"per gram",unitCost:2.90/1000},
  {name:"House Made Bacon",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:19.50/1000},
  {name:"Potatoes",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:3.50/1000},
  {name:"Red Onions",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:4.95/1000},
  {name:"Garlic",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:17.90/1000},
  {name:"Olive Oil",measure:"lt",contentsQty:4000,contentsUnit:"per ml",unitCost:50.00/4000},
  {name:"Maple Syrup",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:39.80/1000},
  {name:"Honey",measure:"kg",contentsQty:3000,contentsUnit:"per gram",unitCost:35.00/3000},
  {name:"Granola",measure:"kg",contentsQty:4745,contentsUnit:"per gram",unitCost:36.06/4745},
  {name:"Smoked Brisket",measure:"kg",contentsQty:1000,contentsUnit:"per kg",unitCost:35.00/1000},
  {name:"Coke",measure:"each",contentsQty:24,contentsUnit:"each",unitCost:24.95/24},
  {name:"Water",measure:"each",contentsQty:24,contentsUnit:"each",unitCost:11.80/24},
  {name:"Shaved Bacon",measure:"kg",contentsQty:1000,contentsUnit:"per gram",unitCost:17.95/1000},
  {name:"Sourdough Burger Buns",measure:"each",contentsQty:1,contentsUnit:"each",unitCost:1.40},
];

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
  const [ingSearch, setIngSearch] = useState("");
  const [showIngPicker, setShowIngPicker] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [squareData, setSquareData] = useState(null);
  const [squareLoading, setSquareLoading] = useState(false);
  const [squareError, setSquareError] = useState("");
  const [xeroData, setXeroData] = useState(null);
  const [xeroToken, setXeroToken] = useState(null);
  const [xeroTenant, setXeroTenant] = useState(null);
  const [xeroLoading, setXeroLoading] = useState(false);
  const [xeroError, setXeroError] = useState("");
  const bizFileRef = useRef();
  const importRef = useRef();

  useEffect(() => {
    (async () => {
      const d = await loadData(SK.diary, initDiary());
      const b = await loadData(SK.biz, initBiz());
      const r = await loadData(SK.recipes, []);
      setDiaryRaw(d); setBizRaw(b); setRecipesRaw(r);
      setLoaded(true);
    })();
  }, []);

  const showSaved = () => { setSaveStatus("Saved"); setTimeout(()=>setSaveStatus(""),2000); };
  const setDiary = fn => setDiaryRaw(p=>{const n=typeof fn==="function"?fn(p):fn; saveData(SK.diary,n).then(showSaved); return n;});
  const setBiz = fn => setBizRaw(p=>{const n=typeof fn==="function"?fn(p):fn; saveData(SK.biz,n).then(showSaved); return n;});
  const setRecipes = fn => setRecipesRaw(p=>{const n=typeof fn==="function"?fn(p):fn; saveData(SK.recipes,n).then(showSaved); return n;});

  const day = DAYS[selected];
  const entry = diary[day];
  const todayEntry = diary[DAYS[todayIdx]];
  const todayBiz = biz[DAYS[todayIdx]];

  const weekRevenue = DAYS.reduce((s,d)=>s+num(biz[d].revenue),0);
  const weekSales = DAYS.reduce((s,d)=>s+num(biz[d].sales),0);
  const weekCogs = DAYS.reduce((s,d)=>s+num(biz[d].cogs),0);
  const weekProfit = weekRevenue-weekCogs;
  const weekMargin = weekRevenue>0?(weekProfit/weekRevenue*100).toFixed(1):0;
  const upcomingTasks = DAYS.slice(todayIdx+1).map(d=>({d,tasks:diary[d].tasks.filter(t=>!t.done)})).filter(x=>x.tasks.length>0);

  const updateNote = v => setDiary(p=>({...p,[day]:{...p[day],note:v}}));
  const updateMood = v => setDiary(p=>({...p,[day]:{...p[day],mood:entry.mood===v?"":v}}));
  const addTask = () => {if(!taskInput.trim()) return; setDiary(p=>({...p,[day]:{...p[day],tasks:[...p[day].tasks,{text:taskInput.trim(),done:false}]}})); setTaskInput("");};
  const toggleTask = (d,i) => {const tasks=diary[d].tasks.map((t,idx)=>idx===i?{...t,done:!t.done}:t); setDiary(p=>({...p,[d]:{...p[d],tasks}}));};
  const deleteTask = i => setDiary(p=>({...p,[day]:{...p[day],tasks:entry.tasks.filter((_,idx)=>idx!==i)}}));
  const updateBiz = (d,k,v) => setBiz(p=>({...p,[d]:{...p[d],[k]:v}}));

  const fetchSquareData = async () => {
    setSquareLoading(true); setSquareError("");
    try {
      const res = await fetch("/api/square");
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setSquareData(data);
      setBiz(p=>({...p,[DAYS[todayIdx]]:{...p[DAYS[todayIdx]],revenue:data.revenue.toFixed(2),sales:data.transactions}}));
    } catch(e) { setSquareError("Could not connect to Square: "+e.message); }
    setSquareLoading(false);
  };

  const fetchXeroData = async (token, tenant) => {
    setXeroLoading(true); setXeroError("");
    try {
      const url = "/api/xero-data?token="+token+"&tenantId="+tenant;
      const res = await fetch(url);
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setXeroData(data);
      if(data.cogs > 0) {
        const dailyCogs = (data.cogs / new Date().getDate()).toFixed(2);
        setBiz(p=>({...p,[DAYS[todayIdx]]:{...p[DAYS[todayIdx]],cogs:dailyCogs}}));
      }
    } catch(e) { setXeroError("Xero error: "+e.message); }
    setXeroLoading(false);
  };

  useEffect(()=>{
    if(!loaded) return;
    fetchSquareData();
    // Check hash for Xero tokens
    const hash = window.location.hash;
    if(hash && hash.length > 1) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("xero_token");
      const tenant = params.get("xero_tenant");
      const err = params.get("xero_error");
      if(token && tenant) {
        setXeroToken(token); setXeroTenant(tenant);
        window.history.pushState({},document.title,"/");
        fetchXeroData(token,tenant);
      }
      if(err) {
        setXeroError(decodeURIComponent(err));
        window.history.pushState({},document.title,"/");
      }
    }
  },[loaded]);

  const exportData = () => {
    const data={diary,biz,recipes,exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="urban-kitchen-diary.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = e => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{try{const data=JSON.parse(ev.target.result);if(data.diary)setDiary(data.diary);if(data.biz)setBiz(data.biz);if(data.recipes)setRecipes(data.recipes);}catch{alert("Could not read backup file.");}};
    reader.readAsText(file); e.target.value="";
  };

  const handleBizCSV = e => {
    const file=e.target.files[0]; if(!file) return; setCsvError("");
    const reader=new FileReader();
    reader.onload=ev=>{
      try {
        const lines=ev.target.result.trim().split("\n").map(l=>l.split(",").map(c=>c.trim().replace(/"/g,"")));
        const headers=lines[0].map(h=>h.toLowerCase());
        const dc=headers.findIndex(h=>h.includes("day"));
        const rc=headers.findIndex(h=>h.includes("rev")||h.includes("sales")||h.includes("income"));
        const cc=headers.findIndex(h=>h.includes("cog")||h.includes("cost"));
        const tc=headers.findIndex(h=>h.includes("txn")||h.includes("transaction")||h.includes("count"));
        if(dc===-1||rc===-1){setCsvError("CSV needs at least a Day and Revenue column.");return;}
        const updated={...biz};
        lines.slice(1).forEach(row=>{const d=DAYS.find(day=>day.toLowerCase().startsWith((row[dc]||"").toLowerCase().slice(0,3)));if(d)updated[d]={revenue:(row[rc]||"").replace(/[$,]/g,"")||updated[d].revenue,cogs:cc>-1?(row[cc]||"").replace(/[$,]/g,"")||updated[d].cogs:updated[d].cogs,sales:tc>-1?row[tc]||updated[d].sales:updated[d].sales};});
        setBiz(updated);
      } catch { setCsvError("Could not parse CSV."); }
    };
    reader.readAsText(file); e.target.value="";
  };

  const navItems=[{id:"today",label:"Today",icon:"☀️"},{id:"business",label:"Business",icon:"📊"},{id:"food",label:"Food Cost",icon:"🍽️"},{id:"week",label:"Week",icon:"📅"},{id:"day",label:"Day",icon:"📝"}];

  const SC = ({label,value,color}) => (
    <div style={{background:WHITE,borderRadius:10,padding:"14px 16px",flex:1,minWidth:90}}>
      <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:6}}>{label}</div>
      <div style={{fontSize:18,fontWeight:"bold",color:color||OLIVE}}>{value}</div>
    </div>
  );

  const BI = ({label,field,d}) => (
    <div style={{flex:1}}>
      <div style={{fontSize:11,color:MUTED,marginBottom:4}}>{label}</div>
      <div style={{position:"relative"}}>
        {field!=="sales"&&<span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:MUTED,fontSize:13}}>$</span>}
        <input type="number" min="0" value={biz[d][field]} onChange={e=>updateBiz(d,field,e.target.value)} placeholder="0"
          style={{width:"100%",padding:field!=="sales"?"8px 8px 8px 22px":"8px 10px",borderRadius:7,border:"1px solid "+OLIVE_LIGHT,background:OLIVE_LIGHT,fontFamily:"Georgia, serif",fontSize:13,color:TEXT,outline:"none",boxSizing:"border-box"}} />
      </div>
    </div>
  );

  if(!loaded) return <div style={{minHeight:"100vh",background:OLIVE_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia, serif",color:OLIVE,fontSize:16}}>Loading your diary...</div>;

  return (
    <div style={{minHeight:"100vh",background:OLIVE_LIGHT,fontFamily:"Georgia, serif",color:TEXT,display:"flex",flexDirection:"column"}}>
      <div style={{background:OLIVE,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{color:WHITE,fontSize:17}}>Urban Kitchen Diary</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {saveStatus&&<div style={{color:"#d4e0b8",fontSize:12}}>{saveStatus}</div>}
          <div style={{color:"#d4e0b8",fontSize:12}}>{dateStr}</div>
        </div>
      </div>

      <div style={{background:WHITE,display:"flex",borderBottom:"1px solid "+OLIVE_LIGHT,overflowX:"auto"}}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>{setView(n.id);if(n.id==="day")setSelected(todayIdx);}}
            style={{flex:1,padding:"10px 6px",border:"none",background:"transparent",borderBottom:view===n.id?"2px solid "+OLIVE:"2px solid transparent",color:view===n.id?OLIVE:MUTED,cursor:"pointer",fontFamily:"Georgia, serif",fontSize:11,whiteSpace:"nowrap"}}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 18px"}}>

        {view==="today"&&(
          <div style={{maxWidth:520,margin:"0 auto"}}>
            <h2 style={{color:OLIVE,fontWeight:"normal",fontSize:20,marginBottom:4}}>Good morning!</h2>
            <p style={{color:MUTED,fontSize:13,marginTop:0,marginBottom:20}}>Here is what is on for {DAYS[todayIdx]}.</p>
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10}}>HOW ARE YOU FEELING?</div>
              <div style={{display:"flex",gap:10}}>{MOODS.map(m=>(<button key={m} onClick={()=>setDiary(p=>({...p,[DAYS[todayIdx]]:{...p[DAYS[todayIdx]],mood:todayEntry.mood===m?"":m}}))} style={{fontSize:22,background:todayEntry.mood===m?OLIVE_LIGHT:"transparent",border:"1px solid "+(todayEntry.mood===m?OLIVE:OLIVE_LIGHT),borderRadius:8,width:42,height:42,cursor:"pointer"}}>{m}</button>))}</div>
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:12}}>TODAY'S BUSINESS SNAPSHOT</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <SC label="REVENUE" value={fmtMoney(todayBiz.revenue)} />
                <SC label="COGS" value={fmtMoney(todayBiz.cogs)} />
                <SC label="PROFIT" value={num(todayBiz.revenue)>0?fmtMoney(num(todayBiz.revenue)-num(todayBiz.cogs)):"—"} color={num(todayBiz.revenue)-num(todayBiz.cogs)>=0?GREEN:RED} />
                <SC label="MARGIN" value={num(todayBiz.revenue)>0?((num(todayBiz.revenue)-num(todayBiz.cogs))/num(todayBiz.revenue)*100).toFixed(1)+"%":"—"} color={OLIVE} />
              </div>
              <div style={{marginTop:10,fontSize:12,color:MUTED}}>{todayBiz.sales?todayBiz.sales+" transactions":"No transactions entered"} <span style={{color:OLIVE,cursor:"pointer"}} onClick={()=>setView("business")}> Update</span></div>
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:12}}>TODAY'S TASKS</div>
              {todayEntry.tasks.length===0?<div style={{color:MUTED,fontSize:13}}>No tasks yet. <span style={{color:OLIVE,cursor:"pointer"}} onClick={()=>{setSelected(todayIdx);setView("day");}}>Add some</span></div>
                :todayEntry.tasks.map((t,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:i>0?"1px solid "+OLIVE_LIGHT:"none"}}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(DAYS[todayIdx],i)} style={{width:17,height:17,accentColor:OLIVE,cursor:"pointer"}} /><span style={{fontSize:14,textDecoration:t.done?"line-through":"none",color:t.done?MUTED:TEXT}}>{t.text}</span></div>))}
              {todayEntry.tasks.length>0&&<div style={{marginTop:10}}><div style={{height:3,background:OLIVE_LIGHT,borderRadius:2}}><div style={{height:3,borderRadius:2,background:OLIVE,width:(todayEntry.tasks.filter(t=>t.done).length/todayEntry.tasks.length*100)+"%",transition:"width 0.3s"}} /></div><div style={{fontSize:11,color:MUTED,marginTop:4}}>{todayEntry.tasks.filter(t=>t.done).length} of {todayEntry.tasks.length} done</div></div>}
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10}}>TODAY'S NOTE</div>
              <textarea value={todayEntry.note} onChange={e=>setDiary(p=>({...p,[DAYS[todayIdx]]:{...p[DAYS[todayIdx]],note:e.target.value}}))} placeholder="Jot something down..." style={{width:"100%",minHeight:80,border:"none",background:"transparent",fontFamily:"Georgia, serif",fontSize:14,color:TEXT,resize:"none",outline:"none",lineHeight:1.8,boxSizing:"border-box"}} />
            </div>
            {upcomingTasks.length>0&&<div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:14}}><div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:12}}>COMING UP THIS WEEK</div>{upcomingTasks.map(({d,tasks})=>(<div key={d} style={{marginBottom:10}}><div style={{fontSize:12,color:OLIVE,fontWeight:"bold",marginBottom:4}}>{d}</div>{tasks.map((t,i)=><div key={i} style={{fontSize:13,color:TEXT,padding:"3px 0 3px 10px",borderLeft:"2px solid "+OLIVE_LIGHT}}>{t.text}</div>)}</div>))}</div>}
            <div style={{background:WHITE,borderRadius:10,padding:16,marginTop:14}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:12}}>BACKUP AND RESTORE</div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={exportData} style={{flex:1,background:OLIVE_LIGHT,color:OLIVE,border:"1px solid "+OLIVE_MID,borderRadius:7,padding:"8px 12px",cursor:"pointer",fontSize:12,fontFamily:"Georgia, serif"}}>Export Backup</button>
                <button onClick={()=>importRef.current.click()} style={{flex:1,background:OLIVE_LIGHT,color:OLIVE,border:"1px solid "+OLIVE_MID,borderRadius:7,padding:"8px 12px",cursor:"pointer",fontSize:12,fontFamily:"Georgia, serif"}}>Restore Backup</button>
                <input ref={importRef} type="file" accept=".json" onChange={importData} style={{display:"none"}} />
              </div>
              <div style={{fontSize:11,color:MUTED,marginTop:8}}>Your data saves automatically.</div>
            </div>
          </div>
        )}

        {view==="business"&&(
          <div style={{maxWidth:560,margin:"0 auto"}}>
            <h2 style={{color:OLIVE,fontWeight:"normal",fontSize:20,marginBottom:4}}>Business Dashboard</h2>
            <p style={{color:MUTED,fontSize:13,marginTop:0,marginBottom:18}}>Track daily revenue, sales and COGS.</p>

            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:18,border:"1px solid "+OLIVE_LIGHT}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:11,color:MUTED,letterSpacing:1}}>SQUARE - YESTERDAY'S SALES</div>
                <button onClick={fetchSquareData} style={{background:OLIVE_LIGHT,color:OLIVE,border:"1px solid "+OLIVE_MID,borderRadius:7,padding:"4px 12px",cursor:"pointer",fontSize:12,fontFamily:"Georgia, serif"}}>{squareLoading?"Loading...":"Refresh"}</button>
              </div>
              {squareError&&<div style={{color:RED,fontSize:12,marginBottom:8}}>{squareError}</div>}
              {squareData?(
                <div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
                    <SC label="REVENUE" value={fmtMoney(squareData.revenue)} color={GREEN} />
                    <SC label="TRANSACTIONS" value={squareData.transactions} />
                    <SC label="AVG SALE" value={fmtMoney(squareData.avgSale)} />
                  </div>
                  {squareData.paymentTypes&&Object.keys(squareData.paymentTypes).length>0&&(
                    <div style={{fontSize:12,color:MUTED}}>Payment types: {Object.entries(squareData.paymentTypes).map(([k,v])=>k+": "+fmtMoney(v)).join(" | ")}</div>
                  )}
                  <div style={{fontSize:11,color:OLIVE_MID,marginTop:8}}>Auto-filled into today's daily entry</div>
                </div>
              ):(!squareLoading&&<div style={{color:MUTED,fontSize:13}}>No Square data yet. Click Refresh to load.</div>)}
            </div>

            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:18,border:"1px solid "+OLIVE_LIGHT}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:11,color:MUTED,letterSpacing:1}}>XERO - THIS MONTH'S P&L</div>
                {xeroToken
                  ?<button onClick={()=>fetchXeroData(xeroToken,xeroTenant)} style={{background:OLIVE_LIGHT,color:OLIVE,border:"1px solid "+OLIVE_MID,borderRadius:7,padding:"4px 12px",cursor:"pointer",fontSize:12,fontFamily:"Georgia, serif"}}>{xeroLoading?"Loading...":"Refresh"}</button>
                  :<button onClick={()=>window.location.href="/api/xero-auth"} style={{background:OLIVE,color:WHITE,border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,fontFamily:"Georgia, serif"}}>Connect Xero</button>
                }
              </div>
              {xeroError&&<div style={{color:RED,fontSize:12,marginBottom:8}}>{xeroError}</div>}
              {xeroData?(
                <div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
                    <SC label="REVENUE" value={fmtMoney(xeroData.revenue)} color={GREEN} />
                    <SC label="COGS" value={fmtMoney(xeroData.cogs)} />
                    <SC label="EXPENSES" value={fmtMoney(xeroData.expenses)} />
                    <SC label="GROSS PROFIT" value={fmtMoney(xeroData.grossProfit)} color={xeroData.grossProfit>=0?GREEN:RED} />
                    <SC label="NET PROFIT" value={fmtMoney(xeroData.netProfit)} color={xeroData.netProfit>=0?GREEN:RED} />
                    <SC label="GROSS MARGIN" value={xeroData.grossMargin+"%"} color={parseFloat(xeroData.grossMargin)>=60?GREEN:parseFloat(xeroData.grossMargin)>=40?AMBER:RED} />
                  </div>
                  <div style={{fontSize:11,color:MUTED}}>{xeroData.fromDate} to {xeroData.toDate}</div>
                  <div style={{fontSize:11,color:OLIVE_MID,marginTop:6}}>Daily COGS auto-filled from Xero</div>
                </div>
              ):(!xeroLoading&&!xeroToken&&<div style={{color:MUTED,fontSize:13}}>Click Connect Xero to sync your P&L data.</div>)}
            </div>

            <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
              <SC label="WEEK REVENUE" value={fmtMoney(weekRevenue)} />
              <SC label="WEEK COGS" value={fmtMoney(weekCogs)} />
              <SC label="GROSS PROFIT" value={fmtMoney(weekProfit)} color={weekProfit>=0?GREEN:RED} />
              <SC label="MARGIN" value={weekMargin+"%"} color={parseFloat(weekMargin)>=50?GREEN:parseFloat(weekMargin)>=30?OLIVE:RED} />
            </div>
            {weekSales>0&&<div style={{fontSize:13,color:MUTED,marginBottom:18}}>Total transactions: <strong style={{color:TEXT}}>{weekSales}</strong> Avg sale: <strong style={{color:TEXT}}>{weekRevenue>0?fmtMoney(weekRevenue/weekSales):"—"}</strong></div>}
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:18}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10}}>IMPORT FROM CSV</div>
              <button onClick={()=>bizFileRef.current.click()} style={{background:OLIVE_LIGHT,color:OLIVE,border:"1px solid "+OLIVE,borderRadius:7,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:"Georgia, serif"}}>Upload CSV</button>
              <input ref={bizFileRef} type="file" accept=".csv" onChange={handleBizCSV} style={{display:"none"}} />
              {csvError&&<div style={{color:RED,fontSize:12,marginTop:8}}>{csvError}</div>}
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:18}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:14}}>DAILY ENTRY</div>
              {DAYS.map((d,i)=>{const b=biz[d];const profit=num(b.revenue)-num(b.cogs);const margin=num(b.revenue)>0?(profit/num(b.revenue)*100).toFixed(1):null;return(
                <div key={d} style={{marginBottom:16,paddingBottom:16,borderBottom:i<6?"1px solid "+OLIVE_LIGHT:"none"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontSize:14,color:i===todayIdx?OLIVE:TEXT,fontWeight:i===todayIdx?"bold":"normal"}}>{d}{i===todayIdx?" Today":""}</div>
                    {margin&&<div style={{fontSize:12,color:profit>=0?GREEN:RED}}>{margin}% margin</div>}
                  </div>
                  <div style={{display:"flex",gap:8}}><BI label="Revenue" field="revenue" d={d} /><BI label="COGS" field="cogs" d={d} /><BI label="Transactions" field="sales" d={d} /></div>
                  {num(b.revenue)>0&&<div style={{marginTop:8,fontSize:12,color:MUTED}}>Gross profit: <strong style={{color:profit>=0?GREEN:RED}}>{fmtMoney(profit)}</strong>{b.sales?" Avg sale: "+fmtMoney(num(b.revenue)/num(b.sales)):""}</div>}
                </div>);})}
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:14}}>WEEKLY COGS REPORT</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:"2px solid "+OLIVE_LIGHT}}>{["Day","Revenue","COGS","Profit","Margin"].map(h=><th key={h} style={{textAlign:h==="Day"?"left":"right",padding:"6px 4px",color:MUTED,fontWeight:"normal",fontSize:11}}>{h.toUpperCase()}</th>)}</tr></thead>
                <tbody>
                  {DAYS.map((d,i)=>{const b=biz[d];const profit=num(b.revenue)-num(b.cogs);const margin=num(b.revenue)>0?(profit/num(b.revenue)*100).toFixed(1)+"%":"—";return(<tr key={d} style={{borderBottom:"1px solid "+OLIVE_LIGHT,background:i===todayIdx?OLIVE_LIGHT:"transparent"}}><td style={{padding:"8px 4px",color:i===todayIdx?OLIVE:TEXT,fontWeight:i===todayIdx?"bold":"normal"}}>{SHORT[i]}</td><td style={{padding:"8px 4px",textAlign:"right"}}>{fmtMoney(b.revenue)}</td><td style={{padding:"8px 4px",textAlign:"right"}}>{fmtMoney(b.cogs)}</td><td style={{padding:"8px 4px",textAlign:"right",color:num(b.revenue)>0?(profit>=0?GREEN:RED):MUTED}}>{num(b.revenue)>0?fmtMoney(profit):"—"}</td><td style={{padding:"8px 4px",textAlign:"right",color:num(b.revenue)>0?(parseFloat(margin)>=30?GREEN:RED):MUTED}}>{margin}</td></tr>);})}
                  <tr style={{borderTop:"2px solid "+OLIVE}}><td style={{padding:"8px 4px",fontWeight:"bold",color:OLIVE}}>Total</td><td style={{padding:"8px 4px",textAlign:"right",fontWeight:"bold"}}>{fmtMoney(weekRevenue)}</td><td style={{padding:"8px 4px",textAlign:"right",fontWeight:"bold"}}>{fmtMoney(weekCogs)}</td><td style={{padding:"8px 4px",textAlign:"right",fontWeight:"bold",color:weekProfit>=0?GREEN:RED}}>{fmtMoney(weekProfit)}</td><td style={{padding:"8px 4px",textAlign:"right",fontWeight:"bold",color:parseFloat(weekMargin)>=30?GREEN:RED}}>{weekMargin}%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view==="food"&&(
          <div style={{maxWidth:900,margin:"0 auto"}}>
            <h2 style={{color:OLIVE,fontWeight:"normal",fontSize:20,marginBottom:4}}>Food Cost Calculator</h2>
            <p style={{color:MUTED,fontSize:13,marginTop:0,marginBottom:18}}>All formulas calculate live as you type.</p>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <button onClick={()=>{const blank={name:"New Recipe",portionsPerRecipe:1,sellPrice:0,ingredients:[{name:"",measure:"",singleQtyUnit:0,singleServe:0,portionQty:0,actual:0,unitCost:0}]};setRecipes(p=>[...p,blank]);setExpandedRecipe(recipes.length);}} style={{background:OLIVE,color:WHITE,border:"none",borderRadius:7,padding:"10px 18px",cursor:"pointer",fontSize:13,fontFamily:"Georgia, serif"}}>+ New Recipe</button>
            </div>
            {expandedRecipe===null?(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:16}}>
                {recipes.map((r,ri)=>{
                  const tc=r.ingredients.reduce((s,ing)=>s+(num(ing.unitCost)*num(ing.portionQty)),0);
                  const portions=num(r.portionsPerRecipe)||1;
                  const cps=tc/portions;
                  const sp=num(r.sellPrice);
                  const cogs=sp>0?(cps/sp)*100:0;
                  const gp=100-cogs;
                  return(
                    <div key={ri} onClick={()=>setExpandedRecipe(ri)} style={{background:WHITE,borderRadius:12,padding:20,border:"1px solid "+OLIVE_LIGHT,cursor:"pointer",position:"relative"}}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(107,124,74,0.15)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      <button onClick={ev=>{ev.stopPropagation();setRecipes(p=>p.filter((_,i)=>i!==ri));if(expandedRecipe===ri)setExpandedRecipe(null);}} style={{position:"absolute",top:10,right:10,background:"none",border:"none",color:OLIVE_LIGHT,cursor:"pointer",fontSize:18}}>x</button>
                      <div style={{fontSize:16,fontWeight:"bold",color:OLIVE,marginBottom:6,paddingRight:20}}>{r.name||"Unnamed"}</div>
                      <div style={{fontSize:12,color:MUTED,marginBottom:12}}>{r.ingredients.length} ingredient{r.ingredients.length!==1?"s":""}</div>
                      <div style={{borderTop:"1px solid "+OLIVE_LIGHT,paddingTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <div><div style={{fontSize:10,color:MUTED}}>TOTAL COST</div><div style={{fontSize:13,fontWeight:"bold",color:TEXT}}>{fmtMoney(tc)}</div></div>
                        <div><div style={{fontSize:10,color:MUTED}}>COST/SERVE</div><div style={{fontSize:13,fontWeight:"bold",color:TEXT}}>{fmtMoney(cps)}</div></div>
                        <div><div style={{fontSize:10,color:MUTED}}>SELL PRICE</div><div style={{fontSize:13,fontWeight:"bold",color:TEXT}}>{fmtMoney(sp)}</div></div>
                        <div><div style={{fontSize:10,color:MUTED}}>SELL EX GST</div><div style={{fontSize:13,fontWeight:"bold",color:TEXT}}>{fmtMoney(sp/1.1)}</div></div>
                        <div><div style={{fontSize:10,color:MUTED}}>FOOD COGS %</div><div style={{fontSize:13,fontWeight:"bold",color:cogsColor(cogs)}}>{sp>0?cogs.toFixed(1)+"%":"—"}</div></div>
                        <div><div style={{fontSize:10,color:MUTED}}>GP %</div><div style={{fontSize:13,fontWeight:"bold",color:gpColor(gp)}}>{sp>0?gp.toFixed(1)+"%":"—"}</div></div>
                      </div>
                      <div style={{marginTop:12,fontSize:11,color:OLIVE_MID}}>Tap to edit</div>
                    </div>
                  );
                })}
                {recipes.length===0&&(<div style={{gridColumn:"1/-1",background:WHITE,borderRadius:12,padding:40,textAlign:"center",color:MUTED}}><div style={{fontSize:40,marginBottom:12}}>🍽️</div><div style={{fontSize:15,marginBottom:6}}>No recipes yet</div><div style={{fontSize:13}}>Click New Recipe to get started.</div></div>)}
              </div>
            ):(() => {
              const r=recipes[expandedRecipe]; const ri=expandedRecipe;
              const tc=r.ingredients.reduce((s,ing)=>s+(num(ing.unitCost)*num(ing.portionQty)),0);
              const portions=num(r.portionsPerRecipe)||1;
              const cps=tc/portions;
              const sp=num(r.sellPrice);
              const exGst=sp/1.1;
              const cogs=sp>0?(cps/sp)*100:0;
              const gp=100-cogs;
              const updIng=(idx,key,val)=>setRecipes(p=>p.map((rec,i)=>i!==ri?rec:{...rec,ingredients:rec.ingredients.map((ing,ii)=>ii!==idx?ing:{...ing,[key]:val})}));
              const addIng=()=>setRecipes(p=>p.map((rec,i)=>i!==ri?rec:{...rec,ingredients:[...rec.ingredients,{name:"",measure:"",singleQtyUnit:0,singleServe:0,portionQty:0,actual:0,unitCost:0}]}));
              const delIng=idx=>setRecipes(p=>p.map((rec,i)=>i!==ri?rec:{...rec,ingredients:rec.ingredients.filter((_,ii)=>ii!==idx)}));
              const updRec=(key,val)=>setRecipes(p=>p.map((rec,i)=>i!==ri?rec:{...rec,[key]:val}));
              const inp=(wide)=>({background:"transparent",border:"none",borderBottom:"1px solid transparent",fontFamily:"Georgia, serif",fontSize:12,color:TEXT,outline:"none",padding:"5px 4px",width:wide?150:70,textAlign:wide?"left":"right",boxSizing:"border-box"});
              return(
                <div style={{background:WHITE,borderRadius:12,padding:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                    <button onClick={()=>setExpandedRecipe(null)} style={{background:OLIVE_LIGHT,color:OLIVE,border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:13,fontFamily:"Georgia, serif"}}>Back</button>
                    <input value={r.name} onChange={e=>updRec("name",e.target.value)} placeholder="Recipe name" style={{fontSize:20,fontWeight:"bold",color:OLIVE,background:"transparent",border:"none",borderBottom:"2px solid "+OLIVE_LIGHT,outline:"none",fontFamily:"Georgia, serif",padding:"2px 4px",flex:1}} />
                  </div>
                  <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
                    <div style={{background:OLIVE_LIGHT,borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:10,color:MUTED,letterSpacing:1,marginBottom:6}}>PORTIONS PER RECIPE</div>
                      <input type="number" min="1" value={r.portionsPerRecipe} onChange={e=>updRec("portionsPerRecipe",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid "+OLIVE_MID,fontFamily:"Georgia, serif",fontSize:16,fontWeight:"bold",color:OLIVE,outline:"none",width:80,padding:"2px 0"}} />
                    </div>
                    <div style={{background:OLIVE_LIGHT,borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:10,color:MUTED,letterSpacing:1,marginBottom:6}}>SELLING PRICE PER SERVE ($)</div>
                      <input type="number" min="0" step="0.01" value={r.sellPrice} onChange={e=>updRec("sellPrice",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid "+OLIVE_MID,fontFamily:"Georgia, serif",fontSize:16,fontWeight:"bold",color:OLIVE,outline:"none",width:80,padding:"2px 0"}} />
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))",gap:10,marginBottom:24}}>
                    {[{label:"TOTAL COST",value:fmtMoney(tc),color:TEXT},{label:"COST PER SERVE",value:fmtMoney(cps),color:TEXT},{label:"SELL PRICE",value:fmtMoney(sp),color:TEXT},{label:"SELL EX GST",value:fmtMoney(exGst),color:TEXT},{label:"FOOD COGS %",value:sp>0?cogs.toFixed(1)+"%":"—",color:cogsColor(cogs)},{label:"GP %",value:sp>0?gp.toFixed(1)+"%":"—",color:gpColor(gp)}].map(({label,value,color})=>(
                      <div key={label} style={{background:OLIVE_LIGHT,borderRadius:10,padding:"12px 14px"}}>
                        <div style={{fontSize:10,color:MUTED,letterSpacing:1,marginBottom:6}}>{label}</div>
                        <div style={{fontSize:15,fontWeight:"bold",color}}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10}}>INGREDIENTS</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead><tr style={{background:OLIVE_LIGHT}}>{["Ingredient","Measure","Single Qty","Single Serve","Portion Qty","Actual","Unit Cost ($)","Total Cost"].map((h,i)=>(<th key={h} style={{padding:"8px",textAlign:i===0?"left":"right",fontSize:11,color:OLIVE,fontWeight:"bold",whiteSpace:"nowrap"}}>{h}</th>))}<th style={{width:30}}></th></tr></thead>
                      <tbody>
                        {r.ingredients.map((ing,idx)=>{
                          const lt=num(ing.unitCost)*num(ing.portionQty);
                          return(
                            <tr key={idx} style={{borderBottom:"1px solid "+OLIVE_LIGHT,background:idx%2===0?"transparent":"#f9fbf5"}}>
                              <td style={{padding:"2px 4px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:4}}>
                                  <input value={ing.name} onChange={e=>updIng(idx,"name",e.target.value)} placeholder="e.g. Flour" style={{...inp(true)}} onFocus={e=>e.target.style.borderBottomColor=OLIVE_MID} onBlur={e=>e.target.style.borderBottomColor="transparent"} />
                                  <button onClick={()=>{setIngSearch("");setShowIngPicker({ri,idx});}} style={{background:OLIVE_LIGHT,border:"1px solid "+OLIVE_MID,borderRadius:5,padding:"2px 6px",cursor:"pointer",fontSize:11,color:OLIVE,whiteSpace:"nowrap"}}>Pick</button>
                                </div>
                              </td>
                              <td style={{padding:"2px 4px"}}><input value={ing.measure} onChange={e=>updIng(idx,"measure",e.target.value)} placeholder="kg" style={{...inp(false)}} onFocus={e=>e.target.style.borderBottomColor=OLIVE_MID} onBlur={e=>e.target.style.borderBottomColor="transparent"} /></td>
                              <td style={{padding:"2px 4px"}}><input type="number" value={ing.singleQtyUnit} onChange={e=>updIng(idx,"singleQtyUnit",e.target.value)} style={{...inp(false)}} onFocus={e=>e.target.style.borderBottomColor=OLIVE_MID} onBlur={e=>e.target.style.borderBottomColor="transparent"} /></td>
                              <td style={{padding:"2px 4px"}}><input type="number" value={ing.singleServe} onChange={e=>updIng(idx,"singleServe",e.target.value)} style={{...inp(false)}} onFocus={e=>e.target.style.borderBottomColor=OLIVE_MID} onBlur={e=>e.target.style.borderBottomColor="transparent"} /></td>
                              <td style={{padding:"2px 4px"}}><input type="number" value={ing.portionQty} onChange={e=>updIng(idx,"portionQty",e.target.value)} style={{...inp(false)}} onFocus={e=>e.target.style.borderBottomColor=OLIVE_MID} onBlur={e=>e.target.style.borderBottomColor="transparent"} /></td>
                              <td style={{padding:"2px 4px"}}><input type="number" value={ing.actual} onChange={e=>updIng(idx,"actual",e.target.value)} style={{...inp(false)}} onFocus={e=>e.target.style.borderBottomColor=OLIVE_MID} onBlur={e=>e.target.style.borderBottomColor="transparent"} /></td>
                              <td style={{padding:"2px 4px"}}><input type="number" value={ing.unitCost} onChange={e=>updIng(idx,"unitCost",e.target.value)} style={{...inp(false)}} onFocus={e=>e.target.style.borderBottomColor=OLIVE_MID} onBlur={e=>e.target.style.borderBottomColor="transparent"} /></td>
                              <td style={{padding:"2px 4px",textAlign:"right",fontWeight:"bold",color:OLIVE,paddingRight:8}}>{fmtMoney(lt)}</td>
                              <td style={{padding:"2px 4px",textAlign:"center"}}><button onClick={()=>delIng(idx)} style={{background:"none",border:"none",color:OLIVE_LIGHT,cursor:"pointer",fontSize:16}}>x</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={addIng} style={{marginTop:12,background:OLIVE_LIGHT,color:OLIVE,border:"1px solid "+OLIVE_MID,borderRadius:7,padding:"7px 16px",cursor:"pointer",fontSize:12,fontFamily:"Georgia, serif"}}>+ Add Ingredient</button>
                  {showIngPicker&&showIngPicker.ri===ri&&(
                    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{background:WHITE,borderRadius:14,padding:24,width:"90%",maxWidth:480,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{fontSize:16,fontWeight:"bold",color:OLIVE}}>Pick Ingredient</div>
                          <button onClick={()=>setShowIngPicker(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:MUTED}}>x</button>
                        </div>
                        <input value={ingSearch} onChange={e=>setIngSearch(e.target.value)} placeholder="Search ingredients..." autoFocus
                          style={{padding:"9px 12px",borderRadius:8,border:"1px solid "+OLIVE_LIGHT,background:OLIVE_LIGHT,fontFamily:"Georgia, serif",fontSize:13,color:TEXT,outline:"none",marginBottom:12}} />
                        <div style={{overflowY:"auto",flex:1}}>
                          {ING.filter(i=>i.name.toLowerCase().includes(ingSearch.toLowerCase())).map((ing,ii)=>(
                            <div key={ii} onClick={()=>{const{ri,idx}=showIngPicker;setRecipes(p=>p.map((rec,i)=>i!==ri?rec:{...rec,ingredients:rec.ingredients.map((row,ii)=>ii!==idx?row:{...row,name:ing.name,measure:ing.measure,unitCost:ing.unitCost,singleQtyUnit:ing.contentsQty})}));setShowIngPicker(null);}}
                              style={{padding:"10px 12px",borderRadius:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}
                              onMouseEnter={e=>e.currentTarget.style.background=OLIVE_LIGHT}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div>
                                <div style={{fontSize:13,color:TEXT,fontWeight:"500"}}>{ing.name}</div>
                                <div style={{fontSize:11,color:MUTED}}>{ing.measure} - {ing.contentsUnit}</div>
                              </div>
                              <div style={{fontSize:13,color:OLIVE,fontWeight:"bold"}}>{fmtMoney(ing.unitCost)}<span style={{fontSize:10,color:MUTED}}>/unit</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {view==="week"&&(
          <div style={{maxWidth:560,margin:"0 auto"}}>
            <h2 style={{color:OLIVE,fontWeight:"normal",fontSize:20,marginBottom:16}}>This Week</h2>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {DAYS.map((d,i)=>{const e=diary[d];const b=biz[d];return(<div key={d} onClick={()=>{setSelected(i);setView("day");}} style={{background:i===todayIdx?OLIVE:WHITE,borderRadius:10,padding:"12px 16px",cursor:"pointer",border:"1px solid "+(i===todayIdx?OLIVE:OLIVE_LIGHT),display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontWeight:"bold",fontSize:14,color:i===todayIdx?WHITE:OLIVE}}>{d}{i===todayIdx?" Today":""}</div><div style={{fontSize:12,color:i===todayIdx?"#d4e0b8":MUTED,marginTop:2}}>{e.note?'"'+e.note.slice(0,35)+'..."':"No entry"}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,color:i===todayIdx?WHITE:OLIVE,fontWeight:"bold"}}>{b.revenue?fmtMoney(b.revenue):""}</div><div style={{fontSize:11,color:i===todayIdx?"#d4e0b8":MUTED}}>{e.mood} {e.tasks.length>0?e.tasks.filter(t=>t.done).length+"/"+e.tasks.length+" tasks":""}</div></div></div>);})}
            </div>
          </div>
        )}

        {view==="day"&&(
          <div style={{maxWidth:520,margin:"0 auto"}}>
            <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
              {SHORT.map((s,i)=>(<button key={s} onClick={()=>setSelected(i)} style={{background:selected===i?OLIVE:WHITE,color:selected===i?WHITE:i===todayIdx?OLIVE:TEXT,border:"1px solid "+(selected===i?OLIVE:OLIVE_LIGHT),borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"Georgia, serif",fontSize:13,flexShrink:0,fontWeight:i===todayIdx?"bold":"normal"}}>{s}</button>))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:"normal",color:OLIVE}}>{day}</h2>
              {todayIdx===selected&&<span style={{background:OLIVE,color:WHITE,borderRadius:12,padding:"2px 10px",fontSize:11}}>Today</span>}
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10}}>MOOD</div>
              <div style={{display:"flex",gap:10}}>{MOODS.map(m=>(<button key={m} onClick={()=>updateMood(m)} style={{fontSize:22,background:entry.mood===m?OLIVE_LIGHT:"transparent",border:"1px solid "+(entry.mood===m?OLIVE:OLIVE_LIGHT),borderRadius:8,width:42,height:42,cursor:"pointer"}}>{m}</button>))}</div>
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10}}>JOURNAL</div>
              <textarea value={entry.note} onChange={e=>updateNote(e.target.value)} placeholder="What's on your mind today?" style={{width:"100%",minHeight:100,border:"none",background:"transparent",fontFamily:"Georgia, serif",fontSize:14,color:TEXT,resize:"vertical",outline:"none",lineHeight:1.8,boxSizing:"border-box"}} />
            </div>
            <div style={{background:WHITE,borderRadius:10,padding:16}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:12}}>TASKS</div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={taskInput} onChange={e=>setTaskInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Add a task..." style={{flex:1,padding:"8px 12px",borderRadius:7,border:"1px solid "+OLIVE_LIGHT,background:OLIVE_LIGHT,fontFamily:"Georgia, serif",fontSize:13,color:TEXT,outline:"none"}} />
                <button onClick={addTask} style={{background:OLIVE,color:WHITE,border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontSize:13}}>Add</button>
              </div>
              {entry.tasks.length===0&&<div style={{color:MUTED,fontSize:13}}>No tasks yet.</div>}
              {entry.tasks.map((t,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:i>0?"1px solid "+OLIVE_LIGHT:"none"}}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(day,i)} style={{width:16,height:16,accentColor:OLIVE,cursor:"pointer"}} /><span style={{flex:1,fontSize:14,textDecoration:t.done?"line-through":"none",color:t.done?MUTED:TEXT}}>{t.text}</span><button onClick={()=>deleteTask(i)} style={{background:"none",border:"none",color:OLIVE_LIGHT,cursor:"pointer",fontSize:18}}>x</button></div>))}
              {entry.tasks.length>0&&(<div style={{marginTop:12}}><div style={{height:3,background:OLIVE_LIGHT,borderRadius:2}}><div style={{height:3,borderRadius:2,background:OLIVE,width:(entry.tasks.filter(t=>t.done).length/entry.tasks.length*100)+"%",transition:"width 0.3s"}}/></div><div style={{fontSize:11,color:MUTED,marginTop:4}}>{entry.tasks.filter(t=>t.done).length} of {entry.tasks.length} done</div></div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
