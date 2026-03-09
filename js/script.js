// Elementi iz HTML
const canvas=document.getElementById("mazeCanvas");
const ctx=canvas.getContext("2d");
const resetBtn=document.getElementById("resetBtn");
const solutionBtn=document.getElementById("solutionBtn");
const statusEl=document.getElementById("status");
const infoBtn=document.getElementById("infoBtn");
// Nastavitve igre
const ROWS=25,COLS=25,CELL=24,PAD=10;
const PLAYER_SIZE=CELL-8,PLAYER_SPEED=2,WALL_THICKNESS=4;
canvas.width=COLS*CELL+PAD*2;
canvas.height=ROWS*CELL+PAD*2;
// Spremenljivke
let horizontalWalls=[],verticalWalls=[];
let showSolution=false,hasWon=false;
let player={x:PAD+4,y:PAD+4};
// Katere tipke držimo
const keys={ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,w:false,a:false,s:false,d:false};
// Pomožne funkcije
const create2D=(r,c,v)=>Array.from({length:r},()=>Array(c).fill(v));
const inBounds=(r,c)=>r>=0&&r<ROWS&&c>=0&&c<COLS;
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
// Info gumb
if(infoBtn){
  infoBtn.onclick=()=>Swal.fire({
    title:"Block Blast Maze",
    html:`<b>Izdelal:</b> Rene Frančeškin<br><b>Predmet:</b> Spletne aplikacije<br><br>Premik uporablja tipke <b>W A S D</b> ali <b>puščice</b>.`,
    icon:"info",
    confirmButtonText:"Zapri"
  });
}
// Odstrani zid med dvema sosednjima celicama
function removeWall(r,c,nr,nc){
  if(nr<r) horizontalWalls[r][c]=false;
  if(nr>r) horizontalWalls[r+1][c]=false;
  if(nc<c) verticalWalls[r][c]=false;
  if(nc>c) verticalWalls[r][c+1]=false;
}
// Ustvari nov labirint
function generateMaze(){
  horizontalWalls=create2D(ROWS+1,COLS,true);
  verticalWalls=create2D(ROWS,COLS+1,true);
  const visited=create2D(ROWS,COLS,false);
  function carve(r,c){
    visited[r][c]=true;
    for(const [dr,dc] of shuffle([[-1,0],[1,0],[0,-1],[0,1]])){
      const nr=r+dr,nc=c+dc;
      if(!inBounds(nr,nc)||visited[nr][nc]) continue;
      removeWall(r,c,nr,nc);
      carve(nr,nc);
    }
  }
  carve(0,0);
}
// Preveri zid med dvema celicama
function wallBetween(r,c,dr,dc){
  if(dr===-1) return horizontalWalls[r][c];
  if(dr===1) return horizontalWalls[r+1][c];
  if(dc===-1) return verticalWalls[r][c];
  return verticalWalls[r][c+1];
}
// Vrne celico, v kateri je sredina igralca
function getPlayerCell(){
  return{
    row:Math.floor((player.y+PLAYER_SIZE/2-PAD)/CELL),
    col:Math.floor((player.x+PLAYER_SIZE/2-PAD)/CELL)
  };
}
// Preveri stik igralca z enim zidom
function rectIntersectsWall(rx,ry,rw,rh,wx1,wy1,wx2,wy2){
  const minX=Math.min(wx1,wx2)-WALL_THICKNESS/2;
  const maxX=Math.max(wx1,wx2)+WALL_THICKNESS/2;
  const minY=Math.min(wy1,wy2)-WALL_THICKNESS/2;
  const maxY=Math.max(wy1,wy2)+WALL_THICKNESS/2;
  return rx<maxX&&rx+rw>minX&&ry<maxY&&ry+rh>minY;
}
// Preveri ali se igralec lahko premakne
function canMoveTo(newX,newY){
  const rx=newX,ry=newY,rw=PLAYER_SIZE,rh=PLAYER_SIZE;
  if(rx<PAD||ry<PAD||rx+rw>PAD+COLS*CELL||ry+rh>PAD+ROWS*CELL) return false;
  const startCol=Math.floor((rx-PAD)/CELL);
  const endCol=Math.floor((rx+rw-PAD)/CELL);
  const startRow=Math.floor((ry-PAD)/CELL);
  const endRow=Math.floor((ry+rh-PAD)/CELL);
  for(let r=Math.max(0,startRow);r<=Math.min(ROWS-1,endRow);r++){
    for(let c=Math.max(0,startCol);c<=Math.min(COLS-1,endCol);c++){
      const x=PAD+c*CELL,y=PAD+r*CELL;
      if(horizontalWalls[r][c]&&rectIntersectsWall(rx,ry,rw,rh,x,y,x+CELL,y)) return false;
      if(horizontalWalls[r+1][c]&&rectIntersectsWall(rx,ry,rw,rh,x,y+CELL,x+CELL,y+CELL)) return false;
      if(verticalWalls[r][c]&&rectIntersectsWall(rx,ry,rw,rh,x,y,x,y+CELL)) return false;
      if(verticalWalls[r][c+1]&&rectIntersectsWall(rx,ry,rw,rh,x+CELL,y,x+CELL,y+CELL)) return false;
    }
  }
  return true;
}
// Preveri zmago
function checkWin(){
  const goalX=PAD+(COLS-1)*CELL+4;
  const goalY=PAD+(ROWS-1)*CELL+4;
  const overlap=player.x<goalX+PLAYER_SIZE&&player.x+PLAYER_SIZE>goalX&&player.y<goalY+PLAYER_SIZE&&player.y+PLAYER_SIZE>goalY;
  if(overlap&&!hasWon){
    hasWon=true;
    Swal.fire({title:"Zmagal si!",text:"Prišel si do cilja!",icon:"success",confirmButtonText:"Super!"});
  }
}
// Premikanje igralca
function updatePlayer(){
  if(hasWon) return;
  let dx=0,dy=0;
  if(keys.ArrowUp||keys.w) dy-=PLAYER_SPEED;
  if(keys.ArrowDown||keys.s) dy+=PLAYER_SPEED;
  if(keys.ArrowLeft||keys.a) dx-=PLAYER_SPEED;
  if(keys.ArrowRight||keys.d) dx+=PLAYER_SPEED;
  if(dx!==0&&dy!==0) dy=0;
  if(dx!==0&&canMoveTo(player.x+dx,player.y)) player.x+=dx;
  if(dy!==0&&canMoveTo(player.x,player.y+dy)) player.y+=dy;
  checkWin();
}
// Tipkovnica
window.addEventListener("keydown",e=>{
  if(e.key in keys){
    keys[e.key]=true;
    e.preventDefault();
  }
});
window.addEventListener("keyup",e=>{
  if(e.key in keys){
    keys[e.key]=false;
    e.preventDefault();
  }
});
// Najkrajša pot do cilja
function shortestPath(start,end){
  const q=[start];
  const prev=create2D(ROWS,COLS,null);
  prev[start.row][start.col]=start;
  while(q.length){
    const cur=q.shift();
    if(cur.row===end.row&&cur.col===end.col) break;
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=cur.row+dr,nc=cur.col+dc;
      if(!inBounds(nr,nc)||wallBetween(cur.row,cur.col,dr,dc)||prev[nr][nc]) continue;
      prev[nr][nc]=cur;
      q.push({row:nr,col:nc});
    }
  }
  const path=[];
  for(let cur=end;cur;cur=prev[cur.row][cur.col]){
    path.push(cur);
    if(cur.row===start.row&&cur.col===start.col) break;
  }
  return path.reverse();
}
// Nariše labirint
function drawMaze(){
  ctx.strokeStyle="white";
  ctx.lineWidth=WALL_THICKNESS;
  for(let r=0;r<=ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(horizontalWalls[r][c]){
        const x=PAD+c*CELL,y=PAD+r*CELL;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x+CELL,y);
        ctx.stroke();
      }
    }
  }
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<=COLS;c++){
      if(verticalWalls[r][c]){
        const x=PAD+c*CELL,y=PAD+r*CELL;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x,y+CELL);
        ctx.stroke();
      }
    }
  }
}
// Nariše kvadratek
function drawBlockAt(x,y,color){
  ctx.fillStyle=color;
  ctx.fillRect(x,y,PLAYER_SIZE,PLAYER_SIZE);
}
// Nariše rešitev
function drawSolution(){
  if(!showSolution) return;
  const path=shortestPath(getPlayerCell(),{row:ROWS-1,col:COLS-1});
  ctx.strokeStyle="cyan";
  ctx.lineWidth=4;
  ctx.beginPath();
  path.forEach((p,i)=>{
    const x=PAD+p.col*CELL+CELL/2,y=PAD+p.row*CELL+CELL/2;
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();
}
// Nariše celo igro
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawMaze();
  const goalX=PAD+(COLS-1)*CELL+4;
  const goalY=PAD+(ROWS-1)*CELL+4;
  drawBlockAt(goalX,goalY,"yellow");
  drawSolution();
  drawBlockAt(player.x,player.y,"red");
}
// Glavna zanka igre
function gameLoop(){
  updatePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}
// Gumbi
resetBtn.onclick=()=>{
  player={x:PAD+4,y:PAD+4};
  hasWon=false;
  showSolution=false;
  statusEl.textContent="";
  generateMaze();
};
solutionBtn.onclick=()=>{showSolution=!showSolution;};
// Zagon igre
generateMaze();
gameLoop();