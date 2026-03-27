import { LayoutGrid, ClipboardCheck, Target, BarChart3, FileText, Puzzle } from "lucide-react";

const features = [
  {
    icon: LayoutGrid,
    title: "Dashboards Inteligentes",
    description: "Análises de desempenho e indicadores em tempo real. Visualize matrizes de materialidade, riscos e impactos com atualizações automáticas.",
  },
  {
    icon: ClipboardCheck,
    title: "Gestão de Requisitos",
    description: "Avaliação com mais de 800 boas práticas selecionadas das principais metodologias: ISE B3, GRI, Ethos, Pacto Global e normas ISO.",
  },
  {
    icon: Target,
    title: "Gestão de Metas",
    description: "Defina, acompanhe e controle metas com prazos, status e evidências. Monitoramento de compromissos e requisitos não atendidos.",
  },
  {
    icon: BarChart3,
    title: "Indicadores KPI",
    description: "Controle de dados quantitativos de consumo de água, energia, resíduos, acidentes de trabalho e sistematização para inventários de emissões.",
  },
  {
    icon: FileText,
    title: "Planos de Ação",
    description: "Crie e gerencie planos de ação por área (Ambiental, Social, Governança) com upload de evidências e acompanhamento visual.",
  },
  {
    icon: Puzzle,
    title: "Plataforma Modular",
    description: "Escolha os módulos que fazem sentido para sua empresa. Cadastre requisitos e indicadores próprios a qualquer momento.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="funcionalidades" className="bg-secondary py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase">FUNCIONALIDADES</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-4 mb-6 leading-tight">
            Tudo o que você precisa para a{" "}
            <span className="text-primary">gestão ESG</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Uma plataforma completa para processos internos, gestão de fornecedores e
            monitoramento contínuo da jornada de sustentabilidade.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
