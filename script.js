// ==========================================
// A MÁGICA DA TV (PLACAR) - ESCALA 1000 PTS
// ==========================================

// 1. Definição das Metas (Pesos Máximos Atualizados)
const pesos = { vendas: 500, qualidade: 200, avaria: 150, abastecimento: 50, limpeza: 50, assiduidade: 50 };

// 2. Função para gerar a linha do QUADRO GERAL (Mantida original)
function gerarLinhaKPI(nome, icone, valorAtual, valorMaximo) {
    const porcentagem = Math.min((valorAtual / valorMaximo) * 100, 100);
    return `
        <div class="linha-kpi">
            <span class="nome-kpi">${icone} ${nome}</span>
            <div class="barra-container">
                <div class="barra-fill" style="width: ${porcentagem}%"></div>
            </div>
            <span class="valor-kpi">${valorAtual} pt</span>
        </div>
    `;
}

// 2.1 Função NOVA e EXCLUSIVA para os SETORES (Garante a exibição visual da barrinha amarela)
function gerarLinhaSetor(nome, icone, valorAtual, valorMaximo) {
    const porcentagem = Math.min((valorAtual / valorMaximo) * 100, 100);
    return `
        <div style="margin-bottom: 10px; padding: 0 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; font-weight: bold; color: #555;">
                <span>${icone} ${nome}</span>
                <span style="color: #333;">${valorAtual} pt</span>
            </div>
            <div style="background-color: #e0e0e0; height: 6px; border-radius: 4px; width: 100%; overflow: hidden;">
                <div style="background-color: #f1c40f; height: 100%; width: ${porcentagem}%; transition: width 0.5s ease;"></div>
            </div>
        </div>
    `;
}

// 3. O MOTOBOY: Função que busca os dados reais no Servidor
async function carregarDadosDoServidor() {
    try {
        const resposta = await fetch('/api/placar');
        const dadosDoBanco = await resposta.json();
        
        if (document.getElementById('container-setores')) {
            atualizarPainel(dadosDoBanco);
        }
    } catch (erro) {
        console.log("Erro ao buscar dados do servidor. O servidor está ligado?", erro);
    }
}

// 4. Função Principal para renderizar a tela
function atualizarPainel(dados) {
    // Atualização da barra Mestra (1000 Pontos)
    const porcentagemMensal = Math.min((dados.pontuacaoMensal / 1000) * 100, 100);
    document.getElementById('barra-mensal').style.width = `${porcentagemMensal}%`;
    document.getElementById('xp-total').innerText = dados.pontuacaoMensal; 

    const containerSetores = document.getElementById('container-setores');
    containerSetores.innerHTML = "";

    let somaVendas = 0, somaQualidade = 0, somaAvaria = 0, somaAbast = 0, somaLimp = 0, somaAssid = 0;

    dados.setores.forEach(setor => {
        const cExtra = setor.classeExtra ? setor.classeExtra : "";
        const p = setor.pontos;
        
        somaVendas += p.vendas;
        somaQualidade += p.qualidade;
        somaAvaria += p.avaria;
        somaAbast += p.abastecimento;
        somaLimp += p.limpeza;
        somaAssid += p.assiduidade;

        // Renderiza os setores usando a nova função com visual blindado
        const cartaoHTML = `
            <div class="cartao-setor ${cExtra}">
                <h3 style="text-align: center; margin-top: 0; margin-bottom: 15px; color: #8B4513;">${setor.nome}</h3>
                ${gerarLinhaSetor("VENDAS", "💰", p.vendas, pesos.vendas)}
                ${gerarLinhaSetor("QUALIDADE", "⭐", p.qualidade, pesos.qualidade)}
                ${gerarLinhaSetor("PERDAS", "🗑️", p.avaria, pesos.avaria)}
                ${gerarLinhaSetor("ABASTECIMENTO", "🕒", p.abastecimento, pesos.abastecimento)}
                ${gerarLinhaSetor("LIMPEZA", "🧹", p.limpeza, pesos.limpeza)}
                ${gerarLinhaSetor("ASSIDUIDADE", "👤", p.assiduidade, pesos.assiduidade)}
            </div>
        `;
        containerSetores.innerHTML += cartaoHTML;
    });

    // Renderiza o Quadro Geral usando a função original
    const qtdSetores = dados.setores.length;
    const containerGeral = document.getElementById('container-geral');
    containerGeral.innerHTML = `
        ${gerarLinhaKPI("VENDAS", "💰", (somaVendas / qtdSetores).toFixed(1), pesos.vendas)}
        ${gerarLinhaKPI("QUALIDADE", "⭐", (somaQualidade / qtdSetores).toFixed(1), pesos.qualidade)}
        ${gerarLinhaKPI("PERDAS/AVARIAS", "🗑️", (somaAvaria / qtdSetores).toFixed(1), pesos.avaria)}
        ${gerarLinhaKPI("ABASTECIMENTO", "🕒", (somaAbast / qtdSetores).toFixed(1), pesos.abastecimento)}
        ${gerarLinhaKPI("ORGANIZAÇÃO/LIMPEZA", "🧹", (somaLimp / qtdSetores).toFixed(1), pesos.limpeza)}
        ${gerarLinhaKPI("ASSIDUIDADE/FALTAS", "👤", (somaAssid / qtdSetores).toFixed(1), pesos.assiduidade)}
    `;
}

// 5 e 6. Inicia o painel e fica atualizando a cada 5 segundos
if (document.getElementById('container-setores')) {
    carregarDadosDoServidor();
    setInterval(carregarDadosDoServidor, 5000);
}
