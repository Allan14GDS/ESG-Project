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
}: FeatureBlockProps) {
  return (
    <section className="border-t border-white/[0.07] py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Text block */}
        <div className="mx-auto max-w-xl text-center mb-10">
          <span className="mb-3 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
            {badge}
          </span>

          <h2 className="mt-2 text-2xl font-bold leading-snug text-white sm:text-3xl">
            {title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/55">{description}</p>

          {/* Bullets — 2-col grid */}
          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-left">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-xs leading-relaxed text-white/65">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Screenshot(s) */}
        <div className="relative mx-auto max-w-4xl flex flex-col gap-3">
          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-b from-emerald-500/6 to-transparent blur-2xl pointer-events-none" />

          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1400}
            height={875}
            className="relative w-full h-auto rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
            quality={95}
          />

          {secondImageSrc && secondImageAlt && (
            <Image
              src={secondImageSrc}
              alt={secondImageAlt}
              width={1400}
              height={875}
              className="relative w-full h-auto rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
              quality={95}
            />
          )}
        </div>

      </div>
    </section>
  )
}
