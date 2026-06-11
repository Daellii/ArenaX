const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");

canvas.width = 700;
canvas.height = 450;

let player;
let score = 0;

const keys = {};

const coinImg = new Image();
coinImg.src = "/sol_token.png";
const coins = [];
const TILE = 50;

const maze = [

[1,1,1,1,1,1,1,1,1,1,1,1,1,1],
[1,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,0,1,1,0,1,1,1,1,0,1,1,0,1],
[1,0,0,0,0,0,0,0,1,0,0,0,0,1],
[1,0,1,1,0,1,1,0,1,0,1,1,0,1],
[1,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,0,1,1,0,1,1,1,1,0,1,1,0,1],
[1,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,1,1,1,1,1,1,1,1,1,1,1,1,1]

];
function createCoins(){

coins.length = 0;

for(let i=0;i<40;i++){

coins.push({

x:Math.random()*760+20,
y:Math.random()*560+20,
size:20

});

}

}

function startGame(img){

document.getElementById("menu").style.display="none";
document.getElementById("game").style.display="block";

const playerImg = new Image();
playerImg.src = "/" + img;

player = {

x:400,
y:300,
size:70,
img:playerImg

};

score = 0;

createCoins();

requestAnimationFrame(loop);

}

document.addEventListener("keydown",(e)=>{

keys[e.key.toLowerCase()] = true;

});

document.addEventListener("keyup",(e)=>{

keys[e.key.toLowerCase()] = false;

});

function update(){

if(keys["w"]) player.y-=4;
if(keys["s"]) player.y+=4;
if(keys["a"]) player.x-=4;
if(keys["d"]) player.x+=4;

player.x=Math.max(
0,
Math.min(canvas.width-player.size,
player.x)
);

player.y=Math.max(
0,
Math.min(canvas.height-player.size,
player.y)
);

for(let i=coins.length-1;i>=0;i--){

const c = coins[i];

const dx =
(player.x+30)-(c.x+10);

const dy =
(player.y+30)-(c.y+10);

const dist =
Math.sqrt(dx*dx+dy*dy);

if(dist<35){

coins.splice(i,1);

score+=10;

document.getElementById(
"score"
).innerText =
"SCORE: "+score;

}

}

}

function draw(){

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

ctx.fillStyle = "#8d4cff";

for(let row=0; row<maze.length; row++){

for(let col=0; col<maze[row].length; col++){

if(maze[row][col] === 1){

ctx.fillRect(
col * TILE,
row * TILE,
TILE,
TILE
);

}

}

}


for(const c of coins){

ctx.drawImage(
coinImg,
c.x,
c.y,
20,
20
);

}

ctx.drawImage(
player.img,
player.x,
player.y,
player.size,
player.size
);

}

function loop(){

update();
draw();

requestAnimationFrame(loop);

}
