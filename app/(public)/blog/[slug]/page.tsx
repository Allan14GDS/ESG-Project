import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, User2 } from "lucide-react";
import { PortableText } from "@portabletext/react";
import type { PortableTextComponents } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/live";
import { urlFor } from "@/sanity/lib/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SanityImageAsset {
  _ref: string;
  _type: "reference";
}

interface PostImage {
  _type: "image";
  asset: SanityImageAsset;
  alt?: string;
}

interface PortableTextSpan {
  _key: string;
  _type: "span";
  text: string;
  marks: string[];
}

interface PortableTextMarkDef {
  _key: string;
  _type: string;
  href?: string;
}

interface PortableTextBlock {
  _key: string;
  _type: string;
  style?: string;
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
  asset?: SanityImageAsset;
  alt?: string;
}

interface PostCategory {
  _id: string;
  title: string;
}

interface PostAuthor {
  name: string;
}

export interface SinglePost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  mainImage?: PostImage;
  author?: PostAuthor;
  categories?: PostCategory[];
  body?: PortableTextBlock[];
}

// ─── Query ────────────────────────────────────────────────────────────────────

export const POST_BY_SLUG_QUERY = `
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    "excerpt": pt::text(body)[0..220],
    mainImage {
      asset,
      alt
    },
    "author": author->{ name },
    "categories": categories[]->{ _id, title },
    body
  }
` as const;

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await sanityFetch<SinglePost | null>({
    query: POST_BY_SLUG_QUERY,
    params: { slug },
  });

  if (!post) return { title: "Post não encontrado | Blog ESG" };

  return {
    title: `${post.title} | Blog ESG`,
    description: post.excerpt,
    openGraph: post.mainImage
      ? {
          images: [
            { url: urlFor(post.mainImage).width(1200).height(630).fit("crop").url() },
          ],
        }
      : undefined,
  };
}

// ─── PortableText custom components ──────────────────────────────────────────

const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: PostImage }) => {
      if (!value?.asset?._ref) return null;
      return (
        <figure className="my-10 not-prose">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800">
            <Image
              src={urlFor(value).width(900).height(506).fit("crop").url()}
              alt={value.alt ?? "Imagem do artigo"}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
          {value.alt && (
            <figcaption className="mt-3 text-center text-sm text-zinc-500 italic">
              {value.alt}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-400 underline underline-offset-2 transition-colors hover:text-emerald-300"
      >
        {children}
      </a>
    ),
  },
  block: {
    blockquote: ({ children }) => (
      <blockquote className="not-prose my-8 border-l-4 border-emerald-500/50 pl-6 italic text-zinc-400">
        {children}
      </blockquote>
    ),
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: post } = await sanityFetch<SinglePost | null>({
    query: POST_BY_SLUG_QUERY,
    params: { slug },
  });

  if (!post) {
    notFound();
  }

  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(1400).height(700).fit("crop").url()
    : null;

  return (
    <div className="min-h-screen bg-black">
      {/* ── Cover Image ──────────────────────────────────────────────────── */}
      <header className="relative w-full">
        {imageUrl ? (
          <div className="relative h-[55vh] min-h-72 w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt ?? post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              data-testid="post-cover-image"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
          </div>
        ) : (
          <div
            data-testid="post-cover-placeholder"
            className="flex h-48 items-center justify-center bg-zinc-950"
          >
            <span className="text-5xl text-zinc-700" aria-hidden="true">
              ✦
            </span>
          </div>
        )}
      </header>

      {/* ── Article ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-6 pb-24 md:px-8">
        {/* Back button */}
        <nav className="py-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label="Voltar para o blog"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Todos os artigos
          </Link>
        </nav>

        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div
            className="mb-5 flex flex-wrap gap-2"
            data-testid="post-categories"
          >
            {post.categories.map((category) => (
              <span
                key={category._id}
                className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-zinc-400"
              >
                {category.title}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          data-testid="post-title"
          className="text-4xl font-bold leading-tight tracking-tight text-zinc-100 md:text-5xl"
        >
          {post.title}
        </h1>

        {/* Byline */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-800 pb-8">
          {post.author?.name && (
            <div
              data-testid="post-author"
              className="flex items-center gap-2 text-sm text-zinc-400"
            >
              <User2 className="h-4 w-4" aria-hidden="true" />
              <span>{post.author.name}</span>
            </div>
          )}

          {post.publishedAt && (
            <div
              data-testid="post-date"
              className="flex items-center gap-2 text-sm text-zinc-500"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </div>
          )}
        </div>

        {/* Body */}
        {post.body && post.body.length > 0 && (
          <div
            data-testid="post-body"
            className={[
              "mt-10",
              "prose prose-lg prose-invert",
              "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-100",
              "prose-p:text-zinc-300 prose-p:leading-relaxed",
              "prose-strong:text-zinc-100",
              "prose-em:text-zinc-300",
              "prose-code:rounded prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-emerald-400",
              "prose-pre:border prose-pre:border-zinc-800 prose-pre:bg-zinc-900",
              "prose-ul:text-zinc-300 prose-ol:text-zinc-300",
              "prose-li:marker:text-zinc-500",
              "prose-hr:border-zinc-800",
              "max-w-none",
            ].join(" ")}
          >
            <PortableText
              value={post.body}
              components={portableTextComponents}
            />
          </div>
        )}
      </div>
    </div>
  );
}
