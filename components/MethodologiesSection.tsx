import { Check } from "lucide-react";

const modules = [
  {
    title: "Normas ISO",
    items: [
      "ISO 9001 – Gestão da Qualidade",
      "ISO 14001 e 14004 – Gestão Ambiental",
      "ISO 45001 – Saúde e Segurança",
      "ISO 37001 – Antissuborno",
      "ISO 56002 – Gestão da Inovação",
      "ISO 20121 – Eventos Sustentáveis",
    ],
  },
  {
    title: "Índices e Indicadores",
    items: [
      "ISE B3 – Sustentabilidade Empresarial",
      "Indicadores ETHOS – Ciclo 2019",
      "Indicadores ETHOS ASG",
      "GRI Completo",
      "SASB",
      "ODS – Objetivos de Desenv. Sustentável",
    ],
  },
  {
    title: "Normas ABNT",
    items: [
      "ABNT 2030 – Práticas Recomendadas ESG",
      "ABNT 2030 PE 487 – Diagnóstico ESG",
      "ABNT 2060 – Neutralidade de Carbono",
      "Requisitos LGPD",
      "Metodologia MEET (parceria ITA)",
      "Diagnóstico de Inovação",
    ],
  },
  {
    title: "Certificações e Selos",
    items: [
      "FSC Manejo / SLIMF / CoC",
      "Cerflor – Cadeia de Custódia",
      "Certificação Bonsucro",
      "Selo Brasil Agrossustentável",
      "SASSMAQ / SASSMAO",
      "OEA – Operador Econômico Autorizado",
    ],
  },
];

const MethodologiesSection = () => {
  return (
    <section id="metodologias" className="bg-secondary py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase">METODOLOGIAS</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-4 mb-6 leading-tight">
            Módulos disponíveis na{" "}
            <span className="text-primary">plataforma</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A plataforma é modular — escolha as metodologias que fazem sentido para o seu
            negócio e cadastre indicadores próprios a qualquer momento.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {modules.map((mod) => (
            <div key={mod.title} className="bg-card rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <h3 className="text-lg font-bold">{mod.title}</h3>
              </div>
              <ul className="space-y-3">
                {mod.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-10 text-sm">
          + Seleção ESG B.KICK com 800+ boas práticas inclusa em todos os planos
        </p>
      </div>
    </section>
  );
};

export default MethodologiesSection;
