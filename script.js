// 1. Definição das Metas (Pesos Máximos)
const pesos = { vendas: 50, qualidade: 20, avaria: 15, abastecimento: 5, limpeza: 5, assiduidade: 5 };

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

// 3. O MOTOBOY: Função que busca os dados reais no Servidor (Back-end)
async function carregarDadosDoServidor() {
    try {
        // Vai no endereço da nossa API
        const resposta = await fetch('http://localhost:3000/api/placar');
        // Converte aquele "textão" da tela branca em um objeto JavaScript
        const dadosDoBanco = await resposta.json();
        
        // Manda desenhar a tela usando os dados que chegaram
        atualizarPainel(dadosDoBanco);
    } catch (erro) {
        console.log("Erro ao buscar dados do servidor. O servidor está ligado?", erro);
    }
}

// 4. Função Principal para renderizar a tela
function atualizarPainel(dados) {
    // A. Atualizar o Placar Mensal na tela
    const porcentagemMensal = (dados.pontuacaoMensal / 400) * 100;
    document.getElementById('barra-mensal').style.width = `${porcentagemMensal}%`;
    document.getElementById('xp-total').innerText = dados.pontuacaoMensal; // Muda o número grande!

    // B. Renderizar os 5 Setores e preparar a soma para a MÉDIA
    const containerSetores = document.getElementById('container-setores');
    containerSetores.innerHTML = "";

    // Variáveis vazias para somarmos tudo e fazermos o Quadro Geral
    let somaVendas = 0, somaQualidade = 0, somaAvaria = 0, somaAbast = 0, somaLimp = 0, somaAssid = 0;

    dados.setores.forEach(setor => {
        const cExtra = setor.classeExtra ? setor.classeExtra : "";
        const p = setor.pontos;
        
        // Somando os pontos de cada setor no nosso "carrinho"
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

    // C. Renderizar o Quadro Geral (Calculando as MÉDIAS EXATAS automaticamente!)
    const qtdSetores = dados.setores.length; // Sabemos que são 5
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

// 5. Inicia o painel buscando os dados assim que a tela abre
carregarDadosDoServidor();

// 6. A MÁGICA DA TV: Fica atualizando sozinho a cada 5 segundos!
setInterval(carregarDadosDoServidor, 5000);