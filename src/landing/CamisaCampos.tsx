import { PRECO_CAMISA_AVULSA, TAMANHOS_CAMISA, type ModeloCamisa } from "../lib/inscricao";

type Props = {
  chave: string;
  modelo: ModeloCamisa;
  tamanho: string;
  medida: string;
  tamanhoAvulso?: string;
  modoAvulso?: boolean;
  opcional?: boolean;
  erroModelo?: string;
  erroTamanho?: string;
  erroMedida?: string;
  erroAvulso?: string;
  onModelo: (valor: ModeloCamisa) => void;
  onTamanho: (valor: string) => void;
  onMedida: (valor: string) => void;
  onTamanhoAvulso?: (valor: string) => void;
  onBlur?: (campo: "modelo" | "tamanho" | "medida" | "avulso") => void;
};

export function CamisaCampos(p: Props) {
  const idCampo = (campo: string) =>
    `f-${[p.chave, campo].filter(Boolean).join(".").replace(/\./g, "-")}`;
  if (p.modoAvulso) {
    const id = idCampo("camisaAvulsa");
    return (
      <div className="lp-field lp-camisa-avulsa">
        <label htmlFor={id}>Camisa avulsa — R$ 50,00 (opcional)</label>
        <input
          id={id}
          value={p.tamanhoAvulso ?? ""}
          onChange={(e) => p.onTamanhoAvulso?.(e.target.value)}
          onBlur={() => p.onBlur?.("avulso")}
          maxLength={100}
          placeholder="Digite livremente o modelo e o tamanho"
          aria-invalid={p.erroAvulso ? true : undefined}
          aria-describedby={p.erroAvulso ? `${id}-erro` : `${id}-dica`}
        />
        <small id={`${id}-dica`}>
          A camisa não está incluída para esta criança. Ao informar o tamanho, será acrescentado R$
          50,00 ao cadastro.
        </small>
        {p.erroAvulso && (
          <p id={`${id}-erro`} className="lp-err" role="alert">
            {p.erroAvulso}
          </p>
        )}
      </div>
    );
  }

  const tamanhos = p.modelo ? TAMANHOS_CAMISA[p.modelo] : [];
  const modeloId = idCampo("camisaModelo");
  const tamanhoId = idCampo("camisaTamanho");
  const medidaId = idCampo("camisaMedida");
  return (
    <div className="lp-camisa">
      <p className="hint">
        {p.opcional
          ? `Camisa opcional por R$ ${PRECO_CAMISA_AVULSA},00, além do day use.`
          : "A inscrição inclui uma camisa. Escolha o modelo e tamanho."}
      </p>
      <div className="lp-row two">
        <div className="lp-field">
          <label htmlFor={modeloId}>
            Modelo da camisa{p.opcional && <small> (opcional)</small>}
          </label>
          <select
            id={modeloId}
            value={p.modelo}
            onChange={(e) => p.onModelo(e.target.value as ModeloCamisa)}
            onBlur={() => p.onBlur?.("modelo")}
            aria-invalid={p.erroModelo ? true : undefined}
            aria-describedby={p.erroModelo ? `${modeloId}-erro` : undefined}
          >
            <option value="">{p.opcional ? "Não quero encomendar" : "Selecione o modelo"}</option>
            <option value="normal">Normal</option>
            <option value="babylook">Babylook</option>
            <option value="infantil">Infantil</option>
          </select>
          {p.erroModelo && (
            <p id={`${modeloId}-erro`} className="lp-err" role="alert">
              {p.erroModelo}
            </p>
          )}
        </div>
        <div className="lp-field">
          <label htmlFor={tamanhoId}>Tamanho da camisa</label>
          <select
            id={tamanhoId}
            value={p.tamanho}
            disabled={!p.modelo}
            onChange={(e) => p.onTamanho(e.target.value)}
            onBlur={() => p.onBlur?.("tamanho")}
            aria-invalid={p.erroTamanho ? true : undefined}
            aria-describedby={p.erroTamanho ? `${tamanhoId}-erro` : undefined}
          >
            <option value="">Selecione o tamanho</option>
            {tamanhos.map((tamanho) => (
              <option key={tamanho} value={tamanho}>
                {tamanho}
              </option>
            ))}
          </select>
          {p.erroTamanho && (
            <p id={`${tamanhoId}-erro`} className="lp-err" role="alert">
              {p.erroTamanho}
            </p>
          )}
        </div>
      </div>
      {p.modelo === "normal" && p.tamanho === "Medida especial" && (
        <div className="lp-field">
          <label htmlFor={medidaId}>Informe a medida especial</label>
          <input
            id={medidaId}
            value={p.medida}
            onChange={(e) => p.onMedida(e.target.value)}
            onBlur={() => p.onBlur?.("medida")}
            maxLength={100}
            placeholder="Descreva a medida"
            aria-invalid={p.erroMedida ? true : undefined}
            aria-describedby={p.erroMedida ? `${medidaId}-erro` : undefined}
          />
          {p.erroMedida && (
            <p id={`${medidaId}-erro`} className="lp-err" role="alert">
              {p.erroMedida}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
