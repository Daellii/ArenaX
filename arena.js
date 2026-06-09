const canvas=document.getElementById("arena");
const ctx=canvas.getContext("2d");

canvas.width=1200;
canvas.height=600;

const fighters=[
"CHAD",
"PEPE",
"MOONKING",
"WOJAK",
"GOBLIN",
"HODL"
];

let player;
let enemy;
let gameStarted=false;

const images={};

function loadImage(name){

const img=new Image();
img.src=name.toLowerCase()+".png";

return img;

}

fighters.forEach(f=>{

images[f]=loadImage(f);

});

function startGame(name){

document.getElementById("menu").style.display="none";
document.getElementById("game").style.display="block";

const possibleEnemies=
fighters.filter(f=>f!==name);

const randomEnemy=
possibleEnemies[
Math.floor(
Math.random()*possibleEnemies.length
)
];

player={
x:150,
y:330,
w:160,
h:180,
hp:100,
name:name,
img:images[name]
};

enemy={
x:900,
y:330,
w:160,
h:180,
hp:100,
name:randomEnemy,
img:images[randomEnemy]
};

gameStarted=true;

updateBars();

requestAnimationFrame(loop);

}

function drawFighter(f){

ctx.drawImage(
f.img,
f.x,
f.y,
f.w,
f.h
);

ctx.fillStyle="white";
ctx.font="24px Arial";

ctx.fillText(
f.name,
f.x,
f.y-10
);

}

function loop(){

if(!gameStarted)return;

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

ctx.fillStyle="#222";

ctx.fillRect(
0,
520,
1200,
80
);

drawFighter(player);
drawFighter(enemy);

enemyAI();

requestAnimationFrame(loop);

}

function enemyAI(){

if(enemy.hp<=0)return;

if(enemy.x-player.x>180){

enemy.x-=0.5;

}

if(Math.random()<0.01){

enemyAttack();

}

}

function enemyAttack(){

const distance=
Math.abs(player.x-enemy.x);

if(distance<180){

const damage=
Math.floor(Math.random()*12)+5;

player.hp-=damage;

if(player.hp<0)player.hp=0;

updateBars();

if(player.hp<=0){

showWinner(enemy.name);

}

}

}

document.addEventListener("keydown",(e)=>{

if(!gameStarted)return;

if(e.key==="a"){

player.x-=20;

}

if(e.key==="d"){

player.x+=20;

}

if(e.key==="j"){

attack(10);

}

if(e.key==="k"){

attack(20);

}

if(e.key==="l"){

attack(35);

}

player.x=
Math.max(
0,
Math.min(1050,player.x)
);

});

function attack(dmg){

const distance=
Math.abs(player.x-enemy.x);

if(distance<180){

enemy.hp-=dmg;

if(enemy.hp<0)
enemy.hp=0;

updateBars();

flashEnemy();

if(enemy.hp<=0){

showWinner(player.name);

}

}

}

function flashEnemy(){

const oldImg=enemy.img;

enemy.img=null;

setTimeout(()=>{

enemy.img=oldImg;

},80);

}

function updateBars(){

document.getElementById(
"playerHP"
).style.width=
player.hp+"%";

document.getElementById(
"enemyHP"
).style.width=
enemy.hp+"%";

}

function showWinner(name){

gameStarted=false;

let screen=
document.getElementById(
"winnerScreen"
);

if(!screen){

screen=document.createElement("div");

screen.id="winnerScreen";

screen.innerHTML=`
<h1>🏆 ${name} WINS 🏆</h1>

<button class="playBtn"
onclick="location.reload()">
PLAY AGAIN
</button>

<button class="playBtn"
onclick="location.href='index.html'">
BACK TO ARENAX
</button>
`;

document.body.appendChild(screen);

}

screen.style.display="flex";

}
