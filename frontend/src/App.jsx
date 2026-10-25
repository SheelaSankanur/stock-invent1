import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, MoreVertical, Pencil, Search, Boxes, History, Sparkles, TrendingUp, PackageCheck, Download } from "lucide-react";
import api from "./api";
import "./style.css";

const demoItems = [
  { id: 1, name: "Keyboard", brand: "Logitech", description: "", quantity: 200, unit_price: "12500.00" },
  { id: 2, name: "Battery", brand: "", description: "Capacity: 70 Whr", quantity: 150, unit_price: "18000.00" },
  { id: 3, name: "Display", brand: "", description: "15.6 inches, Resolution: 1920 x 1080 pixels", quantity: 120, unit_price: "22000.00" },
  { id: 4, name: "Storage", brand: "", description: "512 GB", quantity: 80, unit_price: "16000.00" },
];
const demoMovements = [
  { id: 1, created_at: "01/06/2023, 1:59 pm", changed_via: "Process FG", change_quantity: "100.00", changed_by: "Rohit", item_name: "Keyboard" },
  { id: 2, created_at: "01/06/2023, 1:57 pm", changed_via: "Inward Document", change_quantity: "100.00", changed_by: "Vikas", item_name: "Battery" },
  { id: 3, created_at: "01/06/2023, 1:56 pm", changed_via: "Manual Adjustment", change_quantity: "50.00", changed_by: "Shubham", item_name: "Display" },
  { id: 4, created_at: "01/06/2023, 1:54 pm", changed_via: "GRN / Quality Report", change_quantity: "10.00", changed_by: "Ashish", item_name: "Storage" },
];
const money = n => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n || 0));
const stockValue = items => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);

export default function App() {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState(demoItems);
  const [movements, setMovements] = useState(demoMovements);
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [apiStatus, setApiStatus] = useState("demo");

  useEffect(() => {
    Promise.all([api.get("/items/"), api.get("/movements/")])
      .then(([i, m]) => {
        setItems(Array.isArray(i.data) ? i.data : i.data.results || []);
        setMovements(Array.isArray(m.data) ? m.data : m.data.results || []);
        setApiStatus("connected");
      })
      .catch(() => setApiStatus("demo"));
  }, []);

  const filteredItems = useMemo(() => items.filter(i =>
    `${i.name} ${i.brand} ${i.description}`.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);
  const filteredMovements = useMemo(() => movements.filter(m =>
    `${m.created_at} ${m.changed_via} ${m.changed_by} ${m.item_name}`.toLowerCase().includes(historySearch.toLowerCase())
  ), [movements, historySearch]);

  async function saveQuantity(item) {
    const next = Number(quantity);
    if (!Number.isInteger(next) || next < 0) return alert("Enter a whole number that is zero or greater.");
    try {
      const response = await api.patch(`/items/${item.id}/adjust-stock/`, { quantity: next, changed_by: "Admin" });
      setItems(prev => prev.map(x => x.id === item.id ? response.data : x));
      const history = await api.get("/movements/");
      setMovements(Array.isArray(history.data) ? history.data : history.data.results || []);
      setApiStatus("connected");
    } catch {
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, quantity: next } : x));
      setApiStatus("demo");
      alert("Backend is not connected. Quantity was updated in this page only. Start Django to save it permanently.");
    }
    setEditing(null);
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-mark"><Boxes size={22}/></div>
      <div className="brand-name">Stock<span>Wise</span><small>INVENTORY CONTROL</small></div>
      <div className="top-actions"><span className={`connection ${apiStatus}`}><i/> {apiStatus === "connected" ? "Database connected" : "Demo preview"}</span><div className="avatar">S</div></div>
    </header>

    <section className="page-heading">
      <div><p className="eyebrow">INVENTORY OVERVIEW</p><h1>{step === 1 ? "See accurate valuation of your stock" : step === 2 ? "See history of how item quantity has changed over time" : "Make smarter inventory decisions"}</h1>
      <p className="subtitle">{step === 1 ? "Know exactly what your inventory is worth right now." : step === 2 ? "Track stock changes, adjustments, and the people behind them." : "Turn your stock data into clear, actionable insights."}</p></div>
      <div className="heading-icon">{step === 1 ? <TrendingUp/> : step === 2 ? <History/> : <Sparkles/>}</div>
    </section>

    <section className="content-panel">
      {step === 1 && <div className="stock-layout">
        <div className="table-card item-card">
          <div className="table-heading">ITEM NAME</div>
          <div className="search-row"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." aria-label="Search items"/></div>
          {filteredItems.map(item => <div className="item-row" key={item.id}>
            <div className="item-copy"><a href="#item" onClick={e => e.preventDefault()}>{item.name}{item.brand ? ` (Brand: ${item.brand})` : item.description ? ` (${item.description})` : ""}</a><ArrowUpRight size={15} className="external"/></div>
            <button className="icon-button" title="Edit item quantity" onClick={() => {setEditing(item.id); setQuantity(String(item.quantity));}}><MoreVertical size={19}/></button>
          </div>)}
          {filteredItems.length === 0 && <div className="empty">No matching items.</div>}
        </div>
        <div className="table-card quantity-card">
          <div className="table-heading">CURRENT STOCK</div>
          <div className="table-spacer"/>
          {filteredItems.map(item => <div className="quantity-row" key={item.id}>
            {editing === item.id ? <div className="edit-inline"><input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} aria-label="New quantity"/><button onClick={() => saveQuantity(item)}>Save</button><button className="cancel" onClick={() => setEditing(null)}>×</button></div> :
              <><span>{item.quantity}</span><button className="edit-button" title="Edit stock" onClick={() => {setEditing(item.id); setQuantity(String(item.quantity));}}><Pencil size={16}/></button></>}
          </div>)}
        </div>
        <aside className="valuation-card"><span className="valuation-label">TOTAL STOCK VALUE</span><strong>₹{(stockValue(items) / 10000000).toFixed(2)} Cr</strong><b>Stock Valuation</b><div className="valuation-foot"><TrendingUp size={15}/> Live inventory estimate</div></aside>
      </div>}

      {step === 2 && <div className="history-card">
        <div className="history-title"><div className="history-icon"><History/></div><div><h2>Stock Movement History</h2><p>A clear audit trail of every stock change</p></div><div className="history-count">{filteredMovements.length} records</div></div>
        <div className="history-tools"><Search size={17}/><input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search by date, activity, item or user..." aria-label="Search movement history"/></div>
        <div className="table-scroll"><table><thead><tr><th>DATE</th><th>CHANGED VIA</th><th>ITEM</th><th>CHANGE QUANTITY</th><th>CHANGED BY</th></tr></thead><tbody>
          {filteredMovements.map(m => <tr key={m.id}><td>{m.created_at}</td><td><span className="activity">{m.changed_via}</span></td><td>{m.item_name || "Inventory item"}</td><td className={Number(m.change_quantity) >= 0 ? "positive" : "negative"}>{Number(m.change_quantity) > 0 ? "+" : ""}{Number(m.change_quantity).toFixed(2)}</td><td>{m.changed_by}</td></tr>)}
          {!filteredMovements.length && <tr><td colSpan="5" className="empty">No stock movements found.</td></tr>}
        </tbody></table></div>
      </div>}

      {step === 3 && <div className="smart-grid">
        <div className="smart-card main-insight"><div className="smart-icon green"><TrendingUp/></div><p className="eyebrow">INVENTORY VALUE</p><h2>₹{money(stockValue(items))}</h2><p>Estimated value across {items.length} inventory items.</p><div className="insight-tag">Based on current quantity × unit price</div></div>
        <div className="smart-card"><div className="smart-icon blue"><Boxes/></div><p className="eyebrow">TOTAL STOCK UNITS</p><h2>{money(items.reduce((s, i) => s + Number(i.quantity || 0), 0))}</h2><p>Units currently recorded across all items.</p></div>
        <div className="smart-card"><div className="smart-icon purple"><History/></div><p className="eyebrow">MOVEMENT RECORDS</p><h2>{movements.length}</h2><p>Stock movement entries available in history.</p></div>
        <div className="smart-card recommendations"><div className="smart-icon amber"><Sparkles/></div><p className="eyebrow">SMART SUGGESTIONS</p><h3>Keep your stock data current</h3><p>Review quantities regularly and log every inward, outward, or manual adjustment to improve inventory accuracy.</p><button className="secondary-action" onClick={() => setStep(1)}>Review stock <ArrowRight size={16}/></button></div>
        <div className="smart-card recommendations"><div className="smart-icon green"><PackageCheck/></div><p className="eyebrow">DATA QUALITY</p><h3>Inventory at a glance</h3><p>{items.filter(i => Number(i.quantity) === 0).length ? `${items.filter(i => Number(i.quantity) === 0).length} item(s) are out of stock. Review replenishment needs.` : "All listed items currently have stock on hand."}</p><button className="secondary-action" onClick={() => setStep(2)}>View movement history <ArrowRight size={16}/></button></div>
      </div>}
    </section>

    <footer className="step-footer">
      {step > 1 ? <button className="back-button" onClick={() => setStep(step - 1)}><ArrowLeft size={17}/> Back</button> : <div className="footer-spacer"/>}
      <div className="stepper">
        {[["Stock count and valuation", <Boxes size={17}/>], ["Stock movement history", <History size={17}/>], ["Smart Features", <Sparkles size={17}/>]].map(([label, icon], index) => <button key={label} className={`step ${step === index + 1 ? "active" : ""} ${step > index + 1 ? "complete" : ""}`} onClick={() => setStep(index + 1)}><span className="step-number">{step > index + 1 ? "✓" : index + 1}</span><span className="step-label">{label}</span></button>)}
      </div>
      {step < 3 ? <button className="next-button" onClick={() => setStep(step + 1)}>Next <ArrowRight size={19}/></button> : <button className="next-button" onClick={() => { setStep(1); setSearch(""); }}><Download size={17}/> Back to overview</button>}
    </footer>
    <p className="page-note">StockWise Inventory · Accurate stock. Clear history. Better decisions.</p>
  </main>;
}
