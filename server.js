const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb'); 
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DE ARQUIVOS (HTML, CSS, IMAGENS) ---
// Isso garante que o Render ache seus arquivos visuais
app.use(express.static(path.join(__dirname)));

// --- CONEXÃO COM O BANCO DE DADOS ---
const uri = "mongodb://gerente_balbina:Balbina14%2A@ac-osb5xdw-shard-00-00.kqaqzit.mongodb.net:27017,ac-osb5xdw-shard-00-01.kqaqzit.mongodb.net:27017,ac-osb5xdw-shard-00-02.kqaqzit.mongodb.net:27017/?ssl=true&replicaSet=atlas-vo7onh-shard-0&authSource=admin&appName=Cluster0";
const client = new MongoClient(uri);

let db, configCollection, lancamentosCollection;

async function conectarBanco() {
    try {
        await client.connect();
        db = client.db("dona_balbina"); 
        configCollection = db.collection("configuracoes");
        lancamentosCollection = db.collection("lancamentos");
        console.log("🟢 Banco de Dados Permanente Conectado com Sucesso!");
    } catch (erro) {
        console.error("🔴 Erro ao conectar no MongoDB:", erro);
    }
}
conectarBanco();

// --- FUNÇÕES AUXILIARES (DATAS E DIAS ÚTEIS) ---
function obterDiasUteisDoMes(ano, mes) {
    let diasNoMes = new Date(ano, mes, 0).getDate();
    let domingos = 0;
    for (let dia = 1; dia <= diasNoMes; dia++) {
        let dataAtual = new Date(ano, mes - 1, dia);
        if (dataAtual.getDay() === 0) domingos++;
    }
    return { diasUteis: diasNoMes - domingos };
}

function extrairPrefixoData(mesVigente) {
    if (!mesVigente) return null;
    const texto = String(mesVigente).toUpperCase();
    let mesNum = null;
    if (texto.includes("JANEIRO")) mesNum = "01"; else if (texto.includes("FEVEREIRO")) mesNum = "02";
    else if (texto.includes("MARÇO") || texto.includes("MARCO")) mesNum = "03"; else if (texto.includes("ABRIL")) mesNum = "04";
    else if (texto.includes("MAIO")) mesNum = "05"; else if (texto.includes("JUNHO")) mesNum = "06";
    else if (texto.includes("JULHO")) mesNum = "07"; else if (texto.includes("AGOSTO")) mesNum = "08";
    else if (texto.includes("SETEMBRO")) mesNum = "09"; else if (texto.includes("OUTUBRO")) mesNum = "10";
    else if (texto.includes("NOVEMBRO")) mesNum = "11"; else if (texto.includes("DEZEMBRO")) mesNum = "12";
    
    let anoNum = null;
    const anos = ["2025", "2026", "2027", "2028", "2029", "2030"];
    for (let a of anos) { if (texto.includes(a)) { anoNum = a; break; } }
    
    if (mesNum && anoNum) return `${anoNum}-${mesNum}`;
    return null;
}

// --- ROTAS DE NAVEGAÇÃO (PARA NÃO DAR ERRO NO LINK) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gerente', (req, res) => {
    res.sendFile(path.join(__dirname, 'gerente.html'));
});

// --- ROTAS DA API (COMUNICAÇÃO COM O BANCO) ---

app.post('/api/configuracoes', async (req, res) => {
    const novasConfigs = req.body;
    await configCollection.updateOne({ id: "geral" }, { $set: novasConfigs }, { upsert: true });
    res.json({ mensagem: "Configurações salvas!" });
});

app.get('/api/configuracoes', async (req, res) => {
    const config = await configCollection.findOne({ id: "geral" });
    res.json(config);
});

app.post('/api/lancamento-diario', async (req, res) => {
    const novo = req.body;
    await lancamentosCollection.updateOne(
        { nomeDoSetor: novo.nomeDoSetor, dataReferencia: novo.dataReferencia },
        { $set: novo },
        { upsert: true }
    );
    res.json({ mensagem: "Lançamento registrado!" });
});

app.get('/api/consulta-dia/:setor/:data', async (req, res) => {
    const setor = decodeURIComponent(req.params.setor);
    const data = req.params.data;
    const registro = await lancamentosCollection.findOne({ nomeDoSetor: setor, dataReferencia: data });
    res.json(registro || null);
});

// --- LÓGICA DO PLACAR (MATEMÁTICA DE PONTOS) ---
app.get('/api/placar', async (req, res) => {
    const configuracoes = await configCollection.findOne({ id: "geral" });
    if (!configuracoes) return res.json({ erro: "Configurações não carregadas" });

    let prefixoDataFiltro = extrairPrefixoData(configuracoes.mesVigente);
    let anoCalculo = new Date().getFullYear();
    let mesCalculo = new Date().getMonth() + 1;

    if (prefixoDataFiltro) {
        const partesData = prefixoDataFiltro.split("-");
        anoCalculo = parseInt(partesData);
        mesCalculo = parseInt(partesData);
    } else {
        const mesFormatado = String(mesCalculo).padStart(2, '0');
        prefixoDataFiltro = `${anoCalculo}-${mesFormatado}`;
    }

    const lancamentosDoMes = await lancamentosCollection.find({
        dataReferencia: { $regex: `^${prefixoDataFiltro}` }
    }).toArray();

    const infoMes = obterDiasUteisDoMes(anoCalculo, mesCalculo);
    const diasUteis = infoMes.diasUteis || 26; 
    const maxPts = { vendas: 200, qualidade: 80, avaria: 60, abastecimento: 20, limpeza: 20, assiduidade: 20 };
    
    const maxDiaQualidade = maxPts.qualidade / diasUteis;
    const maxDiaAvaria = maxPts.avaria / diasUteis;
    const maxDiaAbast = maxPts.abastecimento / diasUteis;
    const maxDiaLimp = maxPts.limpeza / diasUteis;
    const maxDiaAssid = maxPts.assiduidade / diasUteis;

    let pontuacaoTotalLoja = 0;
    const nomesSetores = ["PANIFICAÇÃO", "CONFEITARIA", "TORTAS SALGADAS", "PIZZA", "REFEIÇÃO"];
    let setoresCalculados = [];

    nomesSetores.forEach(nomeSetor => {
        let lancamentosDoSetor = lancamentosDoMes.filter(item => item.nomeDoSetor === nomeSetor);
        let ptsVendas = 0, ptsQualidade = 0, ptsAvaria = 0, ptsAbast = 0, ptsLimp = 0, ptsAssid = 0;
        let somaVendas = 0;

        lancamentosDoSetor.forEach(lancamento => {
            somaVendas += (lancamento.vendasReais || 0);
            
            const limiteDiarioAvaria = configuracoes.limiteAvariaKg[nomeSetor] || 1;
            if ((lancamento.avariaKg || 0) <= limiteDiarioAvaria) ptsAvaria += maxDiaAvaria;

            let ganhoQualidade = maxDiaQualidade;
            if (lancamento.qualidade.reclamacao) ganhoQualidade = 0; 
            else {
                if (!lancamento.qualidade.padrao) ganhoQualidade -= (maxDiaQualidade * 0.3);
                if (!lancamento.qualidade.sabor) ganhoQualidade -= (maxDiaQualidade * 0.3);
            }
            ptsQualidade += Math.max(0, ganhoQualidade);

            ptsAbast += (lancamento.abastecimentoAcertos || 0) * maxDiaAbast;
            ptsLimp += ((lancamento.limpezaQtdSim || 0) / 3) * maxDiaLimp; 

            let ganhoAssid = maxDiaAssid;
            if (lancamento.assiduidade.falta) ganhoAssid = 0;
            else if (lancamento.assiduidade.atraso) ganhoAssid /= 2;
            ptsAssid += ganhoAssid;
        });

        const metaMensal = configuracoes.metasMensais[nomeSetor] || 1;
        ptsVendas = Math.min((somaVendas / metaMensal) * maxPts.vendas, maxPts.vendas);

        let totalSetor = ptsVendas + Math.min(ptsAvaria, maxPts.avaria) + Math.min(ptsQualidade, maxPts.qualidade) + 
                         Math.min(ptsAbast, maxPts.abastecimento) + Math.min(ptsLimp, maxPts.limpeza) + Math.min(ptsAssid, maxPts.assiduidade);
        
        pontuacaoTotalLoja += totalSetor;
        setoresCalculados.push({
            nome: nomeSetor,
            pontos: { 
                vendas: Math.round(ptsVendas), 
                qualidade: Math.round(ptsQualidade), 
                avaria: Math.round(ptsAvaria), 
                abastecimento: Math.round(ptsAbast), 
                limpeza: Math.round(ptsLimp), 
                assiduidade: Math.round(ptsAssid) 
            }
        });
    });

    res.json({
        mesVigente: configuracoes.mesVigente, 
        pontuacaoMensal: Math.round(pontuacaoTotalLoja / 5), 
        setores: setoresCalculados
    });
});

// --- LIGANDO O MOTOR ---
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Cérebro rodando na porta ${PORTA}`);
});
