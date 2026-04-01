// ==========================================
// PARTE 1: A MÁGICA DA TV (PLACAR)
// ==========================================

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
        const resposta = await fetch('/api/placar');
        const dadosDoBanco = await resposta.json();
        
        // Só tenta desenhar a tela se estivermos na página da TV
        if (document.getElementById('container-setores')) {
            atualizarPainel(dadosDoBanco);
        }
    } catch (erro) {
        console.log("Erro ao buscar dados do servidor. O servidor está ligado?", erro);
    }
}

// 4. Função Principal para renderizar a tela
function atualizarPainel(dados) {
    const porcentagemMensal = (dados.pontuacaoMensal / 400) * 100;
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


// ==========================================
// PARTE 2: O GERENTE (CONFIGURAÇÕES E LANÇAMENTOS)
// ==========================================

// Função para Salvar Configurações (COM O LINK CORRETO DA NUVEM)
async function salvarConfiguracoes(event) {
    if(event) event.preventDefault();
    
    const novasConfigs = {
        mesVigente: document.getElementById('mes-vigente') ? document.getElementById('mes-vigente').value : "MARÇO 2026",
        metasMensais: {
            "PANIFICAÇÃO": Number(document.getElementById('meta-panificacao').value),
            "CONFEITARIA": Number(document.getElementById('meta-confeitaria').value),
            "TORTAS SALGADAS": Number(document.getElementById('meta-tortas').value),
            "PIZZA": Number(document.getElementById('meta-pizza').value),
            "REFEIÇÃO": Number(document.getElementById('meta-refeicao').value)
        },
        limiteAvariaKg: {
            "PANIFICAÇÃO": Number(document.getElementById('avaria-panificacao').value),
            "CONFEITARIA": Number(document.getElementById('avaria-confeitaria').value),
            "TORTAS SALGADAS": Number(document.getElementById('avaria-tortas').value),
            "PIZZA": Number(document.getElementById('avaria-pizza').value),
            "REFEIÇÃO": Number(document.getElementById('avaria-refeicao').value)
        }
    };

    try {
        const resposta = await fetch('/api/configuracoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novasConfigs)
        });
        const data = await resposta.json();
        alert("Sucesso: " + data.mensagem);
    } catch (error) {
        alert("Erro ao salvar. Verifique sua conexão com a internet.");
    }
}

// Função para Salvar o Lançamento Diário (COM O LINK CORRETO DA NUVEM)
async function salvarLancamento(event) {
    if(event) event.preventDefault();

    const novoLancamento = {
        nomeDoSetor: document.getElementById('nome-setor').value,
        dataReferencia: document.getElementById('data-referencia').value,
        vendasReais: Number(document.getElementById('vendas-reais').value),
        avariaKg: Number(document.getElementById('avaria-kg').value),
        qualidade: {
            padrao: document.getElementById('qualidade-padrao').checked,
            sabor: document.getElementById('qualidade-sabor').checked,
            reclamacao: document.getElementById('qualidade-reclamacao').checked
        },
        abastecimentoAcertos: Number(document.getElementById('abastecimento-acertos').value),
        limpezaQtdSim: Number(document.getElementById('limpeza-sim').value),
        assiduidade: {
            falta: document.getElementById('assiduidade-falta').checked,
            atraso: document.getElementById('assiduidade-atraso').checked
        }
    };

    try {
        const resposta = await fetch('/api/lancamento-diario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoLancamento)
        });
        const data = await resposta.json();
        alert("Sucesso: " + data.mensagem);
        
        // Limpa o formulário após salvar com sucesso
        document.getElementById('form-lancamento').reset();
    } catch (error) {
        alert("Erro ao salvar. Verifique sua conexão com a internet.");
    }
}

// Garante que os botões vão chamar as funções certas
document.addEventListener("DOMContentLoaded", () => {
    const formConfig = document.getElementById('form-config');
    const formLancamento = document.getElementById('form-lancamento');
    
    if (formConfig) formConfig.addEventListener('submit', salvarConfiguracoes);
    if (formLancamento) formLancamento.addEventListener('submit', salvarLancamento);
});
