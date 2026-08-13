import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import TmdbHero from "@/components/TmdbHero";
import TmdbRow from "@/components/TmdbRow";
import TmdbContinueRow from "@/components/TmdbContinueRow";
import CategoryChips from "@/components/CategoryChips";
import InlineAdRow from "@/components/InlineAdRow";
import StreamingBrandsRow from "@/components/StreamingBrandsRow";
import NewMoviesBanner from "@/components/NewMoviesBanner";
import {
  useTrendingMovies,
  useTrendingTv,
  useTopRatedMovies,
  useUpcomingMovies,
  useNowPlayingMovies,
  usePopularMovies,
  useMoviesByGenre,
  usePopularTv,
  useTopRatedTv,
  useAiringTodayTv,
  useOnAirTv,
  useAnimationMovies,
  useAnimationTv,
  useDocumentaryMovies,
  useDocumentaryTv,
} from "@/hooks/useTmdb";
import { GENRES } from "@/lib/tmdb";

const HomePage = () => {
  const trendingMovies = useTrendingMovies();
  const trendingTv = useTrendingTv();
  const topRated = useTopRatedMovies();
  const upcoming = useUpcomingMovies();
  const nowPlaying = useNowPlayingMovies();
  const popular = usePopularMovies();
  const popularTv = usePopularTv();
  const topRatedTv = useTopRatedTv();
  const airingToday = useAiringTodayTv();
  const onAir = useOnAirTv();
  const animationMovies = useAnimationMovies();
  const animationTv = useAnimationTv();
  const docMovies = useDocumentaryMovies();
  const docTv = useDocumentaryTv();
  const action = useMoviesByGenre(GENRES.action);
  const drama = useMoviesByGenre(GENRES.drama);
  const comedy = useMoviesByGenre(GENRES.comedy);
  const horror = useMoviesByGenre(GENRES.horror);
  const scifi = useMoviesByGenre(GENRES.scifi);
  const romance = useMoviesByGenre(GENRES.romance);
  const thriller = useMoviesByGenre(GENRES.thriller);

  const heroItem = trendingMovies.data?.[0];

  return (
    <AppLayout>
      <SEO
        title="BingBloom – Stream Movies, TV, Live & Music Free"
        description="Stream trending movies, TV shows, anime, music and live TV channels free on BingBloom. No subscription, no sign-up."
        jsonLd={{
          "@graph": [
            { "@type": "WebSite", name: "BingBloom", url: "https://bingbloom.lovable.app",
              potentialAction: { "@type": "SearchAction", target: "https://bingbloom.lovable.app/search?q={search_term_string}", "query-input": "required name=search_term_string" } },
            { "@type": "Organization", name: "BingBloom", url: "https://bingbloom.lovable.app", logo: "https://bingbloom.lovable.app/icon-512.png" },
            { "@type": "SoftwareApplication", name: "BingBloom", operatingSystem: "Android", applicationCategory: "MultimediaApplication",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              aggregateRating: { "@type": "AggregateRating", ratingValue: "4.7", ratingCount: "152000" },
              downloadUrl: "https://bingbloom.lovable.app/install" },
          ],
        }}
      />

      <NewMoviesBanner />

      <TmdbHero item={heroItem} type="movie" isLoading={trendingMovies.isLoading} />

      <CategoryChips />

      {/* Ad #1 */}
      <InlineAdRow count={4} />

      <TmdbContinueRow />

      <TmdbRow title="Popular Movies" items={popular.data} isLoading={popular.isLoading} isError={popular.isError} onRetry={popular.refetch} type="movie" viewAll="/movies" />
      <TmdbRow title="Trending Movies" items={trendingMovies.data} isLoading={trendingMovies.isLoading} isError={trendingMovies.isError} onRetry={trendingMovies.refetch} type="movie" viewAll="/movies" ranked />

      {/* Ad #2 */}
      <InlineAdRow count={4} />

      <TmdbRow title="Trending TV Shows" items={trendingTv.data} isLoading={trendingTv.isLoading} isError={trendingTv.isError} onRetry={trendingTv.refetch} type="tv" viewAll="/tv" ranked />
      <StreamingBrandsRow />
      <TmdbRow title="Now Playing" items={nowPlaying.data} isLoading={nowPlaying.isLoading} isError={nowPlaying.isError} onRetry={nowPlaying.refetch} type="movie" />
      <TmdbRow title="Upcoming Releases" items={upcoming.data} isLoading={upcoming.isLoading} isError={upcoming.isError} onRetry={upcoming.refetch} type="movie" />
      <TmdbRow title="Top Rated Movies" items={topRated.data} isLoading={topRated.isLoading} isError={topRated.isError} onRetry={topRated.refetch} type="movie" />
      <TmdbRow title="Popular TV Shows" items={popularTv.data} isLoading={popularTv.isLoading} isError={popularTv.isError} onRetry={popularTv.refetch} type="tv" />

      {/* Ad #3 */}
      <InlineAdRow count={4} />

      <TmdbRow title="Top Rated TV" items={topRatedTv.data} isLoading={topRatedTv.isLoading} isError={topRatedTv.isError} onRetry={topRatedTv.refetch} type="tv" />
      <TmdbRow title="Airing Today" items={airingToday.data} isLoading={airingToday.isLoading} isError={airingToday.isError} onRetry={airingToday.refetch} type="tv" />
      <TmdbRow title="On the Air" items={onAir.data} isLoading={onAir.isLoading} isError={onAir.isError} onRetry={onAir.refetch} type="tv" />
      <TmdbRow title="Action & Adventure" items={action.data} isLoading={action.isLoading} isError={action.isError} onRetry={action.refetch} type="movie" />
      <TmdbRow title="Drama" items={drama.data} isLoading={drama.isLoading} isError={drama.isError} onRetry={drama.refetch} type="movie" />
      <TmdbRow title="Comedy" items={comedy.data} isLoading={comedy.isLoading} isError={comedy.isError} onRetry={comedy.refetch} type="movie" />

      {/* Ad #4 */}
      <InlineAdRow count={4} />

      <TmdbRow title="Horror" items={horror.data} isLoading={horror.isLoading} isError={horror.isError} onRetry={horror.refetch} type="movie" />
      <TmdbRow title="Sci-Fi" items={scifi.data} isLoading={scifi.isLoading} isError={scifi.isError} onRetry={scifi.refetch} type="movie" />
      <TmdbRow title="Romance" items={romance.data} isLoading={romance.isLoading} isError={romance.isError} onRetry={romance.refetch} type="movie" />
      <TmdbRow title="Thriller" items={thriller.data} isLoading={thriller.isLoading} isError={thriller.isError} onRetry={thriller.refetch} type="movie" />
      <TmdbRow title="Animated Movies" items={animationMovies.data} isLoading={animationMovies.isLoading} isError={animationMovies.isError} onRetry={animationMovies.refetch} type="movie" viewAll="/animation" />
      <TmdbRow title="Animated Series" items={animationTv.data} isLoading={animationTv.isLoading} isError={animationTv.isError} onRetry={animationTv.refetch} type="tv" />
      <TmdbRow title="Documentaries" items={docMovies.data} isLoading={docMovies.isLoading} isError={docMovies.isError} onRetry={docMovies.refetch} type="movie" viewAll="/documentary" />
      <TmdbRow title="Documentary Series" items={docTv.data} isLoading={docTv.isLoading} isError={docTv.isError} onRetry={docTv.refetch} type="tv" />
    </AppLayout>
  );
};

export default HomePage;
