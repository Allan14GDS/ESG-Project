import { Suspense } from "react";
import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { sanityFetch } from "@/sanity/lib/live";
import Header from "@/components/Header";
import {
  BlogCard,
  FeaturedPost,
  BlogCardSkeleton,
  FeaturedPostSkeleton,
  type BlogPost,
} from "@/components/blog/BlogCard";

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Blog | GRI 2 ESG",
  description:
    "Análises, guias e tendências sobre sustentabilidade corporativa, relatórios GRI e melhores práticas ESG.",
};

// ─── GROQ Query ───────────────────────────────────────────────────────────────
// Ordena por publishedAt desc; desempata pelo _createdAt desc (mais recente primeiro).

export const ALL_POSTS_QUERY = `
  *[_type == "post"] | order(publishedAt desc, _createdAt desc) {
    _id,
    _createdAt,
    title,
    slug,
    publishedAt,
    "excerpt": pt::text(body)[0..220],
    mainImage {
      asset,
      alt
    },
    "author": author->{ name },
    "categories": categories[]->{ _id, title }
  }
` as const;

export type AllPostsQueryResult = BlogPost[];

// ─── Sort Utility ─────────────────────────────────────────────────────────────
// Exportada para permitir testes unitários isolados da regra de negócio.
// Regra: publishedAt desc; desempate por _createdAt desc.

export function sortPosts(posts: AllPostsQueryResult): AllPostsQueryResult {
  return [...posts].sort((a, b) => {
    const pubA = new Date(a.publishedAt ?? "").getTime();
    const pubB = new Date(b.publishedAt ?? "").getTime();
    if (pubB !== pubA) return pubB - pubA;

    const createdA = new Date(a._createdAt ?? "").getTime();
    const createdB = new Date(b._createdAt ?? "").getTime();
    return createdB - createdA;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 px-6 py-28 text-center md:px-12 md:py-36">
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
      />
      {/* Top emerald accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
      />
      {/* Radial bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-50/80 dark:bg-zinc-900/80 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          Conteúdo & Insights
        </span>

        <h1
          data-testid="blog-page-title"
          className="mt-5 bg-gradient-to-b from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-6xl font-bold tracking-[-0.03em] text-transparent md:text-7xl lg:text-8xl"
        >
          Blog ESG
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500 md:text-lg">
          Análises, guias e tendências sobre sustentabilidade corporativa,
          relatórios GRI e melhores práticas ESG.
        </p>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      data-testid="blog-empty-state"
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
        <PenLine className="h-7 w-7 text-zinc-600" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
        Nenhum artigo publicado ainda.
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Em breve, novos conteúdos sobre ESG e sustentabilidade.
      </p>
    </div>
  );
}

// ─── Skeleton: página inteira ─────────────────────────────────────────────────

const SKELETON_GRID_COUNT = 3;

export function BlogPostsSkeleton() {
  return (
    <section
      aria-label="Carregando artigos..."
      data-testid="blog-posts-skeleton"
      className="mx-auto max-w-7xl px-6 py-24 md:px-12 lg:px-24"
    >
      <div className="flex flex-col gap-16">
        <FeaturedPostSkeleton />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_GRID_COUNT }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Posts Content (async — alimenta o Suspense) ──────────────────────────────

export async function BlogPostsList() {
  const { data: rawPosts } = await sanityFetch<AllPostsQueryResult>({
    query: ALL_POSTS_QUERY,
  });

  const posts = sortPosts(rawPosts);
  const featuredPost = posts[0];

  if (posts.length === 0) {
    return (
    <section
      aria-label="Lista de artigos"
      className="mx-auto max-w-7xl px-6 py-24 md:px-12 lg:px-24"
    >
      <EmptyState />
      </section>
    );
  }

  return (
    <section
      aria-label="Lista de artigos"
      className="mx-auto max-w-7xl px-6 py-24 md:px-12 lg:px-24"
    >
      <div className="flex flex-col gap-16">
        {/* ── Featured Post ──────────────────────────────────────── */}
        <FeaturedPost post={featuredPost} />

        {/* ── Divisor + Grid de artigos ──────────────────────────── */}
        <div>
          <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Últimos Artigos
            </h2>
          </div>

          <div
            data-testid="blog-posts-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white">
      <Header />

      <main>
        <PageHeader />

        <Suspense fallback={<BlogPostsSkeleton />}>
          <BlogPostsList />
        </Suspense>
      </main>
    </div>
  );
}
