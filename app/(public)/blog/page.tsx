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
    <section className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 px-6 py-20 text-center md:px-12">
      <div className="mx-auto max-w-3xl">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-300/60 dark:border-zinc-700/60 bg-zinc-100/80 dark:bg-zinc-900/80 px-3 py-1 text-xs font-medium tracking-wide text-zinc-600 dark:text-zinc-400">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          Conteúdo & Insights
        </span>

        <h1
          data-testid="blog-page-title"
          className="mt-4 bg-gradient-to-b from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl"
        >
          Blog ESG
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-500 md:text-lg">
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
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-100/80 dark:bg-zinc-900/80">
        <PenLine className="h-7 w-7 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
        Nenhum artigo publicado ainda.
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-600">
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
      className="mx-auto max-w-7xl px-6 py-20 md:px-12 lg:px-24"
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
        className="mx-auto max-w-7xl px-6 py-20 md:px-12 lg:px-24"
      >
        <EmptyState />
      </section>
    );
  }

  return (
    <section
      aria-label="Lista de artigos"
      className="mx-auto max-w-7xl px-6 py-20 md:px-12 lg:px-24"
    >
      <div className="flex flex-col gap-16">
        {/* ── Featured Post ──────────────────────────────────────── */}
        <FeaturedPost post={featuredPost} />

        {/* ── Divisor + Grid de artigos ──────────────────────────── */}
        <div>
          <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4 mb-8">
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
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
