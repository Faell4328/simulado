import { Timer, SignOut } from "@phosphor-icons/react";

interface BarraTopoProps {
  subtitulo?: string;
  tempo?: string | null;
  tempoUrgente?: boolean;
  onSair?: () => void;
}

// Barra de topo: wordmark, subtítulo (prova/modo) e timer + sair.
export default function BarraTopo({
  subtitulo,
  tempo,
  tempoUrgente,
  onSair,
}: BarraTopoProps) {
  return (
    <header className="sticky top-0 z-20 bg-cartao border-b border-linha">
      <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <img
            src="/logo.png"
            alt="simulado"
            className="logo-simulado h-6 w-auto"
          />
          {subtitulo && (
            <span className="text-sm text-muted truncate">{subtitulo}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {tempo != null && (
            <div
              className={`flex items-center gap-1.5 font-bold tabular-nums ${tempoUrgente ? "text-erro" : "text-tinta"}`}
            >
              <Timer size={18} weight="bold" /> {tempo}
            </div>
          )}
          {onSair && (
            <button
              onClick={onSair}
              className="text-muted hover:text-erro"
              aria-label="sair"
              title="sair"
            >
              <SignOut size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
