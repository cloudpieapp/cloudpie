import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import TmdbRow from "@/components/TmdbRow";
import InlineAdRow from "@/components/InlineAdRow";
import {
  useTrendingMovies,
  usePopularMovies,
  useTopRatedMovies,
  useUpcomingMovies,
  useNowPlayingMovies,
  useMoviesByGenre,
} from "@/hooks/useTmdb";
import { GENRES } from "@/lib/tmdb";

const MoviesPage = () => {
  const trending = useTrendingMovies();
  const popular = usePopularMovies();
  const topRated = useTopRatedMovies();
  const upcoming = useUpcomingMovies();
  const nowPlaying = useNowPlayingMovies();
  const action = useMoviesByGenre(GENRES.action);
  const adventure = useMoviesByGenre(GENRES.adventure);
  const drama = useMoviesByGenre(GENRES.drama);
  const comedy = useMoviesByGenre(GENRES.comedy);
  const scifi = useMoviesByGenre(GENRES.scifi);
  const horror = useMoviesByGenre(GENRES.horror);
  const animation = useMoviesByGenre(GENRES.animation);
  const family = useMoviesByGenre(GENRES.family);
  const thriller = useMoviesByGenre(GENRES.thriller);
  const romance = useMoviesByGenre(GENRES.romance);
  const fantasy = useMoviesByGenre(GENRES.fantasy);
  const crime = useMoviesByGenre(GENRES.crime);

  return (
    <AppLayout>
      <SEO
        title="Movies – BingBloom"
        description="Browse trending, top-rated, now playing and upcoming movies across every genre. Stream full HD movies free on BingBloom."
        jsonLd={{
          "@type": "CollectionPage",
          name: "Movies – BingBloom",
          description: "Browse trending, top-rated, now playing and upcoming movies across every genre.",
          url: "https://bingbloom.lovable.app/movies",
        }}
      />
      <div className="px-[4%] pt-6 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Movies</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover trending, top-rated and upcoming films</p>
      </div>

      <InlineAdRow count={4} />

      <TmdbRow title="Trending This Week" items={trending.data} isLoading={trending.isLoading} isError={trending.isError} onRetry={trending.refetch} type="movie" />
      <TmdbRow title="Now Playing in Theaters" items={nowPlaying.data} isLoading={nowPlaying.isLoading} isError={nowPlaying.isError} onRetry={nowPlaying.refetch} type="movie" />
      <TmdbRow title="Upcoming Releases" items={upcoming.data} isLoading={upcoming.isLoading} isError={upcoming.isError} onRetry={upcoming.refetch} type="movie" />
      <InlineAdRow />
      <TmdbRow title="Top Rated of All Time" items={topRated.data} isLoading={topRated.isLoading} isError={topRated.isError} onRetry={topRated.refetch} type="movie" ranked />
      <TmdbRow title="Popular Right Now" items={popular.data} isLoading={popular.isLoading} isError={popular.isError} onRetry={popular.refetch} type="movie" />
      <TmdbRow title="Action & Adventure" items={action.data} isLoading={action.isLoading} isError={action.isError} onRetry={action.refetch} type="movie" />
      <TmdbRow title="Adventure" items={adventure.data} isLoading={adventure.isLoading} isError={adventure.isError} onRetry={adventure.refetch} type="movie" />
      <TmdbRow title="Sci-Fi" items={scifi.data} isLoading={scifi.isLoading} isError={scifi.isError} onRetry={scifi.refetch} type="movie" />
      <InlineAdRow />
      <TmdbRow title="Drama" items={drama.data} isLoading={drama.isLoading} isError={drama.isError} onRetry={drama.refetch} type="movie" />
      <TmdbRow title="Comedy" items={comedy.data} isLoading={comedy.isLoading} isError={comedy.isError} onRetry={comedy.refetch} type="movie" />
      <TmdbRow title="Horror" items={horror.data} isLoading={horror.isLoading} isError={horror.isError} onRetry={horror.refetch} type="movie" />
      <TmdbRow title="Thriller" items={thriller.data} isLoading={thriller.isLoading} isError={thriller.isError} onRetry={thriller.refetch} type="movie" />
      <TmdbRow title="Romance" items={romance.data} isLoading={romance.isLoading} isError={romance.isError} onRetry={romance.refetch} type="movie" />
      <InlineAdRow />
      <TmdbRow title="Fantasy" items={fantasy.data} isLoading={fantasy.isLoading} isError={fantasy.isError} onRetry={fantasy.refetch} type="movie" />
      <TmdbRow title="Crime" items={crime.data} isLoading={crime.isLoading} isError={crime.isError} onRetry={crime.refetch} type="movie" />
      <TmdbRow title="Animation" items={animation.data} isLoading={animation.isLoading} isError={animation.isError} onRetry={animation.refetch} type="movie" />
      <TmdbRow title="Family" items={family.data} isLoading={family.isLoading} isError={family.isError} onRetry={family.refetch} type="movie" />
    </AppLayout>
  );
};

export default MoviesPage;
