const mesa = document.getElementById("mesa")
const mazoBoton = document.getElementById("mazoCartas")

const turnoPlayer = document.getElementById("turnoPlayer")
const winPanel = document.getElementById("winPanel")

const mp1 = document.getElementById("mePlantoP1")
const mp2 = document.getElementById("mePlantoP2")

const pP1 = document.getElementById("perdioP1")
const pP2 = document.getElementById("perdioP2")

const indicador = document.getElementById("flecha")

let deckId = ""
let players;

function obtenerMenor(array) {
    return Math.min(...array);
}

function crearImagen(url){
    const img = document.createElement("img");
    img.src = url

    img.classList.add("card")

    return img
}

async function colocarCartaMesa(player,nCartas){
    const carta = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
    const dataCarta = await carta.json();

    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${player}/add/?cards=${dataCarta.cards[0].code}`);

    const angulo = nCartas * 10 - 10
    const img = crearImagen(dataCarta.cards[0].image)
    mesa.appendChild(img)

    let x = 0;
    let y = 0;

    if(player === "player1"){
        x = -280;
        y = -220;
    } else {
        x = 280;
        y = 220;
    }

    void img.offsetHeight;
    img.style.transition = "transform 0.6s ease-out";
    img.style.transformOrigin = "bottom left";
    img.style.transform = `
        translate(-50%, -50%) 
        translate(${x}px, ${y}px)
        rotate(${angulo}deg)
    `;
} 


async function actualizarData(turn1,turn2,status1,status2,nc1=0,nc2=0) {
    players.p1.turn = turn1
    players.p2.turn = turn2
    
    players.p1.status = status1
    players.p2.status = status2

    players.p1.score = await getPuntaje("player1")
    players.p2.score = await getPuntaje("player2")

    players.p1.nCartas += nc1
    players.p2.nCartas += nc2
}

async function getPuntaje(player){
    const responsePlayer = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${player}/list/`);
    const dataPlayer = await responsePlayer.json();

    let total = 0;
    let ases = 0;

    dataPlayer.piles[player].cards.forEach(card=>{
        if(card.value === "QUEEN" || card.value === "JACK" || card.value === "KING"){total += 10}
        else if(card.value === "ACE"){ases++; total+= 11;}
        else{total += parseInt(card.value);}
    });

    while (total > 21 && ases > 0) {
        total -= 10;
        ases--;
    }

    return total
}

async function InicioDelJuego() {
    const mazoNuevo = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
    const infoMazo = await mazoNuevo.json();

    deckId = infoMazo.deck_id;

    for (let i = 1; i < 3; i++) {
        await colocarCartaMesa("player1",i)
        await colocarCartaMesa("player2",i)
    }

    players = {
        p1:{
            id : 1,
            name : "player1",
            turn : true,
            status : "playing",
            score : await getPuntaje("player1"),
            nCartas : 2
        },
        p2:{
            id : 2,
            name : "player2",
            turn : false,
            status : "waiting",
            score : await getPuntaje("player2"),
            nCartas : 2
        }
    } 
}


async function accionPlayer() {
    let player = Object.values(players).find(p => p.status == "playing")

    await colocarCartaMesa((player.name),(player.nCartas + 1))
    player.score = await getPuntaje(player.name)
    
    if(players.p1.status == "plantado"){
        await actualizarData(false,true,"plantado","playing",0,1)
    }else if(players.p2.status == "plantado"){
        await actualizarData(true,false,"playing","plantado",1,0)
    }else if(players.p1.turn){
        await actualizarData(false,true,"waiting","playing",1,0)
        turnoPlayer.textContent = `TURNO DE PLAYER ${players.p2.id}`;
        indicador.style.transform = "translate(-50%, -50%) rotate(180deg)"
    }else if(players.p2.turn){
        await actualizarData(true,false,"playing","waiting",0,1)
        turnoPlayer.textContent = `TURNO DE PLAYER ${players.p1.id}`;
        indicador.style.transform = "translate(-50%, -50%) rotate(0deg)"
    }else{
        finDelJuego()
    }

    if (player.score > 21){
        winPanel.innerHTML += `
                <h1>EL PLAYER ${player.id} SE PASO</h1>
            `;
        winPanel.classList.remove("invisible") 
    }
}

async function finDelJuego(){
    const mismoScore = Object.values(players).every(p => {
        return p.score === players.p1.score;
    });

    const puntajes = Object.values(players).map(p => p.score).map(s => 21 - s)

    if (mismoScore){
        winPanel.innerHTML += `<h1>EMPATAODOS</h1>`
    }else{
        const idGanador = puntajes.indexOf(obtenerMenor(puntajes))
        winPanel.innerHTML += `<h1>GANADOR PLAYER ${idGanador+1}</h1>`
    }

    winPanel.innerHTML += `
        <h2>PLAYER 1: ${players.p1.score} puntos</h2>
        <h2>PLAYER 2: ${players.p2.score} puntos</h2>
    `;
    winPanel.classList.remove("invisible")  
}

InicioDelJuego();

mazoBoton.addEventListener("click",accionPlayer)

mp1.addEventListener("click",()=>{
    players.p1.status = "plantado"
    turnoPlayer.textContent = "TURNO DE PLAYER 2";
    indicador.style.transform = "translate(-50%, -50%) rotate(180deg)"
    if (players.p2.status == "plantado"){
        finDelJuego();
    }
    players.p2.status = "playing"
})
mp2.addEventListener("click",()=>{
    players.p2.status = "plantado"
    turnoPlayer.textContent = "TURNO DE PLAYER 1";
    indicador.style.transform = "translate(-50%, -50%) rotate(0deg)"
    if (players.p1.status == "plantado"){
        finDelJuego();
    }
    players.p1.status = "playing"
})