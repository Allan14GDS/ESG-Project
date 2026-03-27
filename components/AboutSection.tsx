import { Target, TrendingUp, Users, Globe } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Materialidade",
    description: "Defina critérios com base em GRI, SASB e as melhores práticas globais de sustentabilidade.",
  },
  {
    icon: TrendingUp,
    title: "Monitoramento",
    description: "Acompanhe indicadores qualitativos e quantitativos em tempo real com dashboards inteligentes.",
  },
  {
    icon: Users,
    title: "Customizável",
    description: "Adicione questões, indicadores e módulos próprios para atender às necessidades específicas da sua organização.",
  },
  {
    icon: Globe,
    title: "Certificações",
    description: "Atenda requisitos de ISO, FSC, Bonsucro, SASSMAQ e dezenas de outras certificações.",
  },
];

const AboutSection = () => {
  return (
    <section id="sobre" className="bg-secondary py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase">SOBRE A B.KICK</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-4 mb-6 leading-tight">
            O desafio da sustentabilidade é global,{" "}
            <span className="text-primary">mas cada empresa é única</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A B.KICK é uma plataforma robusta, embasada nas melhores práticas do mercado, além
            de flexível e customizável para atender as necessidades específicas da sua organização.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

export default AboutSection;
