const daniImg = "/assets/team/daniela-klein.png";
const marianaImg = "/assets/team/mariana-klein.png";
const larissaImg = "/assets/team/larissa-mocelin.png";
const flaviaImg = "/assets/team/flavia-sorrentini.jpeg";
const caioImg = "/assets/team/caio-moreno.jpeg"; // Cole essa também se o Caio estiver no código

const team = [
  {
    name: "Dani Klein",
    photo: daniImg,
    bio: "Jornalista, com MBA em Gestão de Crises, pós-graduações em Comunicação Estratégica e Gestão do Setor de Energia, e imersão em Sustainability Leadership & ESG (University at Albany/EUA). Possui certificações da Saïd Business School – University of Oxford, GRI Academy e BID. Há mais de 20 anos atua em comunicação estratégica, sustentabilidade e gestão reputacional, liderando projetos de reporte ESG, posicionamento institucional e engajamento de stakeholders.",
  },
  {
    name: "Mariana Klein",
    photo: marianaImg,
    bio: "Mestranda em Estudos Socioambientais, Culturas e Identidades pela UFES. Especialista em Direitos Humanos e Gestão de Pessoas, Projetos e Programas Sociais. GRI Certified e Auditora Interna ESG pela Bureau Veritas. Atua em projetos de sustentabilidade com experiência em análises socioambientais, pesquisas qualitativas e estruturação de indicadores.",
  },
  {
    name: "Larissa Mocelin Vaz",
    photo: larissaImg,
    bio: "Sócia-fundadora da B.Right, consultoria especializada em comunicação estratégica em ESG. Professora convidada da ESPM e palestrante em temas de integridade, comunicação e governança corporativa. Possui especializações jurídicas pela FGV, cursa MBA em ESG e Negócios Sustentáveis pela USP e é autora de publicações sobre ESG e governança.",
  },
  {
    name: "Flavia Sorrentini",
    photo: flaviaImg,
    bio: "Relações Públicas com especialização em Publicidade, Marketing Estratégico e Mercados Internacionais. Experiência em branding, gestão de comunicação e desenvolvimento de estratégias orientadas a posicionamento e crescimento de marcas em ambientes competitivos e digitais. Participação ativa em projetos de ESG por meio da B.Right, com foco em estratégia, inovação e integração de práticas sustentáveis ao negócio.",
  },
  {
    name: "Caio Moreno",
    photo: caioImg,
    bio: "Engenheiro elétrico, trabalha com ciência de dados e IA há 9 anos, executou +100 projetos em 5 países diferentes, atendendo grandes marcas multinacionais sendo CAIO (Chief AI Officer) desenvolvendo projetos, gestão de pessoas, treinamento de times e construção de cultura empresarial com tecnologias escaláveis.",
  },
];

const TeamSection = () => {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase">
            NOSSA EQUIPE
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-4 mb-6 leading-tight">
            Quem está por trás da <span className="text-primary">B. KICK</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {team.map((member) => (
            <div
              key={member.name}
              className="bg-secondary rounded-xl p-8 text-center"
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden border-2 border-border">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-4">{member.name}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
