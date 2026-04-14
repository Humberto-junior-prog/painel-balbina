// ==========================================
// A MÁGICA DA TV (PLACAR) - ESCALA 1000 PTS
// ==========================================

// 1. Definição das Metas (Pesos Máximos Atualizados)
const pesos = { vendas: 500, qualidade: 200, avaria: 150, abastecimento: 50, limpeza: 50, assiduidade: 50 };

// 2. Função para gerar uma linha com a barrinha de progresso
function gerarLinhaKPI(nome, icone, valorAtual, valorMaximo) {
    const porcentagem = (valorAtual / valorMaximo) * 100;
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
    // --- ATUALIZADO PARA 1000 PONTOS NA BARRA GLOBAL ---
    const porcentagemMensal = (dados.pontuacaoMensal / 1000) * 100;
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

        const cartaoHTML = `
            <div class="cartao-setor ${cExtra}">
                <h3>${setor.nome}</h3>
                ${gerarLinhaKPI("VENDAS", "💰", p.vendas, pesos.vendas)}
                ${gerarLinhaKPI("QUALIDADE", "⭐", p.qualidade, pesos.qualidade)}
                ${gerarLinhaKPI("PERDAS", "🗑️", p.avaria, pesos.avaria)}
                ${gerarLinhaKPI("ABASTECIMENTO", "🕒", p.abastecimento, pesos.abastecimento)}
                ${gerarLinhaKPI("LIMPEZA", "🧹", p.limpeza, pesos.limpeza)}
                ${gerarLinhaKPI("ASSIDUIDADE", "👤", p.assiduidade, pesos.assiduidade)}
            </div>
        `;
        containerSetores.innerHTML += cartaoHTML;
    });

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

// 5 e 6. Inicia o painel e fica atualizando (Só roda se for a TV)
if (document.getElementById('container-setores')) {
    carregarDadosDoServidor();
    setInterval(carregarDadosDoServidor, 5000);
}
