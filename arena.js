const canvas=document.getElementById("arena");
const ctx=canvas.getContext("2d");

canvas.width=1200;
canvas.height=600;

let player;
let enemy;

let gameStarted=false;

function startGame(name){

document.getElementById("menu").style.display="none";

document.getElementById("game").style.display="block";

player={
x:200,
y:400,
w:80,
h:120,
hp:100,
color:"#9d4edd",
name:name
};

enemy={
x:900,
y:400,
w:80,
h:120,
hp:100,
color:"#00c2ff",
name:"ENEMY"
};

gameStarted=true;

updateBars();

requestAnimationFrame(loop);

}

function drawFighter(f){

ctx.fillStyle=f.color;

ctx.fillRect(
f.x,
f.y,
f.w,
f.h
);

ctx.fillStyle="white";

ctx.font="20px Arial";

ctx.fillText(
f.name,
f.x,
f.y-10
);

}

function loop(){

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

if(enemy.x-player.x>150){

enemy.x-=0.4;

}

}

document.addEventListener("keydown",(e)=>{

if(!gameStarted)return;

if(e.key==="a"){

player.x-=15;

}

if(e.key==="d"){

player.x+=15;

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

});

function attack(dmg){

let distance=Math.abs(
player.x-enemy.x
);

if(distance<140){

enemy.hp-=dmg;

enemy.color="#ff4444";

setTimeout(()=>{

enemy.color="#00c2ff";

},100);

}

if(enemy.hp<=0){

enemy.hp=0;

alert("🏆 ROUND CLEARED");

}

updateBars();

}

function updateBars(){

document
.getElementById("playerHP")
.style.width=player.hp+"%";

document
.getElementById("enemyHP")
.style.width=enemy.hp+"%";

}
