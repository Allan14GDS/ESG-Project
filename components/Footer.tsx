const logoDark = "/assets/logo-dark.png";

const Footer = () => {
  return (
    <footer className="bg-hero text-hero-foreground border-t border-hero-foreground/10">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <img src={logoDark} alt="B.Kick" className="h-8 mb-4" />
            <p className="text-hero-foreground/50 text-sm leading-relaxed max-w-xs">
              Plataforma de software para gestão de sustentabilidade
              corporativa. Meça, aprimore e comunique o desempenho ESG da sua
              empresa.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Plataforma</h4>
            <ul className="space-y-3 text-hero-foreground/50 text-sm">
              <li>
                <a
                  href="#funcionalidades"
                  className="hover:text-hero-foreground transition-colors"
                >
                  Funcionalidades
                </a>
              </li>
              <li>
                <a
                  href="#metodologias"
                  className="hover:text-hero-foreground transition-colors"
                >
                  Metodologias
                </a>
              </li>
              <li>
                <a
                  href="#jornada"
                  className="hover:text-hero-foreground transition-colors"
                >
                  Jornada ESG
                </a>
              </li>
              <li>
                <a
                  href="#contato"
                  className="hover:text-hero-foreground transition-colors"
                >
                  Demonstração
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contato</h4>
            <ul className="space-y-3 text-hero-foreground/50 text-sm">
              <li>contato@bkick.com.br</li>
              <li>(41) 98877-5862</li>
              <li>Brasil</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-hero-foreground/10">
        <div className="container mx-auto px-4 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-hero-foreground/40 text-sm">
            © 2026 B.KICK. Todos os direitos reservados.
          </p>
          <p className="text-hero-foreground/40 text-sm">
            Sustentabilidade em Cadeia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
