const mesa = document.getElementById("mesa")
const mazoBoton = document.getElementById("mazoCartas")

const turnoPlayer = document.getElementById("turnoPlayer")
const winPanel = document.getElementById("winPanel")

const mp1 = document.getElementById("mePlantoP1")
const mp2 = document.getElementById("mePlantoP2")

let deckId = ""
async function InicioDelJuego() {
    const mazoNuevo = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
    const infoMazo = await mazoNuevo.json();

    deckId = infoMazo.deck_id;

    for (let i = 0; i < 2; i++) {
        let player1Cartas = await sacarCartaDelMazo()
        await agregarCartaNuevaPila("player1",player1Cartas.cards[0])
        await colocarCartaMesa(player1Cartas.cards[0],"player1")
    }

    for (let i = 0; i < 2; i++) {
        let player1Cartas = await sacarCartaDelMazo()
        await agregarCartaNuevaPila("player2",player1Cartas.cards[0])
        await colocarCartaMesa(player1Cartas.cards[0],"player2")
    }
    
}

async function sacarCartaDelMazo() {
    const carta = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
    const dataCarta = await carta.json();

    if(dataCarta.remaining === 0)mazoBoton.classList.add("invisible");
    return dataCarta
}

async function colocarCartaMesa(carta,player){
    const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${player}/list/`);
    const data = await response.json();

    const numeroCartas = data.piles[player].remaining;

    const img = document.createElement("img");
    img.src = carta.image

    //ARREGLAR COMO SE VEN LAS CARTAS EN LA MANO DEL JUGADOR
    const angulo = 1 + numeroCartas*10
    img.style.transform = `rotate(${angulo}deg)`;

    if(player === "player1"){
        img.style.top = "5px";
        img.style.left = "5px";
    }else if(player == "player2"){
        img.style.bottom = "5px";
        img.style.right = "5px";
    }

    mesa.appendChild(img)
} 

async function  agregarCartaNuevaPila(player,carta) {
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${player}/add/?cards=${carta.code}`);
}

InicioDelJuego();

let turno = 0
let pararPlayer1 = false
let pararPlayer2 = false
async function accionPlayer() {
    let player = ""
    turno += 1

    if(pararPlayer1){
        player = "player2"
        turnoPlayer.textContent = "TURNO DE PLAYER 2"
    } else if(pararPlayer2){
        player = "player1"
        turnoPlayer.textContent = "TURNO DE PLAYER 1"
    } else{
        if (turno%2 == 0){
            player = "player2"
            turnoPlayer.textContent = "TURNO DE PLAYER 1"
        }else{
            player = "player1"
            turnoPlayer.textContent = "TURNO DE PLAYER 2"
        }
    }

    

    let playerCartas = await sacarCartaDelMazo()
    await agregarCartaNuevaPila(player,playerCartas.cards[0])
    await colocarCartaMesa(playerCartas.cards[0],player)
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

async function finDelJuego(){
    mazoBoton.classList.add("intocable")

    pF1 = await getPuntaje("player1")
    pF2 = await getPuntaje("player2")

    if(pF1>pF2){
        winPanel.innerHTML = `<h1>GANADOR PLAYER 1</h1>`;
    }else if(pF2>pF1){
        winPanel.innerHTML = `<h1>GANADOR PLAYER 2</h1>`;
    }else{
        winPanel.innerHTML = `<h1>EMPATE</h1>`;
    }

    winPanel.innerHTML += `
        <h2>PLAYER 1: ${pF1} puntos</h2>
        <h2>PLAYER 2: ${pF2} puntos</h2>
    `;
    winPanel.classList.remove("invisible")
}

mazoBoton.addEventListener("click",accionPlayer)

mp1.addEventListener("click",()=>{
    pararPlayer1 = true;
    turnoPlayer.textContent = "TURNO DE PLAYER 2";
    if (pararPlayer2){
        finDelJuego();
    }
})
mp2.addEventListener("click",()=>{
    pararPlayer2 = true;
    turnoPlayer.textContent = "TURNO DE PLAYER 1";
    if (pararPlayer1){
        finDelJuego();
    }
})