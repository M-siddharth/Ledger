import React, { useMemo, useState } from "react";
import { fmt, CATEGORIES } from "../lib/helpers";
import { Panel, Empty } from "../components/UI";
import { Plus, ArrowLeftRight, Target, PiggyBank } from "lucide-react";

const today = () => new Date().toISOString().slice(0,10);
export default function Planning({ data }) {
  const [adjust, setAdjust] = useState({amount:"",method:"cash",reason:"",occurred_on:today()});
  const [transfer, setTransfer] = useState({amount:"",from_method:"cash",to_method:"digital",notes:""});
  const [budget, setBudget] = useState({category:"Food",amount:"",month_start:today().slice(0,7)+"-01"});
  const [goal, setGoal] = useState({name:"",target_amount:"",current_amount:"0",target_date:""});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const save = async (fn, payload, reset) => {
    if (busy) return;
    setBusy(true); setMessage("");
    const error = await fn(payload);
    setBusy(false);
    if (error) setMessage(error.message || "Could not save. Apply migration_v4.sql in Supabase first.");
    else { reset(); setMessage("Saved successfully."); }
  };
  const monthExpenses = useMemo(() => data.expenses.filter(e => e.paid && e.created_at.slice(0,7) === budget.month_start.slice(0,7)), [data.expenses,budget.month_start]);
  const used = monthExpenses.filter(e => e.category === budget.category).reduce((s,e)=>s+Number(e.amount),0);
  return <>
    <div className="stat-row">
      <div className="stat-card"><div className="stat-label">Cash balance</div><div className="stat-value mono">{fmt(data.stats.cashBalance)}</div></div>
      <div className="stat-card"><div className="stat-label">Digital balance</div><div className="stat-value mono">{fmt(data.stats.digitalBalance)}</div></div>
      <div className="stat-card"><div className="stat-label">Net debt position</div><div className="stat-value mono">{data.stats.netDebt >= 0 ? "You are owed " : "You owe "}{fmt(Math.abs(data.stats.netDebt))}</div></div>
    </div>
    {message && <div className="auth-message" role="status" style={{background:message.startsWith("Saved")?"#DDE8DC":"#F1DCD3",color:message.startsWith("Saved")?"var(--forest)":"var(--rust)"}}>{message}</div>}
    <div className="panel">
      <div className="panel-title"><Plus size={16}/> Balance adjustment</div>
      <p className="hint">Record a correction to your real cash/digital balance. This is not income or an expense.</p>
      <div className="form-grid">
        <div className="field"><label>Amount (positive or negative)</label><input type="number" step="0.01" value={adjust.amount} onChange={e=>setAdjust({...adjust,amount:e.target.value})} placeholder="e.g. -25.50"/></div>
        <div className="field"><label>Account</label><select value={adjust.method} onChange={e=>setAdjust({...adjust,method:e.target.value})}><option value="cash">Cash</option><option value="digital">Digital</option></select></div>
        <div className="field"><label>Date</label><input type="date" value={adjust.occurred_on} onChange={e=>setAdjust({...adjust,occurred_on:e.target.value})}/></div>
        <div className="field"><label>Reason</label><input value={adjust.reason} onChange={e=>setAdjust({...adjust,reason:e.target.value})} placeholder="Opening balance correction"/></div>
      </div>
      <button className="primary-btn" disabled={busy||!adjust.amount||!adjust.reason.trim()||Number(adjust.amount)===0} onClick={()=>save(data.addBalanceAdjustment, {...adjust,amount:Math.round(Number(adjust.amount)*100)/100}, ()=>setAdjust({...adjust,amount:"",reason:""}))}>{busy?"Saving…":"Save adjustment"}</button>
    </div>
    <div className="panel">
      <div className="panel-title"><ArrowLeftRight size={16}/> Cash ↔ Digital transfer</div>
      <p className="hint">Moves money between your own accounts; it is excluded from income and spending. The transfer is saved as one database operation.</p>
      <div className="form-grid">
        <div className="field"><label>Amount</label><input type="number" min="0.01" step="0.01" value={transfer.amount} onChange={e=>setTransfer({...transfer,amount:e.target.value})}/></div>
        <div className="field"><label>From</label><select value={transfer.from_method} onChange={e=>setTransfer({...transfer,from_method:e.target.value,to_method:e.target.value==="cash"?"digital":"cash"})}><option value="cash">Cash</option><option value="digital">Digital</option></select></div>
        <div className="field"><label>To</label><select value={transfer.to_method} onChange={e=>setTransfer({...transfer,to_method:e.target.value})}><option value="digital">Digital</option><option value="cash">Cash</option></select></div>
        <div className="field"><label>Note (optional)</label><input value={transfer.notes} onChange={e=>setTransfer({...transfer,notes:e.target.value})}/></div>
      </div>
      <button className="primary-btn" disabled={busy||!transfer.amount||Number(transfer.amount)<=0||transfer.from_method===transfer.to_method} onClick={()=>save(data.addTransfer,{...transfer,amount:Math.round(Number(transfer.amount)*100)/100},()=>setTransfer({...transfer,amount:"",notes:""}))}>{busy?"Saving…":"Record transfer"}</button>
    </div>
    <div className="panel">
      <div className="panel-title"><PiggyBank size={16}/> Monthly category budget</div>
      <div className="form-grid">
        <div className="field"><label>Category</label><select value={budget.category} onChange={e=>setBudget({...budget,category:e.target.value})}>{[...new Set([...CATEGORIES,...data.customCategories.filter(c=>!c.archived).map(c=>c.name)])].map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="field"><label>Monthly limit (₹)</label><input type="number" min="0.01" step="0.01" value={budget.amount} onChange={e=>setBudget({...budget,amount:e.target.value})}/></div>
        <div className="field"><label>Month</label><input type="month" value={budget.month_start.slice(0,7)} onChange={e=>setBudget({...budget,month_start:e.target.value+"-01"})}/></div>
      </div>
      <div className="hint">Current paid spend in {budget.category}: {fmt(used)}{budget.amount ? " · Remaining after save: "+fmt(Number(budget.amount)-used):""}</div>
      <button className="primary-btn" disabled={busy||!budget.amount||Number(budget.amount)<=0} onClick={()=>save(data.addBudget,{...budget,amount:Math.round(Number(budget.amount)*100)/100},()=>{})}>{busy?"Saving…":"Save budget"}</button>
      <div style={{marginTop:14}}>{data.budgets.filter(b=>b.month_start.slice(0,7)===budget.month_start.slice(0,7)).map(b=>{const spent=data.expenses.filter(e=>e.paid&&e.category===b.category&&e.created_at.slice(0,7)===b.month_start.slice(0,7)).reduce((s,e)=>s+Number(e.amount),0);const pct=Math.min(100,spent/Number(b.amount)*100);return <div key={b.id} style={{padding:"9px 0",borderBottom:"1px solid var(--rule-light)"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><b>{b.category}</b><span>{fmt(spent)} / {fmt(b.amount)}</span></div><div style={{height:6,background:"#E6DFCE",borderRadius:8,marginTop:7,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:spent>Number(b.amount)?"var(--rust)":"var(--forest)"}}/></div>{spent>Number(b.amount)&&<small style={{color:"var(--rust)"}}>Budget exceeded by {fmt(spent-Number(b.amount))}</small>}</div>})}</div>
    </div>
    <div className="panel">
      <div className="panel-title"><Target size={16}/> Savings goals</div>
      <div className="form-grid">
        <div className="field"><label>Goal name</label><input value={goal.name} onChange={e=>setGoal({...goal,name:e.target.value})} placeholder="Emergency fund"/></div>
        <div className="field"><label>Target amount (₹)</label><input type="number" min="0.01" step="0.01" value={goal.target_amount} onChange={e=>setGoal({...goal,target_amount:e.target.value})}/></div>
        <div className="field"><label>Already saved (₹)</label><input type="number" min="0" step="0.01" value={goal.current_amount} onChange={e=>setGoal({...goal,current_amount:e.target.value})}/></div>
        <div className="field"><label>Target date (optional)</label><input type="date" value={goal.target_date} onChange={e=>setGoal({...goal,target_date:e.target.value})}/></div>
      </div>
      <button className="primary-btn" disabled={busy||!goal.name.trim()||!goal.target_amount||Number(goal.target_amount)<=0} onClick={()=>save(data.addSavingsGoal,{...goal,target_amount:Math.round(Number(goal.target_amount)*100)/100,current_amount:Math.round(Number(goal.current_amount||0)*100)/100,target_date:goal.target_date||null},()=>setGoal({name:"",target_amount:"",current_amount:"0",target_date:""}))}>{busy?"Saving…":"Add savings goal"}</button>
      {data.savingsGoals.length===0?<Empty>No savings goals yet.</Empty>:data.savingsGoals.map(g=>{const pct=Math.min(100,Number(g.current_amount)/Number(g.target_amount)*100);return <div key={g.id} style={{padding:"12px 0",borderBottom:"1px solid var(--rule-light)"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{g.name}</b><span className="mono">{pct.toFixed(0)}%</span></div><div style={{fontSize:12,color:"#6B655A",marginTop:4}}>{fmt(g.current_amount)} saved of {fmt(g.target_amount)}{g.target_date?" · due "+g.target_date:""}</div><div style={{height:6,background:"#E6DFCE",borderRadius:8,marginTop:8,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:"var(--forest)"}}/></div></div>})}
    </div>
  </>;
}
