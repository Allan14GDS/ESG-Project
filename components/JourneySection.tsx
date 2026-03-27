const steps = [
  {
    step: "01",
    title: "Materialidade",
    description: "Defina os critérios com base em metodologias como GRI e SASB. Configure matrizes de materialidade e riscos.",
  },
  {
    step: "02",
    title: "Diagnóstico",
    description: "Avalie o nível de maturidade ESG da sua organização com questionários inteligentes e ampla biblioteca de práticas.",
  },
  {
    step: "03",
    title: "Monitoramento",
    description: "Acompanhe indicadores qualitativos e quantitativos em tempo real com dashboards e análises automáticas.",
  },
  {
    step: "04",
    title: "Metas",
    description: "Estabeleça metas claras com prazos, responsáveis e upload de evidências. Acompanhamento visual do progresso.",
  },
  {
    step: "05",
    title: "Planos de Ação",
    description: "Crie planos de ação por área e monitore a execução com gráficos de acompanhamento e status detalhados.",
  },
  {
    step: "06",
    title: "Evolução",
    description: "Comunique seu desempenho, obtenha certificações e evolua continuamente sua jornada de sustentabilidade.",
  },
];

const JourneySection = () => {
  return (
    <section id="jornada" className="bg-secondary py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase">JORNADA ESG</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-4 mb-6 leading-tight">
            Sua jornada de sustentabilidade{" "}
            <span className="text-primary">passo a passo</span>
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-12">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div key={step.step} className="relative md:flex items-center">
                  {/* Dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary z-10 hidden md:block" />

                  {isLeft ? (
                    <>
                      <div className="md:w-1/2 md:pr-12">
                        <div className="bg-card rounded-xl p-8 shadow-sm">
                          <span className="text-primary font-bold text-sm">ETAPA {step.step}</span>
                          <h3 className="text-lg font-bold mt-2 mb-3">{step.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                      <div className="md:w-1/2" />
                    </>
                  ) : (
                    <>
                      <div className="md:w-1/2" />
                      <div className="md:w-1/2 md:pl-12">
                        <div className="bg-card rounded-xl p-8 shadow-sm">
                          <span className="text-primary font-bold text-sm">ETAPA {step.step}</span>
                          <h3 className="text-lg font-bold mt-2 mb-3">{step.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneySection;
