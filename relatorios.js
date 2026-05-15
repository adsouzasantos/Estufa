document.addEventListener('DOMContentLoaded', () => {
    verificarAcesso();
    carregarDados();
});

function verificarAcesso() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = 'login.html';
    } else {
        document.getElementById('nome-usuario').innerText = usuarioLogado;
    }
}

async function carregarDados() {
    try {
        const response = await fetch('/api/get-historico');
        const dados = await response.json();

        const tabela = document.getElementById('tabela-corpo');
        tabela.innerHTML = ''; // Limpa a tabela

        dados.forEach(registro => {
            const dataFormatada = new Date(registro.data_hora).toLocaleString('pt-BR');
            
            const linha = `
                <tr class="border-b border-gray-700 hover:bg-slate-800 transition-colors">
                    <td class="p-3 text-gray-300 text-xs">${dataFormatada}</td>
                    <td class="p-3 text-green-400 font-bold">${registro.temperatura.toFixed(1)}°C</td>
                    <td class="p-3 text-blue-400">${registro.setpoint.toFixed(1)}°C</td>
                    <td class="p-3 text-gray-400 text-xs">${registro.kp}</td>
                    <td class="p-3 text-gray-400 text-xs">${registro.ki}</td>
                    <td class="p-3 text-gray-400 text-xs">${registro.kd}</td>
                </tr>
            `;
            tabela.innerHTML += linha;
        });
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
    }
}

function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
}

function atualizarHeaderDinamico() {
    const agora = new Date();

    // 1. Atualiza o Relógio (HH:MM:SS)
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    document.getElementById('relogio-digital').innerText = `${horas}:${minutos}:${segundos}`;

    // 2. Atualiza a Data (DD/MM/AAAA)
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    document.getElementById('data-atual').innerText = `${dia}/${mes}/${ano}`;
}

// Inicia a atualização e define um intervalo de 1 segundo
setInterval(atualizarHeaderDinamico, 1000);
atualizarHeaderDinamico(); // Chamada inicial imediata