import type { Base, FaixaId, Familia, Pagamento, Pessoa, Transporte } from "./tipos";

/**
 * DADOS DE DEMONSTRAÇÃO (fictícios). Servem só para mostrar a interface no Preview.
 * Nada daqui vem da planilha real e nada é gravado.
 */
const VALOR: Record<FaixaId, number> = { "menor-5": 0, "5-9": 200, "10-mais": 400, visitante: 0 };
const faixaDe = (i: number): FaixaId => (i < 5 ? "menor-5" : i < 10 ? "5-9" : "10-mais");

type Semente = { resp: string; igreja: string; cidade: string; forma: "Pix" | "Cartão"; idades: number[]; nomes: string[]; trans: Transporte; pagos: number[] };

const SEMENTES: Semente[] = [
  { resp: "Marcos Andrade", igreja: "AD Santa Rita", cidade: "Santa Rita do Sapucaí", forma: "Pix", idades: [41, 38, 12, 7], nomes: ["Marcos Andrade", "Lúcia Andrade", "Pedro Andrade", "Ana Andrade"], trans: "onibus", pagos: [300, 300, 300, 300] },
  { resp: "Janaina Furtado", igreja: "AD Santa Rita", cidade: "Santa Rita do Sapucaí", forma: "Pix", idades: [31], nomes: ["Janaina Furtado"], trans: "proprio", pagos: [] },
  { resp: "Rafael Souza", igreja: "AD Santa Rita", cidade: "Santa Rita do Sapucaí", forma: "Cartão", idades: [29, 27, 3], nomes: ["Rafael Souza", "Camila Souza", "Davi Souza"], trans: "onibus", pagos: [800] },
  { resp: "Eliane Prado", igreja: "AD Pouso Alegre", cidade: "Pouso Alegre", forma: "Pix", idades: [45, 16, 14], nomes: ["Eliane Prado", "Bruno Prado", "Isabela Prado"], trans: "onibus", pagos: [300, 300] },
  { resp: "Tiago Menezes", igreja: "AD Santa Rita", cidade: "Santa Rita do Sapucaí", forma: "Pix", idades: [22], nomes: ["Tiago Menezes"], trans: "onibus", pagos: [100] },
  { resp: "Sandra Lima", igreja: "AD Itajubá", cidade: "Itajubá", forma: "Pix", idades: [52, 50, 19, 8], nomes: ["Sandra Lima", "Valdir Lima", "Letícia Lima", "Gabriel Lima"], trans: "proprio", pagos: [300, 300, 300, 300] },
  { resp: "Paulo Henrique", igreja: "AD Santa Rita", cidade: "Santa Rita do Sapucaí", forma: "Pix", idades: [35, 33, 4, 1], nomes: ["Paulo Henrique", "Mariana Henrique", "Lucas Henrique", "Alice Henrique"], trans: "onibus", pagos: [200] },
  { resp: "Débora Nunes", igreja: "AD Pouso Alegre", cidade: "Pouso Alegre", forma: "Cartão", idades: [24], nomes: ["Débora Nunes"], trans: "onibus", pagos: [400] },
  { resp: "Josué Campos", igreja: "AD Santa Rita", cidade: "Santa Rita do Sapucaí", forma: "Pix", idades: [48, 46, 17, 15, 9], nomes: ["Josué Campos", "Rute Campos", "Samuel Campos", "Raquel Campos", "Noemi Campos"], trans: "onibus", pagos: [300, 300, 300] },
  { resp: "Fernanda Alves", igreja: "AD Itajubá", cidade: "Itajubá", forma: "Pix", idades: [28, 6], nomes: ["Fernanda Alves", "Théo Alves"], trans: "proprio", pagos: [] },
  { resp: "Caio Ribeiro", igreja: "AD Santa Rita", cidade: "Santa Rita do Sapucaí", forma: "Pix", idades: [20], nomes: ["Caio Ribeiro"], trans: "onibus", pagos: [100, 100] },
  { resp: "Marta Oliveira", igreja: "AD Pouso Alegre", cidade: "Pouso Alegre", forma: "Pix", idades: [57, 30], nomes: ["Marta Oliveira", "Priscila Oliveira"], trans: "proprio", pagos: [] },
];

function dia(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

export function criarDemo(): Base {
  const familias: Familia[] = [];
  const pessoas: Pessoa[] = [];
  const pagamentos: Pagamento[] = [];
  SEMENTES.forEach((s, fi) => {
    const familiaId = `F-${String(fi + 1).padStart(3, "0")}`;
    familias.push({
      id: familiaId,
      responsavel: s.resp,
      telefone: `(35) 9${String(8000 + fi * 137).padStart(4, "0")}-${String(1000 + fi * 211).slice(0, 4)}`,
      igreja: s.igreja,
      cidade: s.cidade,
      formaPrevista: s.forma,
    });
    s.idades.forEach((idade, i) => {
      const faixa = faixaDe(idade);
      pessoas.push({
        id: `${familiaId}-${i + 1}`,
        familiaId,
        nome: s.nomes[i],
        papel: i === 0 ? "Responsável" : "Integrante",
        classificacao: faixa === "menor-5" ? "Não pagante (0–4 anos)" : faixa === "5-9" ? "Participante meia" : "Participante inteira",
        idade,
        faixa,
        valor: VALOR[faixa],
        transporte: s.trans,
      });
    });
    s.pagos.forEach((valor, i) =>
      pagamentos.push({
        id: `P-${familiaId}-${i + 1}`,
        familiaId,
        data: dia(20 - i * 6),
        valor,
        forma: s.forma,
      }),
    );
  });
  return {
    familias,
    pessoas,
    pagamentos,
    despesas: [
      { id: "D-1", categoria: "Espaço e hospedagem", fornecedor: "Sítio de Retiro", descricao: "Diárias e uso do espaço", orcado: 4200, pago: 1500, status: "Aprovado" },
      { id: "D-2", categoria: "Alimentação e cozinha", fornecedor: "Cozinha do retiro", descricao: "Refeições dos 5 dias", orcado: 3000, pago: 0, status: "Orçado" },
      { id: "D-3", categoria: "Transporte", fornecedor: "Viação Serra", descricao: "Ônibus ida e volta", orcado: 1400, pago: 700, status: "Aprovado" },
      { id: "D-4", categoria: "Estrutura (som, luz, tendas)", fornecedor: "Som e Luz", descricao: "Equipamento dos cultos", orcado: 800, pago: 800, status: "Pago" },
      { id: "D-5", categoria: "Material de apoio", fornecedor: "Gráfica", descricao: "Crachás e material", orcado: 250, pago: 0, status: "Orçado" },
    ],
    ajustes: [
      { id: "A-1", data: dia(8), familiaId: "F-005", tipo: "Desconto", descricao: "Bolsa parcial concedida pela liderança", valor: 100 },
    ],
    doacoes: [
      { id: "O-1", data: dia(12), doador: "Irmão anônimo", valor: 400, tipo: "Apadrinhamento de vaga", obs: "Vaga para jovem sem condições" },
      { id: "O-2", data: dia(5), doador: "Ministério de Louvor", valor: 300, tipo: "Avulsa" },
    ],
  };
}
