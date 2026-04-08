import { ArrowRight, BarChart3, Shield, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// No Next.js, os vídeos da pasta public são lidos assim:
const heroBgVideo = "/assets/hero-bg-video.mp4";

const stats = [
  { icon: BarChart3, value: "800+", label: "Indicadores" },
  { icon: Shield, value: "20+", label: "Metodologias" },
  { icon: Link2, value: "100%", label: "Customizável" },
];

const HeroSection = () => {
  return (
    <section
      className="relative overflow-hidden min-h-[90vh] flex items-center"
      style={{
        background:
          "linear-gradient(135deg, hsl(220, 30%, 12%) 0%, hsl(220, 28%, 16%) 40%, hsl(180, 20%, 14%) 70%, hsl(153, 25%, 14%) 100%)",
      }}
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-20 blur-[2px]"
        >
          <source src={heroBgVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,30%,10%)]/90 via-[hsl(220,28%,14%)]/75 to-[hsl(160,82%,55%)]/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,30%,10%)]/60 via-transparent to-[hsl(220,30%,10%)]/80" />
        <div className="absolute inset-0 bg-[hsl(220,30%,10%)]/65" />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 z-[1]">
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-15"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="hsl(153, 82%, 45%)"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-20 lg:py-32 relative z-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 text-primary text-sm font-medium mb-8">
            <Link2 className="w-4 h-4" />
            Software de Sustentabilidade
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.15] mb-6 text-white">
            Meça, aprimore e comunique seu{" "}
            <span className="text-emerald-400">desempenho ESG</span>
          </h1>

          <p className="text-base text-white/60 max-w-2xl mb-10 leading-relaxed font-normal">
            Plataforma modular e customizável para gestão de sustentabilidade
            corporativa. Baseada nas melhores metodologias e certificações do
            mercado.
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 font-semibold text-base gap-2"
            >
              <Link href="/solicitar-demonstracao">
                Solicitar Demonstração <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 font-semibold text-base border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
            >
              Conhecer a Plataforma
            </Button>
          </div>

          <div className="flex flex-wrap gap-12 md:gap-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
