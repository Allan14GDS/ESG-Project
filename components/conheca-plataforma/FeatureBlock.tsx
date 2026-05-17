import Image from "next/image"
import { CheckCircle2 } from "lucide-react"

interface FeatureBlockProps {
  badge: string
  title: string
  description: string
  bullets: string[]
  imageSrc: string
  imageAlt: string
  secondImageSrc?: string
  secondImageAlt?: string
  reversed?: boolean
}

export function FeatureBlock({
  badge,
  title,
  description,
  bullets,
  imageSrc,
  imageAlt,
  secondImageSrc,
  secondImageAlt,
  reversed = false,
}: FeatureBlockProps) {
  return (
    <section className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={`flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-20 ${
            reversed ? "lg:flex-row-reverse" : ""
          }`}
        >

          {/* ── Text column ─────────────────────────────────────────── */}
          <div className="w-full lg:w-[42%] lg:pt-6 lg:shrink-0">
            <span className="mb-4 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
              {badge}
            </span>

            <h2 className="mb-5 text-2xl font-bold leading-snug tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              {title}
            </h2>

            <p className="mb-7 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>

            <ul className="space-y-3">
              {bullets.map(bullet => (
                <li key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Screenshot column ───────────────────────────────────── */}
          <div className="relative w-full lg:flex-1">
            {/* Ambient glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 rounded-2xl"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(52,211,153,0.07) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            <div className="relative flex flex-col gap-3">
              {/* Primary screenshot — premium app window */}
              <AppWindow src={imageSrc} alt={imageAlt} />

              {/* Secondary screenshot (if provided) */}
              {secondImageSrc && secondImageAlt && (
                <AppWindow src={secondImageSrc} alt={secondImageAlt} />
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ── Premium App Window Frame ───────────────────────────────────────────── */

function AppWindow({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shadow-2xl shadow-black/10 dark:shadow-black/60 ring-1 ring-black/[0.04] dark:ring-white/[0.04]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
        <div className="ml-2 flex h-5 flex-1 max-w-[200px] items-center rounded-md bg-zinc-200 dark:bg-zinc-800 px-3">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-600 truncate">app.bkick.com.br</span>
        </div>
      </div>

      {/* Screenshot */}
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={875}
        className="h-auto w-full"
        quality={95}
      />
    </div>
  )
}
