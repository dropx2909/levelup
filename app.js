const STORE = 'level-up-rpg-v1';
const stats = {strength:{name:'Сила',icon:'⚔️',color:'red'},knowledge:{name:'Знания',icon:'🧠',color:'blue'},endurance:{name:'Выносливость',icon:'⚡',color:'orange'},discipline:{name:'Дисциплина',icon:'🎯',color:'purple'}};
const $ = s => document.querySelector(s);
const today = () => new Date().toISOString().slice(0,10);
const read = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {actions:[]}; } catch { return {actions:[]}; } };
const save = data => localStorage.setItem(STORE, JSON.stringify(data));
const escape = value => { const e=document.createElement('div'); e.textContent=value; return e.innerHTML; };
const level = points => ({number:Math.floor(points/10)+1,progress:points%10});
const toast = message => { const el=$('#toast'); el.textContent=message; el.classList.add('visible'); setTimeout(()=>el.classList.remove('visible'),2400); };
const formatDate = value => new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`));

function render() {
  const data=read(), totals=Object.fromEntries(Object.keys(stats).map(key=>[key,0]));
  data.actions.forEach(a=>totals[a.stat]=(totals[a.stat]||0)+a.points);
  const total=Object.values(totals).reduce((sum,n)=>sum+n,0), hero=level(total);
  $('#hero-level').textContent=hero.number; $('#total-points').textContent=`${total} XP всего`;
  $('#today-count').textContent=data.actions.filter(a=>a.date===today()).length;
  $('#stats').innerHTML=Object.entries(stats).map(([key,s])=>{const x=level(totals[key]);return `<article class="stat-card ${s.color}"><div class="stat-title"><span>${s.icon}</span><div><h3>${s.name}</h3><small>Уровень ${x.number}</small></div><b>${totals[key]}</b></div><div class="bar"><i style="width:${x.progress*10}%"></i></div><p>${x.progress} / 10 до следующего уровня</p></article>`}).join('');
  const groups=data.actions.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).reduce((out,a)=>((out[a.date]??=[]).push(a),out),{});
  $('#history').innerHTML=Object.keys(groups).length?Object.entries(groups).map(([day,items])=>`<div class="history-day"><h3>${formatDate(day)}</h3>${items.map(a=>`<div class="history-item"><span class="history-icon">${stats[a.stat].icon}</span><span class="history-title">${escape(a.title)}<small>${stats[a.stat].name}</small></span><b>+${a.points}</b><button class="delete" data-id="${a.id}" aria-label="Удалить">×</button></div>`).join('')}</div>`).join(''):'<div class="empty">Пока нет действий. Начни с первого шага выше.</div>';
}
function addAction({title,stat,points,date}) { const data=read(); data.actions.push({id:Date.now()+Math.floor(Math.random()*1000),title,stat,points:Number(points),date}); save(data); render(); }

document.querySelectorAll('.quick-action').forEach(button=>button.addEventListener('click',()=>{addAction({title:button.dataset.title,stat:button.dataset.stat,points:1,date:today()});toast('Опыт добавлен! ✨');}));
const dialog=$('#action-dialog'); $('#open-custom').onclick=()=>dialog.showModal(); $('#close-dialog').onclick=()=>dialog.close(); $('#action-date').value=today();
$('#action-form').addEventListener('submit',event=>{event.preventDefault();addAction({title:$('#action-title').value.trim(),stat:$('#action-stat').value,points:$('#action-points').value,date:$('#action-date').value});event.target.reset();$('#action-date').value=today();dialog.close();toast('Действие добавлено! ✨');});
$('#history').addEventListener('click',event=>{const id=Number(event.target.dataset.id);if(!id||!confirm('Удалить это действие?'))return;const data=read();data.actions=data.actions.filter(a=>a.id!==id);save(data);render();toast('Действие удалено');});
$('#export-data').onclick=()=>{const blob=new Blob([JSON.stringify(read(),null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`level-up-backup-${today()}.json`;link.click();URL.revokeObjectURL(link.href);toast('Копия скачана');};
$('#import-data').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const copy=JSON.parse(reader.result);if(!Array.isArray(copy.actions))throw Error();save(copy);render();toast('Прогресс восстановлен!');}catch{toast('Не удалось прочитать этот файл.');}event.target.value='';};reader.readAsText(file);});
$('#reset-data').onclick=()=>{if(confirm('Точно удалить весь прогресс с этого устройства? Сначала лучше скачай резервную копию.')){localStorage.removeItem(STORE);render();toast('Данные удалены');}};
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
render();
