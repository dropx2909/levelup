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
function setTheme(theme) { document.body.classList.toggle('dark', theme === 'dark'); $('#theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙'; }

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
$('#reset-data').onclick=()=>{if(confirm('Точно удалить весь прогресс с этого устройства??? Сначала лучше скачай резервную копию.')){localStorage.removeItem(STORE);render();toast('Данные удалены');}};
setTheme(localStorage.getItem(`${STORE}-theme`) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('#theme-toggle').onclick=()=>{const next=document.body.classList.contains('dark')?'light':'dark';localStorage.setItem(`${STORE}-theme`,next);setTheme(next);};

const gamesDialog=$('#games-dialog'), gameDialog=$('#game-dialog'), gameArea=$('#game-area'), target=$('#target'); let gameTimer, gameRunning=false, hits=0, seconds=20;
function moveTarget() { const maxX=gameArea.clientWidth-target.offsetWidth-12, maxY=gameArea.clientHeight-target.offsetHeight-12; target.style.left=`${6+Math.random()*maxX}px`; target.style.top=`${6+Math.random()*maxY}px`; }
function finishGame() { clearInterval(gameTimer); gameRunning=false; target.hidden=true; $('#start-game').textContent='Сыграть ещё раз'; const best=Math.max(Number(localStorage.getItem(`${STORE}-reaction-best`)||0),hits); localStorage.setItem(`${STORE}-reaction-best`,best); $('#reaction-best').textContent=best; $('#game-message').textContent=`Результат: ${hits} попаданий.`; }
$('#open-games').onclick=()=>gamesDialog.showModal(); $('#close-games').onclick=()=>gamesDialog.close();
$('#choose-reaction').onclick=()=>{gamesDialog.close();gameDialog.showModal();$('#reaction-best').textContent=localStorage.getItem(`${STORE}-reaction-best`)||'0';}; $('#close-game').onclick=()=>{clearInterval(gameTimer);gameRunning=false;gameDialog.close();};
$('#start-game').onclick=()=>{clearInterval(gameTimer);gameRunning=true;hits=0;seconds=20;$('#game-score').textContent=hits;$('#game-time').textContent=seconds;$('#game-message').hidden=true;target.hidden=false;$('#start-game').textContent='Идёт игра…';moveTarget();gameTimer=setInterval(()=>{seconds--;$('#game-time').textContent=seconds;if(seconds<=0)finishGame();},1000);};
target.onclick=()=>{if(!gameRunning)return;hits++;$('#game-score').textContent=hits;moveTarget();};

const tetrisDialog=$('#tetris-dialog'), canvas=$('#tetris-board'), ctx=canvas.getContext('2d'); const COLS=10, ROWS=18, BLOCK=24;
const SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]]; const COLORS=['#6d5dfc','#f5b544','#ed6b70','#549bf5','#ac70e8','#36ba8a','#e973b0'];
let board, piece, tetrisScore, tetrisTimer, tetrisRunning=false;
const emptyBoard=()=>Array.from({length:ROWS},()=>Array(COLS).fill(0));
function drawTetris(){ctx.fillStyle=document.body.classList.contains('dark')?'#131827':'#e9edf5';ctx.fillRect(0,0,canvas.width,canvas.height);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(board[y][x])drawBlock(x,y,board[y][x]);if(piece)piece.shape.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawBlock(piece.x+x,piece.y+y,piece.color)}));}
function drawBlock(x,y,color){ctx.fillStyle=COLORS[color-1];ctx.fillRect(x*BLOCK+1,y*BLOCK+1,BLOCK-2,BLOCK-2);}
function spawn(){const index=Math.floor(Math.random()*SHAPES.length);piece={shape:SHAPES[index].map(row=>[...row]),x:Math.floor((COLS-SHAPES[index][0].length)/2),y:0,color:index+1};if(collides())endTetris();}
function collides(dx=0,dy=0,shape=piece.shape){return shape.some((row,y)=>row.some((v,x)=>v&&(piece.x+x+dx<0||piece.x+x+dx>=COLS||piece.y+y+dy>=ROWS||(piece.y+y+dy>=0&&board[piece.y+y+dy][piece.x+x+dx]))));}
function merge(){piece.shape.forEach((row,y)=>row.forEach((v,x)=>{if(v&&piece.y+y>=0)board[piece.y+y][piece.x+x]=piece.color;}));let cleared=0;board=board.filter(row=>{if(row.every(Boolean)){cleared++;return false;}return true;});while(board.length<ROWS)board.unshift(Array(COLS).fill(0));if(cleared){tetrisScore+=cleared*100;$('#tetris-score').textContent=tetrisScore;}spawn();}
function tetrisStep(){if(!tetrisRunning)return;if(!collides(0,1))piece.y++;else merge();drawTetris();}
function moveTetris(direction){if(!tetrisRunning)return;if(direction==='rotate'){const rotated=piece.shape[0].map((_,i)=>piece.shape.map(row=>row[i]).reverse());if(!collides(0,0,rotated))piece.shape=rotated;}else{const dx=direction==='left'?-1:direction==='right'?1:0,dy=direction==='down'?1:0;if(!collides(dx,dy))piece.x+=dx,piece.y+=dy;else if(direction==='down')merge();}drawTetris();}
function endTetris(){clearInterval(tetrisTimer);tetrisRunning=false;const best=Math.max(Number(localStorage.getItem(`${STORE}-tetris-best`)||0),tetrisScore);localStorage.setItem(`${STORE}-tetris-best`,best);$('#tetris-best').textContent=best;$('#start-tetris').textContent='Сыграть ещё раз';}
function startTetris(){clearInterval(tetrisTimer);board=emptyBoard();tetrisScore=0;tetrisRunning=true;$('#tetris-score').textContent='0';$('#tetris-best').textContent=localStorage.getItem(`${STORE}-tetris-best`)||'0';$('#start-tetris').textContent='Игра идёт…';spawn();drawTetris();tetrisTimer=setInterval(tetrisStep,650);}
$('#choose-tetris').onclick=()=>{gamesDialog.close();tetrisDialog.showModal();board=emptyBoard();piece=null;tetrisScore=0;$('#tetris-score').textContent='0';$('#tetris-best').textContent=localStorage.getItem(`${STORE}-tetris-best`)||'0';drawTetris();}; $('#close-tetris').onclick=()=>{clearInterval(tetrisTimer);tetrisRunning=false;tetrisDialog.close();}; $('#start-tetris').onclick=startTetris; document.querySelectorAll('[data-tetris]').forEach(button=>button.onclick=()=>moveTetris(button.dataset.tetris)); document.addEventListener('keydown',event=>{if(!tetrisDialog.open)return;const keys={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate'};if(keys[event.key]){event.preventDefault();moveTetris(keys[event.key]);}});
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
render();
