/**
 * SISTEMA DE SUPERVISÓRIO INDUSTRIAL - EQUIPE 7
 * Controle de Estufa com Monitoramento de Temperatura e Sintonia PID.
 */

// --- 1. CONFIGURAÇÕES DE INTERFACE E SESSÃO ---
const loginSection = document.getElementById('section-login');
const dashSection = document.getElementById('section-dashboard');

function gerenciarTelas() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
        loginSection.classList.add('hidden-section');
        dashSection.classList.remove('hidden-section');
        document.getElementById('nome-usuario').innerText = usuarioLogado;
        iniciarMQTT();
        carregarVideo();
    } else {
        loginSection.classList.remove('hidden-section');
        dashSection.classList.add('hidden-section');
    }
}

// --- 2. LÓGICA DE LOGIN ---
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userIn = document.getElementById('user').value;
    const passIn = document.getElementById('pass').value;

    const usuarioValido = usuariosDB.find(u => u.usuario === userIn && u.senha === passIn);

    if (usuarioValido) {
        localStorage.setItem('usuarioLogado', usuarioValido.usuario);
        document.getElementById('login-erro').classList.add('hidden');
        gerenciarTelas();
    } else {
        document.getElementById('login-erro').classList.remove('hidden');
    }
});

function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    location.reload();
}

// --- 3. LÓGICA MQTT E GRÁFICO ---
let client;
let currentSetpoint = 0; // Inicializado em 0
let chart;

function iniciarMQTT() {
    // Conexão via WebSockets seguros
    client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
    
    client.on('connect', () => {
        const status = document.getElementById('mqtt-status');
        if (status) {
            status.innerText = "● Conectado";
            status.className = "px-4 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30";
        }
        
        // Inscrição nos tópicos
        client.subscribe('ifpb/equipe7/temp');
        client.subscribe('ifpb/equipe7/lampada');
        client.subscribe('ifpb/equipe7/cooler');
        console.log("Inscrito nos tópicos da Equipe 7");
    });

    client.on('message', (topic, message) => {
        const payload = message.toString();
        console.log(`Recebido [${topic}]: ${payload}`);

        if (topic === 'ifpb/equipe7/temp') atualizarTemp(payload);
        if (topic === 'ifpb/equipe7/lampada') atualizarAtuador('lampada', payload);
        if (topic === 'ifpb/equipe7/cooler') atualizarAtuador('cooler', payload);
    });

    configurarGrafico();
}

// --- 4. FUNÇÕES DE CONTROLE ---

function enviarSetpoint() {
    const input = document.getElementById('setpoint-slider');
    const val = parseFloat(input.value);

    if (isNaN(val)) return;

    currentSetpoint = val;

    if (client && client.connected) {
        client.publish('ifpb/equipe7/setpoint', val.toString());
        console.log(`Setpoint enviado: ${val}°C`);
    }
}

function enviarSintoniaPID() {
    const kp = document.getElementById('kp-input').value;
    const ki = document.getElementById('ki-input').value;
    const kd = document.getElementById('kd-input').value;

    if (client && client.connected) {
        client.publish('ifpb/equipe7/kp', kp.toString());
        client.publish('ifpb/equipe7/ki', ki.toString());
        client.publish('ifpb/equipe7/kd', kd.toString());
        console.log("Parâmetros PID Enviados");
    }
}

// --- 5. VISUALIZAÇÃO E GRÁFICOS ---

function configurarGrafico() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: [], 
            datasets: [
                { 
                    label: 'Temperatura Atual',
                    data: [], 
                    borderColor: '#0F7B3B',
                    backgroundColor: 'rgba(15, 123, 59, 0.15)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                { 
                    label: 'Setpoint',
                    data: [], 
                    borderColor: '#1A2D42',
                    borderDash: [6, 3],
                    borderWidth: 2,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { suggestedMin: 15, suggestedMax: 45 }
            }
        }
    });
}

function atualizarTemp(valor) {
    const temp = parseFloat(valor);
    if (isNaN(temp)) return;

    // Atualiza o número no display
    const tempDisplay = document.getElementById('temp-display');
    if (tempDisplay) {
        tempDisplay.innerText = temp.toFixed(1);
    }
    
    const agora = new Date().toLocaleTimeString('pt-BR');
    
    if (chart) {
        chart.data.labels.push(agora);
        chart.data.datasets[0].data.push(temp);
        chart.data.datasets[1].data.push(currentSetpoint);

        if (chart.data.labels.length > 30) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(d => d.data.shift());
        }
        chart.update('none');
    }
}

function atualizarAtuador(tipo, estado) {
    const icon = document.getElementById(`icon-${tipo}`);
    const card = document.getElementById(`card-${tipo}`);
    
    if (estado === "1") {
        if (icon) icon.classList.remove('grayscale');
        // Adicione aqui as classes de cor específicas que você definiu no seu CSS
    } else {
        if (icon) icon.classList.add('grayscale');
    }
}

function carregarVideo() {
    const container = document.getElementById('video-container');
    if (container) {
        container.innerHTML = `<iframe src="https://vdo.ninja/?view=estufapid" style="width:100%; height:100%; border:none;" allow="camera; microphone"></iframe>`;
    }
}

// --- 6. BANCO DE DADOS ---

async function salvarDadosNoHistorico() {
    const tempElement = document.getElementById('temp-display');
    if (!tempElement) return;

    const dados = {
        temperatura: parseFloat(tempElement.innerText),
        setpoint: currentSetpoint,
        kp: parseFloat(document.getElementById('kp-input').value) || 0,
        ki: parseFloat(document.getElementById('ki-input').value) || 0,
        kd: parseFloat(document.getElementById('kd-input').value) || 0
    };

    try {
        const response = await fetch('/api/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        if (response.ok) console.log("Dados salvos no Neon");
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
}

// Inicialização de Tempo e Histórico
function atualizarHeaderDinamico() {
    const agora = new Date();
    document.getElementById('relogio-digital').innerText = agora.toLocaleTimeString('pt-BR');
    document.getElementById('data-atual').innerText = agora.toLocaleDateString('pt-BR');
}

window.addEventListener('DOMContentLoaded', gerenciarTelas);
setInterval(atualizarHeaderDinamico, 1000);
setInterval(salvarDadosNoHistorico, 60000);