// Envia UMA linha de teste para o Apps Script e mostra a resposta bruta.
// Uso:  APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec" node scripts/testar-planilha.mjs
// Atenção: grava de verdade uma linha "TESTE" na planilha — apague-a depois.
const url = process.env.APPS_SCRIPT_URL;
if (!url) {
  console.error("Defina APPS_SCRIPT_URL.");
  process.exit(1);
}
const corpo = {
  idempotencyKey: `teste-${Date.now()}`,
  enviadoEm: new Date().toISOString(),
  nomeCompleto: "TESTE Pode Apagar",
  dataNascimento: "1990-01-01",
  idadeNaDataDoRetiro: 37,
  faixa: "A partir de 10 anos",
  valor: 400,
  valorTexto: "R$ 400,00",
  cpf: "52998224725",
  telefone: "35999990000",
  whatsapp: "35999990000",
  email: "",
  igreja: "TESTE",
  cidade: "TESTE",
  menorDeIdade: "NÃO",
  responsavelNome: "",
  responsavelTelefone: "",
  emergenciaNome: "TESTE Contato",
  emergenciaTelefone: "35988880000",
  necessidades: "",
  aceiteRegras: "SIM",
  aceitePrivacidade: "SIM",
  versaoTermos: "teste",
  statusPagamento: "NÃO CONFIRMADO",
  origem: "teste-manual",
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
