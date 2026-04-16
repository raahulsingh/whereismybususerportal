
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<div style="padding:8px;border:1px solid #ddd;margin-bottom:10px">
  <label>From:
    <input id="srcInput" placeholder="Type stop name…" oninput="lookupStop('src')" />
    <select id="srcSelect"></select>
  </label>
  <label>To:
    <input id="dstInput" placeholder="Type stop name…" oninput="lookupStop('dst')" />
    <select id="dstSelect"></select>
  </label>
  <button onclick="runPlan()">Plan</button>
</div>

<div id="planResults"></div>

<script>
async function lookupStop(kind){
  const q = document.getElementById(kind+'Input').value.trim();
  if(!q || q.length<2) return;
  const res = await fetch('/api/stops/search?q='+encodeURIComponent(q));
  const stops = await res.json();
  const sel = document.getElementById(kind+'Select');
  sel.innerHTML = '';
  stops.forEach(s=>{
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + ' (Route '+ s.route.name +')';
    sel.appendChild(opt);
  });
}

async function runPlan(){
  const src = document.getElementById('srcSelect').value;
  const dst = document.getElementById('dstSelect').value;
  if(!src || !dst){ alert('Pick source and destination'); return; }
  const res = await fetch(`/api/plan?srcId=${src}&dstId=${dst}`);
  const data = await res.json();
  const box = document.getElementById('planResults');
  box.innerHTML = '';
  if(!data.options || data.options.length===0){
    box.textContent = 'No direct route found (same-route only in MVP).';
    return;
  }
  data.options.forEach(opt=>{
    const div = document.createElement('div');
    div.style.border='1px solid #ddd'; div.style.padding='8px'; div.style.margin='8px 0';
    const buses = opt.nextBuses.map(b=>
      `#${b.busCode} → ETA ${b.etaMinToSource} min (dist ${b.distanceKmToSource.toFixed(2)} km)`
    ).join('<br>');
    div.innerHTML = `
      <b>Route ${opt.routeName}</b><br>
      ${opt.source.name} → ${opt.destination.name}<br>
      <div>${buses || 'No live buses in the last few minutes.'}</div>
      <button onclick="justDeparted(${opt.source.id}, ${opt.destination.id}, this)">Show just departed</button>
    `;
    box.appendChild(div);
  });
}

async function justDeparted(srcId, dstId, btn){
  btn.disabled = true;
  const res = await fetch(`/api/departed?srcId=${srcId}&dstId=${dstId}`);
  const data = await res.json();
  const p = document.createElement('div');
  p.style.marginTop='6px';
  if(!data.departed || data.departed.length===0){
    p.textContent='No buses departed recently.';
  }else{
    p.innerHTML = data.departed.map(d =>
      `#${d.busCode} left ${d.minutesAgo} min ago · ETA to dst ~${d.etaMinToDestination} min`
    ).join('<br>');
  }
  btn.parentElement.appendChild(p);
}
</script>
