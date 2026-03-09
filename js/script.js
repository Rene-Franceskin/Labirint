const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const resetBtn = document.getElementById("resetBtn");
const solutionBtn = document.getElementById("solutionBtn");
const statusEl = document.getElementById("status");

const ROWS=25, COLS=25, CELL=24, PAD=10;

canvas.width = COLS*CELL + PAD*2;
canvas.height = ROWS*CELL + PAD*2;

let horizontalWalls=[], verticalWalls=[];
let player={row:0,col:0};
let showSolution=false, hasWon=false;

const create2D=(r,c,v)=>Array.from({length:r},()=>Array(c).fill(v));
const inBounds=(r,c)=>r>=0&&r<ROWS&&c>=0&&c<COLS;

function shuffle(a){
  for(let i=a.length;i--;){
    const j=Math.random()*(i+1)|0;
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function removeWall(r,c,nr,nc){
  if(nr<r) horizontalWalls[r][c]=false;
  if(nr>r) horizontalWalls[r+1][c]=false;
  if(nc<c) verticalWalls[r][c]=false;
  if(nc>c) verticalWalls[r][c+1]=false;
}

function generateMaze(){
  horizontalWalls=create2D(ROWS+1,COLS,true);
  verticalWalls=create2D(ROWS,COLS+1,true);
  const visited=create2D(ROWS,COLS,false);

  function carve(r,c){
    visited[r][c]=true;

    for(const [dr,dc] of shuffle([[-1,0],[1,0],[0,-1],[0,1]])){
      const nr=r+dr, nc=c+dc;
      if(!inBounds(nr,nc)||visited[nr][nc]) continue;

      removeWall(r,c,nr,nc);
      carve(nr,nc);
    }
  }

  carve(0,0);
}

function wallBetween(r,c,dr,dc){
  if(dr==-1) return horizontalWalls[r][c];
  if(dr==1) return horizontalWalls[r+1][c];
  if(dc==-1) return verticalWalls[r][c];
  return verticalWalls[r][c+1];
}

window.addEventListener("keydown",e=>{
  if(hasWon) return;

  const map={
    ArrowUp:[-1,0], w:[-1,0],
    ArrowDown:[1,0], s:[1,0],
    ArrowLeft:[0,-1], a:[0,-1],
    ArrowRight:[0,1], d:[0,1]
  };

  if(!map[e.key]) return;

  const [dr,dc]=map[e.key];
  const nr=player.row+dr, nc=player.col+dc;

  if(inBounds(nr,nc)&&!wallBetween(player.row,player.col,dr,dc)){
    player.row=nr;
    player.col=nc;
  }

  if(player.row===ROWS-1 && player.col===COLS-1){
    hasWon=true;
    statusEl.textContent="ZMAGA! Prišel si do cilja!";
  }

  draw();
});

function shortestPath(start,end){
  const q=[start];
  const prev=create2D(ROWS,COLS,null);
  prev[start.row][start.col]=start;

  while(q.length){
    const cur=q.shift();
    if(cur.row===end.row && cur.col===end.col) break;

    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=cur.row+dr, nc=cur.col+dc;
      if(!inBounds(nr,nc)||wallBetween(cur.row,cur.col,dr,dc)||prev[nr][nc]) continue;

      prev[nr][nc]=cur;
      q.push({row:nr,col:nc});
    }
  }

  const path=[];
  for(let cur=end;cur;cur=prev[cur.row][cur.col]){
    path.push(cur);
    if(cur.row===start.row && cur.col===start.col) break;
  }

  return path.reverse();
}

function drawMaze(){
  ctx.strokeStyle="white";
  ctx.lineWidth=4;

  for(let r=0;r<=ROWS;r++)
    for(let c=0;c<COLS;c++)
      if(horizontalWalls[r][c]){
        const x=PAD+c*CELL,y=PAD+r*CELL;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+CELL,y); ctx.stroke();
      }

  for(let r=0;r<ROWS;r++)
    for(let c=0;c<=COLS;c++)
      if(verticalWalls[r][c]){
        const x=PAD+c*CELL,y=PAD+r*CELL;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+CELL); ctx.stroke();
      }
}

function drawBlock(r,c,color){
  ctx.fillStyle=color;
  ctx.fillRect(PAD+c*CELL+4,PAD+r*CELL+4,CELL-8,CELL-8);
}

function drawSolution(){
  if(!showSolution) return;

  const path=shortestPath(player,{row:ROWS-1,col:COLS-1});

  ctx.strokeStyle="cyan";
  ctx.lineWidth=4;
  ctx.beginPath();

  path.forEach((p,i)=>{
    const x=PAD+p.col*CELL+CELL/2;
    const y=PAD+p.row*CELL+CELL/2;
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  });

  ctx.stroke();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawMaze();
  drawBlock(ROWS-1,COLS-1,"yellow");
  drawSolution();
  drawBlock(player.row,player.col,"red");
}

resetBtn.onclick=()=>{
  player={row:0,col:0};
  hasWon=false;
  statusEl.textContent="";
  generateMaze();
  draw();
};

solutionBtn.onclick=()=>{
  showSolution=!showSolution;
  draw();
};

generateMaze();
draw();
