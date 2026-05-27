const key='maintenance_demo_requests';
const demos=[
{tenantName:'Sarah Johnson',address:'214 Oak Ridge Drive',unit:'B',category:'Plumbing',description:'The cabinet under my kitchen sink is wet and water is dripping.',activeDamage:'Yes',hazard:'Yes',safeAccess:'Yes',createdAt:new Date().toISOString(),status:'New'},
{tenantName:'Mike Turner',address:'89 Pine Street',unit:'12',category:'HVAC',description:'AC is running but not cooling and it is very hot today.',activeDamage:'No',hazard:'Yes',safeAccess:'Yes',createdAt:new Date().toISOString(),status:'Ready for Dispatch'},
{tenantName:'Laura Kim',address:'37 Meadow Ln',unit:'3A',category:'Plumbing',description:'Toilet is clogged but not overflowing.',activeDamage:'No',hazard:'No',safeAccess:'Yes',createdAt:new Date().toISOString(),status:'Needs More Info'},
{tenantName:'Daniel Cruz',address:'440 River Ave',unit:'5',category:'Electrical',description:'One bedroom outlet is not working. No smoke or sparks.',activeDamage:'No',hazard:'No',safeAccess:'Yes',createdAt:new Date().toISOString(),status:'New'}
];
function getData(){const d=localStorage.getItem(key);if(d)return JSON.parse(d);localStorage.setItem(key,JSON.stringify(demos.map(triageRequest)));return JSON.parse(localStorage.getItem(key));}
function saveData(v){localStorage.setItem(key,JSON.stringify(v));}
function triageRequest(r){
 const desc=(r.description||'').toLowerCase();
 const vague=desc.split(' ').length<4;
 const uncertain=[r.activeDamage,r.hazard,r.safeAccess].filter(x=>x==='Not sure').length>=2;
 let urgency='Routine';
 if(r.activeDamage==='Yes'||r.hazard==='Yes'||desc.includes('sparks')||desc.includes('smoke')||desc.includes('sewage')) urgency='Emergency';
 else if(r.category==='HVAC'&&desc.includes('not cooling')) urgency='Same-Day';
 else if(vague||uncertain) urgency='Needs More Info';
 let vendor='Property manager review';
 const vm={'Plumbing':'Plumber','HVAC':'HVAC technician','Electrical':'Electrician','Appliance':'Appliance repair','Doors / Locks':'Locksmith','Pest':'Pest control','General Maintenance':'Handyman'};
 vendor=vm[r.category]||vendor;
 const next=urgency==='Emergency'?'Dispatch emergency '+vendor.toLowerCase()+' and instruct tenant to turn off shutoff valve if safe.':urgency==='Same-Day'?'Schedule same-day '+r.category+' inspection.':urgency==='Needs More Info'?'Ask tenant for photo and clarifying details before dispatch.':'Create routine work order.';
 const tenantReply=urgency==='Emergency'?'Thanks for reporting this. Your request has been marked urgent and our property team is being notified now.':'Thanks for your request. We have logged it and will follow up with scheduling details shortly.';
 const summary=`${r.tenantName} reported: ${r.description}`;
 return {...r,urgency,vendor,next,tenantReply,managerAlert:`${urgency}: ${r.category} issue at ${r.address} Unit ${r.unit}.`,workOrder:`${r.category} issue at ${r.address} Unit ${r.unit}. Tenant notes: ${r.description}. Access safe: ${r.safeAccess}.`,tenantSummary:summary,status:r.status|| (urgency==='Needs More Info'?'Needs More Info':'Ready for Dispatch')};
}
function renderResult(){const raw=JSON.parse(sessionStorage.getItem('last_result')||'null');if(!raw)return;const r=raw;document.getElementById('result').innerHTML=`<p><b>Urgency Level:</b> <span class='badge urgency-${r.urgency}'>${r.urgency}</span></p><p><b>Issue Category:</b> ${r.category}</p><p><b>Recommended Vendor Type:</b> ${r.vendor}</p><p><b>Tenant Summary:</b> ${r.tenantSummary}</p><p><b>Manager Work Order Summary:</b> ${r.workOrder}</p><p><b>Recommended Next Step:</b> ${r.next}</p><p><b>Suggested Tenant Reply:</b> ${r.tenantReply}</p><p><b>Suggested Manager Alert:</b> ${r.managerAlert}</p>`;}
function renderDashboard(){const list=document.getElementById('list');if(!list)return;const data=getData();list.innerHTML=`<table><thead><tr><th>Tenant</th><th>Property / Unit</th><th>Category</th><th>Urgency</th><th>Status</th><th>Vendor</th><th>Summary</th><th>Created</th></tr></thead><tbody>${data.map((r,i)=>`<tr data-i='${i}'><td>${r.tenantName}</td><td>${r.address} / ${r.unit}</td><td>${r.category}</td><td><span class='badge urgency-${r.urgency}'>${r.urgency}</span></td><td>${r.status}</td><td>${r.vendor}</td><td class='small'>${r.description}</td><td>${new Date(r.createdAt).toLocaleString()}</td></tr>`).join('')}</tbody></table>`;
 list.querySelectorAll('tr[data-i]').forEach(tr=>tr.onclick=()=>{const r=data[tr.dataset.i];document.getElementById('detail').innerHTML=`<p><b>${r.tenantName}</b> — ${r.address} Unit ${r.unit}</p><p><b>Work Order:</b> ${r.workOrder}</p><p><b>Next Step:</b> ${r.next}</p><p><b>Tenant Reply:</b> ${r.tenantReply}</p><p><b>Manager Alert:</b> ${r.managerAlert}</p>`});
}
const f=document.getElementById('requestForm');if(f){f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f);const r=Object.fromEntries(fd.entries());r.createdAt=new Date().toISOString();const t=triageRequest(r);sessionStorage.setItem('last_result',JSON.stringify(t));const data=getData();data.unshift(t);saveData(data);location.href='result.html';};}
if(document.getElementById('result'))renderResult();
if(document.getElementById('list')){renderDashboard();document.getElementById('loadDemo').onclick=()=>{const data=getData();data.unshift(triageRequest(demos[0]));saveData(data);renderDashboard();};}
