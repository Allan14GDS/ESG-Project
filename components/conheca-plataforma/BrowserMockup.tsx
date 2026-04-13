import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrowserMockupProps {
  src: string
  alt: string
  className?: string
}

export function BrowserMockup({ src, alt, className }: BrowserMockupProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60 bg-white",
        className
      )}
    >
      {/* Browser chrome bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#f0f0f0] border-b border-black/8">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-2">
          <div className="h-5 rounded-md bg-white/80 border border-black/10 flex items-center px-3 max-w-xs mx-auto">
            <span className="text-[10px] text-gray-400 truncate">bkick.com.br</span>
          </div>
        </div>
      </div>

      {/* Screenshot */}
      <div className="relative w-full">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={750}
          className="w-full h-auto block"
          quality={90}
        />
      </div>
    </div>
  )
}
