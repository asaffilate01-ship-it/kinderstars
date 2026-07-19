import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Clock, ArrowRight, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import SEOHead from "@/components/SEOHead";
import { blogPosts, blogCategories, getPostsByCategory } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";

const categoryI18nMap: Record<string, string> = {
  "Alle": "all",
  "Kindertagespflege": "kindertagespflege",
  "Recht & Regulierung": "recht",
  "Für Eltern": "eltern",
  "Für Betreuungspersonen": "betreuung",
  "Förderung & Steuer": "foerderung",
  "Gesundheit & Sicherheit": "gesundheit",
};

const Blog = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("Alle");
  const filtered = getPostsByCategory(activeCategory);

  return (
    <>
      <SEOHead
        title={t("blog.heading")}
        description={t("blog.description")}
        ogType="blog"
      />
      <Navbar />
      <main className="max-w-[1120px] mx-auto px-6 pt-10 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">{t("blog.title")}</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            {t("blog.heading")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("blog.description")}
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {blogCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-card text-muted-foreground border-border hover:border-secondary/40"
              }`}
            >
              {t(`blog.categories.${categoryI18nMap[cat]}`, cat)}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.image}
                  alt={t(`blog.posts.${post.i18nKey}.title`, post.title)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[11px]">
                    <Tag className="w-3 h-3 mr-1" />
                    {t(`blog.categories.${post.categoryKey}`, post.category)}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <h2 className="font-bold text-foreground text-sm leading-snug mb-2 group-hover:text-secondary transition-colors line-clamp-2">
                  {t(`blog.posts.${post.i18nKey}.title`, post.title)}
                </h2>
                <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                  {t(`blog.posts.${post.i18nKey}.excerpt`, post.excerpt)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(post.date), "dd MMM yyyy")}
                  </span>
                  <span className="text-secondary text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t("blog.readMore")} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No articles found in this category.</p>
        )}
      </main>
      <div className="max-w-[1120px] mx-auto px-6">
        <Footer />
      </div>
      <ScrollToTop />
    </>
  );
};

export default Blog;
