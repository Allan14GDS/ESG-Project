import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ContactSection = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  return (
    <section
      id="contato"
      className="relative py-20 lg:py-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(220, 30%, 12%) 0%, hsl(220, 28%, 16%) 40%, hsl(180, 20%, 14%) 70%, hsl(153, 25%, 14%) 100%)",
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 text-white">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left side */}
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight text-white">
              Pronto para transformar sua{" "}
              <span className="text-blue-500">gestão ESG?</span>
            </h2>
            <p className="text-slate-300 text-lg max-w-lg mb-12 leading-relaxed">
              Agende uma demonstração gratuita e descubra como a B.KICK pode
              impulsionar a sustentabilidade da sua empresa com tecnologia e
              praticidade.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-slate-300">contato@bkick.com.br</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-slate-300">(41) 98877-5862</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-slate-300">Brasil</span>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
            <h3 className="text-xl font-bold mb-6 text-white">
              Solicitar Demonstração
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  placeholder="seu@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">
                  Empresa
                </label>
                <input
                  type="text"
                  placeholder="Nome da empresa"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">
                  Mensagem
                </label>
                <textarea
                  placeholder="Conte-nos sobre suas necessidades"
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                />
              </div>

              <Button
                size="lg"
                className="w-full rounded-lg font-semibold text-base gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors border-none"
              >
                Enviar Solicitação <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
