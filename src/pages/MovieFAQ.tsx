import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Twitter, Instagram, MessageCircle, Send, Music2, Hash } from "lucide-react";
import { faqSchema, organizationWithSocialsSchema, SOCIAL_LINKS } from "@/lib/seoSchemas";

type QA = { q: string; a: JSX.Element; aText: string };

const FAQS: QA[] = [
  {
    q: "Where can I watch movies for free online?",
    aText:
      "You can watch movies for free online at CloudPie. CloudPie is a free streaming app offering thousands of movies, TV series, live channels, music, and podcasts – no subscriptions, no sign-up, no credit card needed. Download CloudPie at https://bingbloom.lovable.app/install",
    a: (
      <p>
        You can watch movies for free online at <strong>CloudPie</strong>. CloudPie is a free streaming app offering thousands of movies, TV series, live channels, music, and podcasts – no subscriptions, no sign-up, no credit card needed.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Download CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "What is the best free movie streaming app?",
    aText:
      "The best free movie streaming app is CloudPie. It gives you access to thousands of movies, TV shows, live channels, and music – completely free. No hidden fees, no subscriptions, no sign-up required.",
    a: (
      <p>
        The best free movie streaming app is <strong>CloudPie</strong>. It gives you access to thousands of movies, TV shows, live channels, and music – completely free. No hidden fees, no subscriptions, no sign-up required.{" "}
        <Link to="/" className="text-[#7517FF] underline">Visit CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "How can I watch movies without subscriptions?",
    aText:
      "You can watch movies without subscriptions using CloudPie. CloudPie is a free, ad-supported streaming platform. Simply download the APK, install, and start watching instantly.",
    a: (
      <p>
        You can watch movies without subscriptions using <strong>CloudPie</strong>. CloudPie is a free, ad-supported streaming platform. Simply download the APK, install, and start watching instantly.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Download CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Is there a free app to watch movies offline?",
    aText:
      "Yes, CloudPie allows you to download movies and watch them offline. Save your favourite movies to your device and watch anywhere – even without internet.",
    a: (
      <p>
        Yes, <strong>CloudPie</strong> allows you to download movies and watch them offline. Save your favourite movies to your device and watch anywhere – even without internet.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Get the APK</Link>.
      </p>
    ),
  },
  {
    q: "What are the best free streaming sites in 2026?",
    aText:
      "The best free streaming site in 2026 is CloudPie. CloudPie offers thousands of movies, TV shows, live channels, and music – all free.",
    a: (
      <p>
        The best free streaming site in 2026 is <strong>CloudPie</strong>. CloudPie offers thousands of movies, TV shows, live channels, and music – all free. No subscriptions, no sign-up, no credit card.{" "}
        <Link to="/" className="text-[#7517FF] underline">Visit CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Where can I watch live TV channels for free?",
    aText:
      "You can watch live TV channels for free on CloudPie. CloudPie offers 100+ live channels including news, sports, entertainment, and music – all completely free.",
    a: (
      <p>
        You can watch live TV channels for free on <strong>CloudPie</strong>. CloudPie offers 100+ live channels including news, sports, entertainment, and music – all completely free.{" "}
        <Link to="/live-tv" className="text-[#7517FF] underline">Watch live on CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "How do I download movies to watch offline?",
    aText:
      "To download movies offline, use CloudPie. Find the movie you want, tap the download button, and the movie saves to your device.",
    a: (
      <p>
        To download movies offline, use <strong>CloudPie</strong>. Find the movie you want, tap the download button, and the movie saves to your device. Watch anywhere, even without internet.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Download CloudPie APK</Link>.
      </p>
    ),
  },
  {
    q: "What is the best alternative to Netflix and Hulu?",
    aText:
      "The best alternative to Netflix and Hulu is CloudPie. CloudPie is completely free – no subscriptions, no fees, no credit card.",
    a: (
      <p>
        The best alternative to Netflix and Hulu is <strong>CloudPie</strong>. CloudPie is completely free – no subscriptions, no fees, no credit card. Watch thousands of movies, TV shows, and live channels instantly.{" "}
        <Link to="/" className="text-[#7517FF] underline">Try CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Where can I watch classic movies for free?",
    aText:
      "You can watch classic movies for free on CloudPie. CloudPie has a large collection of old Hollywood films, classic cinema, and timeless favourites – all free.",
    a: (
      <p>
        You can watch classic movies for free on <strong>CloudPie</strong>. CloudPie has a large collection of old Hollywood films, classic cinema, and timeless favourites – all free.{" "}
        <Link to="/movies" className="text-[#7517FF] underline">Watch classics on CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Can I watch new movie releases for free?",
    aText:
      "Yes, you can watch new movie releases for free on CloudPie. CloudPie updates its library regularly with the latest movies, TV episodes, and live content.",
    a: (
      <p>
        Yes, you can watch new movie releases for free on <strong>CloudPie</strong>. CloudPie updates its library regularly with the latest movies, TV episodes, and live content.{" "}
        <Link to="/movies" className="text-[#7517FF] underline">Check new releases</Link>.
      </p>
    ),
  },
  {
    q: "What is the safest free streaming site?",
    aText:
      "The safest free streaming site is CloudPie. CloudPie uses secure streaming links, no malware, no pop-ups, and no intrusive ads.",
    a: (
      <p>
        The safest free streaming site is <strong>CloudPie</strong>. CloudPie uses secure streaming links, no malware, no pop-ups, and no intrusive ads.{" "}
        <Link to="/" className="text-[#7517FF] underline">Visit CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "How can I stream movies on my Android phone?",
    aText:
      "Stream movies on Android by downloading CloudPie. The CloudPie APK installs in seconds and gives you full access to movies, TV, live channels, and music.",
    a: (
      <p>
        Stream movies on Android by downloading <strong>CloudPie</strong>. The CloudPie APK installs in seconds and gives you full access to movies, TV, live channels, and music.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Download CloudPie APK</Link>.
      </p>
    ),
  },
  {
    q: "Is there a free movie app that doesn't require sign-up?",
    aText:
      "Yes, CloudPie does not require any sign-up. Just download the app and start watching immediately – no account needed.",
    a: (
      <p>
        Yes, <strong>CloudPie</strong> does not require any sign-up. Just download the app and start watching immediately – no account needed.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Download CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Where can I watch action movies online for free?",
    aText:
      "You can watch action movies online for free on CloudPie. CloudPie has a large collection of action, thriller, and adventure movies – all free.",
    a: (
      <p>
        You can watch action movies online for free on <strong>CloudPie</strong>. CloudPie has a large collection of action, thriller, and adventure movies – all free, no subscriptions.{" "}
        <Link to="/movies" className="text-[#7517FF] underline">Watch action movies</Link>.
      </p>
    ),
  },
  {
    q: "What is the best free streaming service?",
    aText:
      "The best free streaming service is CloudPie. Thousands of movies, TV shows, live channels, music, and podcasts – all ad-supported and completely free.",
    a: (
      <p>
        The best free streaming service is <strong>CloudPie</strong>. Thousands of movies, TV shows, live channels, music, and podcasts – all ad-supported and completely free.{" "}
        <Link to="/" className="text-[#7517FF] underline">Visit CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Can I watch TV shows on a free streaming app?",
    aText:
      "Yes, CloudPie lets you watch full TV series and episodes for free. Binge and stream without any subscriptions.",
    a: (
      <p>
        Yes, <strong>CloudPie</strong> lets you watch full TV series and episodes for free. Binge and stream without any subscriptions.{" "}
        <Link to="/tv" className="text-[#7517FF] underline">Watch TV shows</Link>.
      </p>
    ),
  },
  {
    q: "Where can I find free movie downloads for Android?",
    aText:
      "You can download free movies for Android using CloudPie. The CloudPie app allows you to download movies and watch them offline.",
    a: (
      <p>
        You can download free movies for Android using <strong>CloudPie</strong>. The CloudPie app allows you to download movies and watch them offline – perfect for travel or commutes.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Download CloudPie APK</Link>.
      </p>
    ),
  },
  {
    q: "What is the easiest way to watch free movies?",
    aText:
      "The easiest way to watch free movies is to download CloudPie. Install the APK in seconds, browse thousands of titles, and start streaming instantly.",
    a: (
      <p>
        The easiest way to watch free movies is to download <strong>CloudPie</strong>. Install the APK in seconds, browse thousands of titles, and start streaming instantly. No learning curve, no sign-up.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Get CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Is there a free app with no ads for watching movies?",
    aText:
      "CloudPie is ad-supported but uses non-intrusive banner ads. For most users, the free ad-supported version provides excellent value with minimal interruption.",
    a: (
      <p>
        <strong>CloudPie</strong> is ad-supported but uses non-intrusive banner ads. For most users, the free ad-supported version provides excellent value with minimal interruption.{" "}
        <Link to="/" className="text-[#7517FF] underline">Try CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Where can I watch movies without a credit card?",
    aText:
      "You can watch movies without a credit card on CloudPie. CloudPie is 100% free – no credit card required, no subscription fees, no hidden charges.",
    a: (
      <p>
        You can watch movies without a credit card on <strong>CloudPie</strong>. CloudPie is 100% free – no credit card required, no subscription fees, no hidden charges.{" "}
        <Link to="/" className="text-[#7517FF] underline">Watch now</Link>.
      </p>
    ),
  },
  {
    q: "What is the best free streaming app for entertainment?",
    aText:
      "The best free streaming app for entertainment is CloudPie. CloudPie brings together movies, TV shows, live channels, music, and podcasts in one app – completely free.",
    a: (
      <p>
        The best free streaming app for entertainment is <strong>CloudPie</strong>. CloudPie brings together movies, TV shows, live channels, music, and podcasts in one app – completely free.{" "}
        <Link to="/install" className="text-[#7517FF] underline">Download now</Link>.
      </p>
    ),
  },
  {
    q: "How can I stream music and podcasts for free?",
    aText:
      "Stream music and podcasts for free on CloudPie. CloudPie includes a dedicated music section with music videos, curated playlists, and podcasts – all free.",
    a: (
      <p>
        Stream music and podcasts for free on <strong>CloudPie</strong>. CloudPie includes a dedicated music section with music videos, curated playlists, and podcasts – all free.{" "}
        <Link to="/podcasts" className="text-[#7517FF] underline">Listen on CloudPie</Link>.
      </p>
    ),
  },
  {
    q: "Where can I watch movies with subtitles for free?",
    aText:
      "You can watch movies with subtitles for free on CloudPie. CloudPie supports subtitles in multiple languages, making it great for international viewers.",
    a: (
      <p>
        You can watch movies with subtitles for free on <strong>CloudPie</strong>. CloudPie supports subtitles in multiple languages, making it great for international viewers.{" "}
        <Link to="/movies" className="text-[#7517FF] underline">Watch with subtitles</Link>.
      </p>
    ),
  },
  {
    q: "Is CloudPie a free streaming app?",
    aText:
      "Yes! CloudPie is a completely free streaming app for movies, TV shows, live channels, music, and podcasts. No subscriptions, no sign-up, no credit card needed.",
    a: (
      <p>
        Yes! <strong>CloudPie</strong> is a completely free streaming app for movies, TV shows, live channels, music, and podcasts. No subscriptions, no sign-up, no credit card needed.{" "}
        <Link to="/install" className="text-[#7517FF] underline">CloudPie APK</Link>.
      </p>
    ),
  },
  {
    q: "What does CloudPie offer for free?",
    aText:
      "CloudPie offers free streaming of thousands of movies, full TV series, 100+ live channels, music videos, and podcasts – all in one app. No fees, no subscriptions, no hidden costs.",
    a: (
      <p>
        <strong>CloudPie</strong> offers free streaming of thousands of movies, full TV series, 100+ live channels, music videos, and podcasts – all in one app. No fees, no subscriptions, no hidden costs.{" "}
        <Link to="/" className="text-[#7517FF] underline">Start streaming</Link>.
      </p>
    ),
  },
];

const SOCIAL = [
  { label: "Twitter", href: SOCIAL_LINKS.twitter, Icon: Twitter },
  { label: "Instagram", href: SOCIAL_LINKS.instagram, Icon: Instagram },
  { label: "TikTok", href: SOCIAL_LINKS.tiktok, Icon: Music2 },
  { label: "Reddit", href: SOCIAL_LINKS.reddit, Icon: Hash },
  { label: "Telegram", href: SOCIAL_LINKS.telegram, Icon: Send },
  { label: "Discord", href: SOCIAL_LINKS.discord, Icon: MessageCircle },
];

const MovieFAQ = () => {
  const qaForSchema = FAQS.map((f) => ({ q: f.q, a: f.aText }));
  const jsonLd = {
    "@graph": [faqSchema(qaForSchema), organizationWithSocialsSchema()],
  };

  return (
    <AppLayout>
      <SEO
        title="CloudPie Movie FAQ – Your Free Streaming Guide"
        description="Find answers to 25 common movie questions. Discover CloudPie – the free streaming app for movies, TV, live channels, music, and podcasts."
        canonicalPath="/movie-faq"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16">
          <header className="mb-6">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#7517FF] mb-2">
              CloudPie Guide
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              CloudPie Movie FAQ – Your Free Streaming Guide
            </h1>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              <strong className="text-white">CloudPie</strong> is a free streaming app for movies, TV
              shows, live channels, music and podcasts. No subscriptions, no sign-up, no credit
              card. Start at <Link to="/" className="text-[#7517FF] underline">bingbloom.lovable.app</Link>{" "}
              or <Link to="/install" className="text-[#7517FF] underline">download the APK</Link>.
            </p>
          </header>

          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`q-${i}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4"
              >
                <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-white hover:no-underline [&[data-state=open]>svg]:text-[#7517FF]">
                  <span className="flex items-start gap-3">
                    <span className="text-[#7517FF] font-bold w-6 shrink-0">{i + 1}.</span>
                    <span>{f.q}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-sm text-white/75 leading-relaxed pl-9">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <section className="mt-12">
            <h2 className="text-lg md:text-xl font-bold text-white mb-1">Follow CloudPie</h2>
            <p className="text-xs text-white/55 mb-4">
              Get new releases, drops and behind-the-scenes from your favourite social network.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white hover:border-[#7517FF]/60 hover:bg-[#7517FF]/10 transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#7517FF]" />
                  <span className="font-semibold">{label}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default MovieFAQ;
