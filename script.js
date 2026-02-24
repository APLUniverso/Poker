const mesa = document.getElementById("mesa")
const mazoBoton = document.getElementById("mazoCartas")

const turnoPlayer = document.getElementById("turnoPlayer")
const winPanel = document.getElementById("winPanel")

const mp1 = document.getElementById("mePlantoP1")
const mp2 = document.getElementById("mePlantoP2")

const pP1 = document.getElementById("perdioP1")
const pP2 = document.getElementById("perdioP2")

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

function crearImagen(url){
    const img = document.createElement("img");
    img.src = url

    img.classList.add("card")

    return img
}

async function colocarCartaMesa(carta,player){
    const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${player}/list/`);
    const data = await response.json();

    //ARREGLAR COMO SE VEN LAS CARTAS EN LA MANO DEL JUGADOR
    const numeroCartas = data.piles[player].remaining;
    const angulo = numeroCartas*15

    const img = crearImagen(carta.image)
    mesa.appendChild(img)

    let x = 0;
    let y = 0;

    if(player === "player1"){
        x = -200;
        y = -120;
    } else {
        x = 200;
        y = 120;
    }

    img.offsetHeight;
    img.style.transition = "transform 0.6s ease-out";
    img.style.transform = `
        translate(-50%, -50%) 
        translate(${x}px, ${y}px)
        rotate(${angulo}deg)
    `;
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

    const puntajePlayer = await getPuntaje(player)
    console.log(puntajePlayer)
    if (puntajePlayer > 21){
        if (player == "player1"){
            pP1.classList.remove("invisible")
            winPanel.innerHTML += `
                <h1>GANADOR PLAYER 2</h1>
            `;
            winPanel.classList.remove("invisible") 
        }else{
            pP2.classList.remove("invisible")
            winPanel.innerHTML += `
                <h1>GANADOR PLAYER 1</h1>
            `;
            winPanel.classList.remove("invisible") 
        }
    }
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

    const puntajes = [await getPuntaje("player1"),await getPuntaje("player2")]
    if (puntajes[0] == puntajes[1]){
        winPanel.innerHTML += `<h1>EMPATAODOS</h1>`
    }else{
        const ganador = puntajes.map((puntaje,index) => ({
            jugador:index+1,
            diferencia:21-puntaje
        })).filter(puntaje => puntaje.diferencia >= 0 )
            .sort((a, b) => a.diferencia - b.diferencia);

        winPanel.innerHTML += `<h1>GANADOR PLAYER ${ganador[0].jugador}</h1>`
    }

    winPanel.innerHTML += `
        <h2>PLAYER 1: ${puntajes[0]} puntos</h2>
        <h2>PLAYER 2: ${puntajes[1]} puntos</h2>
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