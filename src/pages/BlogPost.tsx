import { useParams, Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Clock, Tag, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import SEOHead from "@/components/SEOHead";
import SocialShare from "@/components/SocialShare";
import { getPostBySlug, blogPosts } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";

const SITE_URL = "https://www.kinderstars.co.uk";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  const postTitle = t(`blog.posts.${post.i18nKey}.title`, post.title);
  const postExcerpt = t(`blog.posts.${post.i18nKey}.excerpt`, post.excerpt);
  const postCategory = t(`blog.categories.${post.categoryKey}`, post.category);
  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  // Simple markdown-to-html
  const renderContent = (md: string) => {
    return md.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">{parseInline(trimmed.slice(3))}</h2>;
      if (trimmed.startsWith("### ")) return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{parseInline(trimmed.slice(4))}</h3>;
      if (trimmed.startsWith("> ")) return <blockquote key={i} className="border-l-4 border-secondary bg-secondary/5 rounded-r-xl px-4 py-3 my-4 text-sm text-muted-foreground italic">{parseInline(trimmed.slice(2))}</blockquote>;
      if (trimmed.startsWith("- ") || trimmed.startsWith("☑️") || trimmed.startsWith("✅") || trimmed.startsWith("🚩") || trimmed.startsWith("🟢")) {
        const content = trimmed.startsWith("- ") ? trimmed.slice(2) : trimmed;
        return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1 list-disc">{parseInline(content)}</li>;
      }
      if (/^\d+\.\s/.test(trimmed)) return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1 list-decimal">{parseInline(trimmed.replace(/^\d+\.\s/, ""))}</li>;
      if (trimmed === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{parseInline(trimmed)}</p>;
    });
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      return part;
    });
  };

  const related = blogPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);

  // Article structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "KinderStars Ltd",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };

  return (
    <>
      <SEOHead
        title={postTitle}
        description={postExcerpt}
        ogImage={post.image}
        ogType="article"
        canonical={postUrl}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Navbar />
      <main className="max-w-[720px] mx-auto px-6 pt-8 pb-16">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> {t("blog.backToBlog")}
        </Link>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="secondary">
            <Tag className="w-3 h-3 mr-1" /> {postCategory}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.readTime}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(post.date), "dd MMMM yyyy")}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
          {postTitle}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3.5 h-3.5" /> {post.author}
          </div>
          <SocialShare url={postUrl} title={postTitle} description={postExcerpt} />
        </div>

        <div className="rounded-2xl overflow-hidden mb-8">
          <img src={post.image} alt={postTitle} className="w-full aspect-[16/9] object-cover" />
        </div>

        <article className="prose-sm">
          {renderContent(t(`blog.posts.${post.i18nKey}.content`, post.content))}
        </article>

        {/* Share bottom */}
        <div className="mt-8 pt-6 border-t border-border">
          <SocialShare url={postUrl} title={postTitle} description={postExcerpt} />
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="font-bold text-sm mb-4">{t("blog.relatedArticles")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow group"
                >
                  <Badge variant="outline" className="text-[10px] mb-2">
                    {t(`blog.categories.${r.categoryKey}`, r.category)}
                  </Badge>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors line-clamp-2">
                    {t(`blog.posts.${r.i18nKey}.title`, r.title)}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{r.readTime}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <div className="max-w-[1120px] mx-auto px-6">
        <Footer />
      </div>
      <ScrollToTop />
    </>
  );
};

export default BlogPost;
