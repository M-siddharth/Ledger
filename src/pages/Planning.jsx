import React, { useMemo, useState } from "react";
import { fmt, CATEGORIES } from "../lib/helpers";
import { Empty } from "../components/UI";
import { Plus, ArrowLeftRight, Target, PiggyBank, Pencil, Trash2, Wallet } from "lucide-react";

const today = () => { const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); };
const money = v => Math.round(Number(v)*100)/100;
export default function Planning({ data }) {
  const [adjust, setAdjust] = useState({amount:"",method:"cash",reason:"",occurred_on:today()});
  const [transfer, setTransfer] = useState({amount:"",from_method:"cash",to_method:"digital",notes:""});
  const [budget, setBudget] = useState({category:"Food",amount:"",month_start:today().slice(0,7)+"-01"});
  const [goal, setGoal] = useState({name:"",target_amount:"",current_amount:"0",target_date:""});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [budgetMonth,setBudgetMonth]=useState(today().slice(0,7));
  const categories=[...new Set([...CATEGORIES,...(data.customCategories||[]).filter(c=>!c.archived).map(c=>c.name)])].sort();
  const run=async(key,fn,payload,reset=()=>{})=>{if(busy)return;setBusy(key);setMessage("");try{const error=await fn(payload);if(error)throw error;reset();setMessage("Saved successfully. History has been updated.");}catch(e){setMessage(e?.message||"Could not save. Check the database migration and try again.");}finally{setBusy("");}};
  const spendFor=(category,month)=>data.expenses.filter(e=>e.paid&&e.category===category&&String(e.created_at).slice(0,7)===month).reduce((s,e)=>s+Number(e.amount),0);
  const budgets=data.budgets.filter(b=>String(b.month_start).slice(0,7)===budgetMonth);
  const edit=async(table,row,fields)=>{const patch={};for(const [key,label] of fields){const val=window.prompt(label,row[key]??"");if(val===null)return;patch[key]=val;}if(patch.amount!==undefined||patch.target_amount!==undefined||patch.current_amount!==undefined){for(const k of ["amount","target_amount","current_amount"])if(patch[k]!==undefined)patch[k]=money(patch[k]);}if(patch.target_date==="")patch.target_date=null;if(table==="balance_adjustments"&&patch.amount===0){window.alert("Amount cannot be zero.");return;}if((patch.amount!==undefined||patch.target_amount!==undefined)&&Number(patch.amount??patch.target_amount)<=0){window.alert("Enter a positive amount.");return;}if(!window.confirm("Save these changes? They will be recorded in Activity History."))return;await run("edit",()=>data.updatePlanningRecord(table,row.id,patch));};
  const remove=async(table,row,label)=>{if(!window.confirm("Delete "+label+"? The deletion will remain in Activity History."))return;await run("delete",()=>data.deletePlanningRecord(table,row.id));};
  const history=[...(data.adjustments||[]).map(x=>({...x,_table:"balance_adjustments",_label:"Adjustment"})),...(data.transfers||[]).map(x=>({...x,_table:"balance_transfers",_label:"Transfer"}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const planningAudit=(data.activityLog||[]).filter(x=>["balance_adjustments","balance_transfers","budgets","savings_goals"].includes(x.table_name));
  return <>
    <div className="stat-row">
      <div className="stat-card"><div className="stat-label">Cash balance</div><div className="stat-value mono">{fmt(data.stats.cashBalance)}</div></div>
      <div className="stat-card"><div className="stat-label">Digital balance</div><div className="stat-value mono">{fmt(data.stats.digitalBalance)}</div></div>
      <div className="stat-card"><div className="stat-label">Net debt position</div><div className="stat-value mono">{data.stats.netDebt>=0?"You are owed ":"You owe "}{fmt(Math.abs(data.stats.netDebt))}</div></div>
    </div>
    {message&&<div className="auth-message" role="status">{message}</div>}
    <div className="panel">
      <div className="panel-title"><Plus size={16}/> Balance adjustment</div>
      <p className="hint">Correct your real account balance. This does not count as income or spending.</p>
      <div className="form-grid">
        <div className="field"><label>Amount (+ / −)</label><input type="number" step="0.01" value={adjust.amount} onChange={e=>setAdjust({...adjust,amount:e.target.value})} placeholder="-25.50"/></div>
        <div className="field"><label>Account</label><select value={adjust.method} onChange={e=>setAdjust({...adjust,method:e.target.value})}><option value="cash">Cash</option><option value="digital">Digital</option></select></div>
        <div className="field"><label>Date</label><input type="date" value={adjust.occurred_on} onChange={e=>setAdjust({...adjust,occurred_on:e.target.value})}/></div>
        <div className="field"><label>Reason</label><input value={adjust.reason} onChange={e=>setAdjust({...adjust,reason:e.target.value})} placeholder="Balance correction"/></div>
      </div>
      <button className="primary-btn" disabled={!!busy||!adjust.amount||!adjust.reason.trim()||!Number(adjust.amount)} onClick={()=>run("adjust",data.addBalanceAdjustment,{...adjust,amount:money(adjust.amount)},()=>setAdjust({...adjust,amount:"",reason:""}))}>{busy==="adjust"?"Saving…":"Save adjustment"}</button>
      <div className="history-list">{(data.adjustments||[]).map(a=><div className="ledger-row" key={a.id}><div className="row-main"><b>{a.reason}</b><div className="row-meta">{a.method} · {a.occurred_on}</div></div><b className="row-amount">{fmt(a.amount)}</b><button className="icon-btn" title="Edit" onClick={()=>edit("balance_adjustments",a,[["amount","Amount"],["method","Account (cash/digital)"],["reason","Reason"],["occurred_on","Date (YYYY-MM-DD)"]])}><Pencil size={14}/></button><button className="icon-btn" onClick={()=>remove("balance_adjustments",a,"adjustment")}><Trash2 size={14}/></button></div>)}</div>
    </div>
    <div className="panel">
      <div className="panel-title"><ArrowLeftRight size={16}/> Cash ↔ Digital transfer</div>
      <p className="hint">Transfers are excluded from income and expenses.</p>
      <div className="form-grid">
        <div className="field"><label>Amount</label><input type="number" min="0.01" step="0.01" value={transfer.amount} onChange={e=>setTransfer({...transfer,amount:e.target.value})}/></div>
        <div className="field"><label>From</label><select value={transfer.from_method} onChange={e=>setTransfer({...transfer,from_method:e.target.value,to_method:e.target.value==="cash"?"digital":"cash"})}><option value="cash">Cash</option><option value="digital">Digital</option></select></div>
        <div className="field"><label>To</label><select value={transfer.to_method} onChange={e=>setTransfer({...transfer,to_method:e.target.value})}><option value="digital">Digital</option><option value="cash">Cash</option></select></div>
        <div className="field"><label>Note</label><input value={transfer.notes} onChange={e=>setTransfer({...transfer,notes:e.target.value})}/></div>
      </div>
      <button className="primary-btn" disabled={!!busy||!transfer.amount||Number(transfer.amount)<=0||transfer.from_method===transfer.to_method} onClick={()=>run("transfer",data.addTransfer,{...transfer,amount:money(transfer.amount)},()=>setTransfer({...transfer,amount:"",notes:""}))}>{busy==="transfer"?"Saving…":"Record transfer"}</button>
      {history.filter(x=>x._table==="balance_transfers").map(t=><div className="ledger-row" key={t.id}><div className="row-main"><b>{t.from_method} → {t.to_method}</b><div className="row-meta">{t.notes||"Account transfer"} · {new Date(t.created_at).toLocaleString()}</div></div><b className="row-amount">{fmt(t.amount)}</b><button className="icon-btn" onClick={()=>edit("balance_transfers",t,[["amount","Amount"],["from_method","From (cash/digital)"],["to_method","To (cash/digital)"],["notes","Note"]])}><Pencil size={14}/></button><button className="icon-btn" onClick={()=>remove("balance_transfers",t,"transfer")}><Trash2 size={14}/></button></div>)}
    </div>
    <div className="panel">
      <div className="panel-title"><PiggyBank size={16}/> Monthly category budgets</div>
      <div className="form-grid">
        <div className="field"><label>Category</label><select value={budget.category} onChange={e=>setBudget({...budget,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="field"><label>Monthly limit (₹)</label><input type="number" min="0.01" step="0.01" value={budget.amount} onChange={e=>setBudget({...budget,amount:e.target.value})}/></div>
        <div className="field"><label>Month</label><input type="month" value={budget.month_start.slice(0,7)} onChange={e=>setBudget({...budget,month_start:e.target.value+"-01"})}/></div>
      </div>
      <div className="hint">Paid spending in this category: {fmt(spendFor(budget.category,budget.month_start.slice(0,7)))}</div>
      <button className="primary-btn" disabled={!!busy||!budget.amount||Number(budget.amount)<=0} onClick={()=>run("budget",data.addBudget,{...budget,amount:money(budget.amount)},()=>setBudget({...budget,amount:""}))}>{busy==="budget"?"Saving…":"Save monthly budget"}</button>
      <div className="field" style={{marginTop:18,maxWidth:220}}><label>View budgets for month</label><input type="month" value={budgetMonth} onChange={e=>setBudgetMonth(e.target.value)}/></div>
      {budgets.length===0?<Empty>No budgets set for this month.</Empty>:budgets.map(b=>{const spent=spendFor(b.category,budgetMonth);const remain=Number(b.amount)-spent;const pct=Math.min(100,spent/Number(b.amount)*100);return <div key={b.id} className="planning-record"><div className="record-head"><b>{b.category}</b><b>{fmt(spent)} / {fmt(b.amount)}</b></div><div className="progress-track"><div className="progress-fill" style={{width:pct+"%",background:remain<0?"var(--rust)":"var(--forest)"}}/></div><div className="row-meta">{remain>=0?fmt(remain)+" remaining":"Exceeded by "+fmt(-remain)}</div><div className="record-actions"><button className="icon-btn" onClick={()=>edit("budgets",b,[["category","Category"],["amount","Monthly limit"],["month_start","Month start (YYYY-MM-DD)"]])}><Pencil size={14}/></button><button className="icon-btn" onClick={()=>remove("budgets",b,"budget")}><Trash2 size={14}/></button></div></div>})}
    </div>
    <div className="panel">
      <div className="panel-title"><Target size={16}/> Savings goals</div>
      <div className="form-grid">
        <div className="field"><label>Goal name</label><input value={goal.name} onChange={e=>setGoal({...goal,name:e.target.value})} placeholder="Emergency fund"/></div>
        <div className="field"><label>Target amount</label><input type="number" min="0.01" step="0.01" value={goal.target_amount} onChange={e=>setGoal({...goal,target_amount:e.target.value})}/></div>
        <div className="field"><label>Already saved</label><input type="number" min="0" step="0.01" value={goal.current_amount} onChange={e=>setGoal({...goal,current_amount:e.target.value})}/></div>
        <div className="field"><label>Target date</label><input type="date" value={goal.target_date} onChange={e=>setGoal({...goal,target_date:e.target.value})}/></div>
      </div>
      <button className="primary-btn" disabled={!!busy||!goal.name.trim()||!goal.target_amount||Number(goal.target_amount)<=0} onClick={()=>run("goal",data.addSavingsGoal,{...goal,target_amount:money(goal.target_amount),current_amount:money(goal.current_amount||0),target_date:goal.target_date||null},()=>setGoal({name:"",target_amount:"",current_amount:"0",target_date:""}))}>{busy==="goal"?"Saving…":"Add savings goal"}</button>
      {(data.savingsGoals||[]).length===0?<Empty>No savings goals yet.</Empty>:data.savingsGoals.map(g=>{const pct=Math.min(100,Number(g.current_amount)/Number(g.target_amount)*100);return <div className="planning-record" key={g.id}><div className="record-head"><b>{g.name}</b><b>{pct.toFixed(0)}%</b></div><div className="row-meta">{fmt(g.current_amount)} saved of {fmt(g.target_amount)}{g.target_date?" · target "+g.target_date:""}</div><div className="progress-track"><div className="progress-fill" style={{width:pct+"%"}}/></div><div className="record-actions"><button className="icon-btn" onClick={()=>edit("savings_goals",g,[["name","Goal name"],["target_amount","Target amount"],["current_amount","Already saved"],["target_date","Target date (YYYY-MM-DD, blank allowed)"]])}><Pencil size={14}/></button><button className="icon-btn" onClick={()=>remove("savings_goals",g,"savings goal")}><Trash2 size={14}/></button></div></div>})}
    </div>
    <div className="panel">
      <div className="panel-title"><Wallet size={16}/> Planning change history</div>
      <p className="hint">Every successful edit and deletion is also retained in Activity History.</p>
      {history.length===0?<Empty>No planning activity yet.</Empty>:history.map(x=><div className="ledger-row" key={x._table+x.id}><div className="row-main"><b>{x._label}</b><div className="row-meta">{x.reason||x.notes||x.method||""} · {new Date(x.created_at).toLocaleString()}</div></div><b className="row-amount">{fmt(x.amount)}</b></div>)}
    </div>
  </>;
}
