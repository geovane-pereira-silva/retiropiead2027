// Envia UMA inscrição de teste (família de 2 pessoas) ao Apps Script e mostra a resposta bruta.
// Uso:  APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec" node scripts/testar-planilha.mjs
// Atenção: grava de verdade 2 linhas "TESTE" na planilha — apague-as depois.
const url = process.env.APPS_SCRIPT_URL;
if (!url) {
  console.error("Defina APPS_SCRIPT_URL.");
  process.exit(1);
}
const corpo = {
  idempotencyKey: `teste-${Date.now()}`,
  familiaId: `F-TESTE-${Date.now().toString(36).toUpperCase()}`,
  enviadoEm: new Date().toISOString(),
  responsavelNome: "TESTE Responsavel Pode Apagar",
  responsavelCpf: "52998224725",
  telefone: "35999990000",
  whatsapp: "35999990000",
  email: "",
  igreja: "TESTE",
  cidade: "TESTE",
  emergenciaNome: "TESTE Contato",
  emergenciaTelefone: "35988880000",
  necessidades: "",
  totalParticipantes: 2,
  totalValor: 600,
  totalTexto: "R$ 600,00",
  temValorADefinir: "NÃO",
  aceiteRegras: "SIM",
  aceitePrivacidade: "SIM",
  versaoTermos: "teste",
  statusPagamento: "NÃO CONFIRMADO",
  origem: "teste-manual",
  participantes: [
    { ordem: 1, papel: "Responsável", nome: "TESTE Responsavel Pode Apagar", dataNascimento: "1985-01-01", idadeNaDataDoRetiro: 42, menorDeIdade: "NÃO", faixa: "A partir de 10 anos", valor: 400, valorTexto: "R$ 400,00", cpf: "52998224725" },
    { ordem: 2, papel: "Integrante", nome: "TESTE Crianca Pode Apagar", dataNascimento: "2019-01-01", idadeNaDataDoRetiro: 8, menorDeIdade: "SIM", faixa: "De 5 a 9 anos", valor: 200, valorTexto: "R$ 200,00", cpf: "" },
  ],
};
if (process.env.APPS_SCRIPT_TOKEN) corpo.token = process.env.APPS_SCRIPT_TOKEN;
const r = await fetch(url, {
  method: "POST",
  headers: { "content-type": "text/plain;charset=utf-8" },
  body: JSON.stringify(corpo),
  redirect: "follow",
});
console.log("HTTP", r.status);
console.log((await r.text()).slice(0, 500));
