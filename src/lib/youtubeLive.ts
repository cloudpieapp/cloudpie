import type { IptvChannel } from "./iptv";

export interface YouTubeLiveDef {
  handle: string;
  name: string;
  group: string;
  country?: string;
  logo?: string;
}

// Curated list of always-live YouTube channels.
export const YOUTUBE_LIVE_CHANNELS: YouTubeLiveDef[] = [
  // 24/7 News
  { handle: "AlJazeeraEnglish", name: "Al Jazeera English", group: "News", country: "QA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Aljazeera_eng.svg/512px-Aljazeera_eng.svg.png" },
  { handle: "BloombergTelevision", name: "Bloomberg TV", group: "News", country: "US", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/New_Bloomberg_Logo.svg/512px-New_Bloomberg_Logo.svg.png" },
  { handle: "SkyNews", name: "Sky News", group: "News", country: "GB", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sky_News_2020.svg/512px-Sky_News_2020.svg.png" },
  { handle: "BBCNews", name: "BBC News", group: "News", country: "GB", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2022_%28Boxed%29.svg/512px-BBC_News_2022_%28Boxed%29.svg.png" },
  { handle: "CBSNews", name: "CBS News", group: "News", country: "US" },
  { handle: "NBCNews", name: "NBC News NOW", group: "News", country: "US" },
  { handle: "cheddar", name: "Cheddar News", group: "News", country: "US" },
  { handle: "aljazeeraarabic", name: "Al Jazeera Arabic", group: "News", country: "QA" },
  { handle: "abcnews", name: "ABC News Live", group: "News", country: "US" },
  { handle: "FRANCE24English", name: "France 24 English", group: "News", country: "FR" },
  { handle: "dwnews", name: "DW News", group: "News", country: "DE" },
  { handle: "CGTN", name: "CGTN", group: "News", country: "CN" },
  { handle: "trtworld", name: "TRT World", group: "News", country: "TR" },
  { handle: "wion", name: "WION", group: "News", country: "IN" },
  { handle: "ndtv", name: "NDTV 24x7", group: "News", country: "IN" },
  { handle: "abplive", name: "ABP LIVE", group: "News", country: "IN" },
  { handle: "euronews", name: "Euronews", group: "News", country: "FR" },
  { handle: "GlobalNews", name: "Global News", group: "News", country: "CA" },
  { handle: "CTVNews", name: "CTV News", group: "News", country: "CA" },
  { handle: "arirang", name: "Arirang TV", group: "News", country: "KR" },
  { handle: "PBSNewsHour", name: "PBS NewsHour", group: "News", country: "US" },
  { handle: "FoxWeather", name: "FOX Weather", group: "News", country: "US" },
  { handle: "AccuWeather", name: "AccuWeather", group: "News", country: "US" },
  // Space / Science
  { handle: "NASA", name: "NASA TV", group: "Science", country: "US" },
  { handle: "TED", name: "TED", group: "Science", country: "US" },
  { handle: "SpaceX", name: "SpaceX", group: "Science", country: "US" },
  { handle: "NatGeo", name: "National Geographic", group: "Science", country: "US" },
  // Sports
  { handle: "CazeTV", name: "CazéTV (Sports)", group: "Sports", country: "BR" },
  { handle: "LiveModeTV", name: "LiveMode TV", group: "Sports", country: "PT" },
  { handle: "WillowbyCricbuzz", name: "Willow Cricket", group: "Sports", country: "IN" },
  { handle: "AFTV", name: "AFTV (Arsenal)", group: "Sports", country: "GB" },
  { handle: "footballdaily", name: "Football Daily", group: "Sports", country: "GB" },
  { handle: "Copa90", name: "Copa90", group: "Sports", country: "GB" },
  { handle: "SkySportsFootball", name: "Sky Sports Football", group: "Sports", country: "GB" },
  { handle: "Thogden", name: "Thogden", group: "Sports", country: "GB" },
  { handle: "beINSPORTS", name: "beIN SPORTS", group: "Sports", country: "QA" },
  { handle: "espn", name: "ESPN", group: "Sports", country: "US" },
  { handle: "TheFightNetwork", name: "The Fight Network", group: "Sports", country: "CA" },
  // Music
  { handle: "LofiGirl", name: "Lofi Girl", group: "Music", country: "FR" },
  { handle: "nprmusic", name: "NPR Music", group: "Music", country: "US" },
  { handle: "ChilledCow", name: "Chilled Cow", group: "Music", country: "FR" },
  { handle: "TheGoodLifeRadio", name: "The Good Life Radio", group: "Music", country: "US" },
  { handle: "CafeMusicBGMchannel", name: "Cafe Music BGM", group: "Music", country: "JP" },
  { handle: "TrapNation", name: "Trap Nation", group: "Music", country: "US" },
  { handle: "MrSuicideSheep", name: "MrSuicideSheep", group: "Music", country: "US" },
  { handle: "monstercat", name: "Monstercat", group: "Music", country: "CA" },
  // Tech
  { handle: "LinusTechTips", name: "Linus Tech Tips", group: "Tech", country: "CA" },
  { handle: "mkbhd", name: "MKBHD", group: "Tech", country: "US" },
  { handle: "TheVerge", name: "The Verge", group: "Tech", country: "US" },
  { handle: "Bloomberg", name: "Bloomberg Originals", group: "Tech", country: "US" },
  // Kids
  { handle: "CoComelon", name: "CoComelon", group: "Kids", country: "US" },
  { handle: "PinkfongOfficial", name: "Pinkfong Baby Shark", group: "Kids", country: "KR" },
  { handle: "LittleAngel", name: "Little Angel", group: "Kids", country: "US" },
  { handle: "SuperSimpleSongs", name: "Super Simple Songs", group: "Kids", country: "CA" },
  // Entertainment / Fun
  { handle: "AirlineVideosLive", name: "Airline Videos Live", group: "Entertainment", country: "US" },
  { handle: "BigJetTV", name: "Big Jet TV", group: "Entertainment", country: "GB" },
  { handle: "JellesMarbleRuns", name: "Jelle's Marble Runs", group: "Entertainment", country: "NL" },
  { handle: "KittenAcademy", name: "Kitten Academy", group: "Entertainment", country: "US" },
  { handle: "FreiGilson", name: "Frei Gilson", group: "Religious", country: "BR" },
  { handle: "PastorJerryEze", name: "Pastor Jerry Eze", group: "Religious", country: "NG" },
  { handle: "MonterreyAquarium", name: "Monterey Bay Aquarium", group: "Entertainment", country: "US" },
  { handle: "expresstv", name: "Explore Live Cams", group: "Entertainment", country: "US" },
  { handle: "TastyRecipes", name: "Tasty", group: "Lifestyle", country: "US" },
];

export interface YouTubeChannel extends IptvChannel {
  kind: "youtube";
  handle: string;
  embedUrl: string;
}

export const buildYouTubeChannels = (): YouTubeChannel[] =>
  YOUTUBE_LIVE_CHANNELS.map((c) => ({
    kind: "youtube",
    handle: c.handle,
    name: c.name,
    group: c.group,
    country: c.country,
    logo: c.logo,
    // Direct embed URL — always plays the current live stream for the handle.
    url: `https://www.youtube.com/embed/live_stream?channel=${c.handle}&autoplay=1&mute=0`,
    embedUrl: `https://www.youtube.com/embed/live_stream?channel=${c.handle}&autoplay=1&mute=0`,
  }));

export async function resolveYouTubeHls(handle: string): Promise<string | null> {
  try {
    const ref = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${ref}.supabase.co/functions/v1/youtube-live-resolver?handle=${encodeURIComponent(handle)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}
