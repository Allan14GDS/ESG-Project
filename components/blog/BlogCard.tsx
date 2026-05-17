import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, User2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { urlFor } from "@/sanity/lib/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SanityImageAsset {
  _ref: string;
  _type: "reference";
}

interface PostMainImage {
  _type: "image";
  asset: SanityImageAsset;
  alt?: string;
}

interface PostAuthor {
  name: string;
}

interface PostCategory {
  _id: string;
  title: string;
}

export interface BlogPost {
  _id: string;
  _createdAt?: string;
  title: string;
  slug: { current: string };
  mainImage?: PostMainImage;
  author?: PostAuthor;
  categories?: PostCategory[];
  publishedAt?: string;
  excerpt?: string;
}

interface BlogCardProps {
  post?: BlogPost;
  isLoading?: boolean;
}

// ─── Skeleton: Card ───────────────────────────────────────────────────────────

export function BlogCardSkeleton() {
  return (
    <article
      data-testid="blog-card-skeleton"
      aria-label="Carregando post..."
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/40 backdrop-blur-sm"
    >
      <Skeleton className="aspect-video w-full rounded-none bg-zinc-200/70 dark:bg-zinc-800/70" />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
          <Skeleton className="h-5 w-20 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-6 w-full rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
          <Skeleton className="h-6 w-4/5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
          <Skeleton className="h-6 w-3/5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
          <Skeleton className="h-4 w-full rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
          <Skeleton className="h-5 w-24 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
          <Skeleton className="h-4 w-24 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
        </div>
      </div>
    </article>
  );
}

// ─── Skeleton: Featured Post ──────────────────────────────────────────────────

export function FeaturedPostSkeleton() {
  return (
    <article
      data-testid="blog-featured-skeleton"
      aria-label="Carregando artigo em destaque..."
      className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-6 p-8 lg:p-12">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
              <Skeleton className="h-6 w-20 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
              <Skeleton className="h-12 w-4/5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
              <Skeleton className="h-4 w-full rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
              <Skeleton className="h-4 w-3/4 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 pt-5">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
              <Skeleton className="h-4 w-28 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70" />
          </div>
        </div>
        <Skeleton className="aspect-[16/9] w-full rounded-none bg-zinc-200/70 dark:bg-zinc-800/70 lg:aspect-auto lg:min-h-[400px]" />
      </div>
    </article>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPublishedDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildImageUrl(image: PostMainImage): string {
  return urlFor(image).width(800).height(450).fit("crop").url();
}

// ─── Category Pill ────────────────────────────────────────────────────────────

function CategoryPill({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full",
        "border border-zinc-200/50 dark:border-zinc-700/50",
        "bg-zinc-100/50 dark:bg-zinc-800/50",
        "px-2.5 py-1 text-xs font-medium",
        "text-zinc-600 dark:text-zinc-400",
        "transition-colors duration-200",
        className,
      ].join(" ")}
    >
      {title}
    </span>
  );
}

// ─── Featured Post ────────────────────────────────────────────────────────────

interface FeaturedPostProps {
  post: BlogPost;
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(675).fit("crop").url()
    : null;
  const imageAlt = post.mainImage?.alt ?? post.title;
  const formattedDate = post.publishedAt ? formatPublishedDate(post.publishedAt) : null;
  const postHref = `/blog/${post.slug.current}`;

  return (
    <article
      data-testid="blog-featured-post"
      className={[
        "group relative overflow-hidden rounded-2xl",
        "border border-zinc-200 dark:border-zinc-800",
        "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm",
        "transition-all duration-500 ease-out",
        "hover:border-zinc-300 dark:hover:border-zinc-700",
        "hover:shadow-[0_0_80px_-20px_rgba(16,185,129,0.18)]",
      ].join(" ")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Content — justify-between empurra o rodapé para baixo */}
        <div className="flex flex-col justify-between gap-6 p-8 lg:p-12">
          {/* Topo: badge + título + resumo agrupados */}
          <div className="flex flex-col gap-4">
            {/* Destaque badge + categories */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/50 bg-emerald-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                Destaque
              </span>
              {post.categories && post.categories.length > 0 &&
                post.categories.map((cat) => (
                  <CategoryPill key={cat._id} title={cat.title} />
                ))}
            </div>

            {/* Title */}
            <Link href={postHref}>
              <h2
                data-testid="blog-featured-title"
                className={[
                  "text-4xl font-bold tracking-tight text-balance",
                  "text-zinc-800 dark:text-zinc-100 lg:text-5xl",
                  "transition-colors duration-200 group-hover:text-zinc-900 dark:group-hover:text-white",
                ].join(" ")}
              >
                {post.title}
              </h2>
            </Link>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="line-clamp-3 text-base leading-relaxed text-zinc-500">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Rodapé: author + date + CTA ancorado ao fundo */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-5">
            <div className="flex items-center gap-4">
              {post.author?.name && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <User2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{post.author.name}</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  <time dateTime={post.publishedAt}>{formattedDate}</time>
                </div>
              )}
            </div>
            <Link
              href={postHref}
              className={[
                "inline-flex items-center gap-2 rounded-full",
                "border border-zinc-200 dark:border-zinc-700",
                "bg-zinc-50 dark:bg-zinc-900 px-4 py-2",
                "text-xs font-medium text-zinc-700 dark:text-zinc-300",
                "transition-all duration-200",
                "hover:border-emerald-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                "hover:text-zinc-900 dark:hover:text-white",
              ].join(" ")}
            >
              Ler artigo <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-900 lg:aspect-auto lg:min-h-[400px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              data-testid="blog-featured-image"
            />
          ) : (
            <div
              data-testid="blog-featured-image-placeholder"
              className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900"
            >
              <span className="text-6xl text-zinc-300 dark:text-zinc-700" aria-hidden="true">
                ✦
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-zinc-950/40 lg:to-transparent" />
        </div>
      </div>

      {/* Bottom glow line (decorative) */}
      <div
        aria-hidden="true"
        className={[
          "absolute bottom-0 left-0 h-px w-full",
          "bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent",
          "opacity-0 transition-opacity duration-500 group-hover:opacity-100",
        ].join(" ")}
      />
    </article>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlogCard({ post, isLoading = false }: BlogCardProps) {
  if (isLoading || !post) {
    return <BlogCardSkeleton />;
  }

  const imageUrl = post.mainImage ? buildImageUrl(post.mainImage) : null;
  const imageAlt = post.mainImage?.alt ?? post.title;
  const formattedDate = post.publishedAt ? formatPublishedDate(post.publishedAt) : null;
  const postHref = `/blog/${post.slug.current}`;
  const primaryCategory = post.categories?.[0];

  return (
    <article
      data-testid="blog-card"
      className={[
        "group relative flex flex-col overflow-hidden rounded-2xl",
        "border border-zinc-200/60 dark:border-zinc-800/60",
        "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        "hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white/70 dark:hover:bg-zinc-900/70",
        "hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.12)]",
      ].join(" ")}
    >
      {/* Cover Image */}
      <Link href={postHref} aria-label={`Ler: ${post.title}`} tabIndex={-1}>
        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              data-testid="blog-card-image"
            />
          ) : (
            <div
              data-testid="blog-card-image-placeholder"
              className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900"
            >
              <span className="text-4xl text-zinc-300 dark:text-zinc-700">✦</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Categories (topo — para escaneamento visual) */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="blog-card-categories">
            {post.categories.map((category) => (
              <CategoryPill
                key={category._id}
                title={category.title}
                className="group-hover:border-zinc-400 dark:group-hover:border-zinc-600 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
              />
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={postHref}>
            <h2
            data-testid="blog-card-title"
            className={[
              "line-clamp-3 text-lg font-semibold tracking-tight text-balance",
              "text-zinc-800 dark:text-zinc-100 lg:text-xl",
              "transition-colors duration-200 group-hover:text-zinc-900 dark:group-hover:text-white",
            ].join(" ")}
          >
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p
            data-testid="blog-card-excerpt"
            className="line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-500"
          >
            {post.excerpt}
          </p>
        )}

        {/* Footer: primary category pill + author / date */}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
          <div className="flex items-center gap-2">
            {primaryCategory && (
              <CategoryPill
                title={primaryCategory.title}
                className="group-hover:border-zinc-400 dark:group-hover:border-zinc-600 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
              />
            )}
            {post.author?.name && (
              <div
                data-testid="blog-card-author"
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <User2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{post.author.name}</span>
              </div>
            )}
          </div>

          {formattedDate && (
            <div
              data-testid="blog-card-date"
              className="flex items-center gap-1.5 text-xs text-zinc-500"
            >
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <time dateTime={post.publishedAt}>{formattedDate}</time>
            </div>
          )}
        </div>
      </div>

      {/* Bottom glow line (decorative) */}
      <div
        aria-hidden="true"
        className={[
          "absolute bottom-0 left-0 h-px w-full",
          "bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent",
          "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        ].join(" ")}
      />
    </article>
  );
}
