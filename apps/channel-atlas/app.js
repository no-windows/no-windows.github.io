const API_BASE = "https://iptv-org.github.io/api/";
const PAGE_SIZE = 100;

const elements = {
  count: document.querySelector("#channel-count"),
  message: document.querySelector("#message"),
  search: document.querySelector("#search"),
  region: document.querySelector("#region"),
  country: document.querySelector("#country"),
  language: document.querySelector("#language"),
  genre: document.querySelector("#genre"),
  channels: document.querySelector("#channels"),
  loadMore: document.querySelector("#load-more"),
  player: document.querySelector("#player"),
  playerTitle: document.querySelector("#player-title"),
  playerStatus: document.querySelector("#player-status"),
  streamChoice: document.querySelector("#stream-choice"),
  video: document.querySelector("#video"),
  closePlayer: document.querySelector("#close-player")
};

const state = {
  channels: [],
  streams: new Map(),
  countries: new Map(),
  regions: new Map(),
  languages: new Map(),
  categories: new Map(),
  filter: { search: "", region: "", country: "", language: "", genre: "" },
  visibleCount: PAGE_SIZE,
  currentChannel: null,
  hls: null
};

async function fetchJson(name) {
  const response = await fetch(`${API_BASE}${name}.json`);
  if (!response.ok) {
    throw new Error(`Could not load ${name} metadata (HTTP ${response.status}).`);
  }
  return response.json();
}

function option(select, value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  select.append(item);
}

function fillSelect(select, placeholder, values) {
  select.replaceChildren();
  option(select, "", placeholder);
  for (const [value, label] of values) {
    option(select, value, label);
  }
  select.disabled = false;
}

function safeStream(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /\.m3u8$/i.test(url.pathname) ? url.href : null;
  } catch {
    return null;
  }
}

function isOfficialHost(channel, streamUrl) {
  try {
    const website = new URL(channel.website);
    const stream = new URL(streamUrl);
    if (!["https:", "http:"].includes(website.protocol) || stream.protocol !== "https:") return false;
    const officialHost = website.hostname.toLowerCase().replace(/^www\./, "");
    const streamHost = stream.hostname.toLowerCase();
    return streamHost === officialHost || streamHost.endsWith(`.${officialHost}`);
  } catch {
    return false;
  }
}

function displayName(map, code) {
  return map.get(code) || code;
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = text;
  return tag;
}

function channelCard(channel) {
  const card = document.createElement("article");
  card.className = "channel-card";

  const title = document.createElement("div");
  title.className = "channel-title";
  const mark = document.createElement("span");
  mark.className = "channel-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = channel.name.trim().charAt(0).toUpperCase() || "TV";
  const heading = document.createElement("h2");
  heading.textContent = channel.name;
  title.append(mark, heading);
  card.append(title);

  if (channel.network) {
    const network = document.createElement("p");
    network.className = "network";
    network.textContent = channel.network;
    card.append(network);
  }

  const tags = document.createElement("div");
  tags.className = "tags";
  const country = state.countries.get(channel.country);
  if (country) tags.append(createTag(`${country.flag || ""} ${country.name}`.trim()));
  for (const code of channel.languageCodes.slice(0, 3)) {
    tags.append(createTag(displayName(state.languages, code)));
  }
  for (const code of (channel.categories || []).slice(0, 2)) {
    tags.append(createTag(displayName(state.categories, code)));
  }
  card.append(tags);

  const foot = document.createElement("div");
  foot.className = "card-foot";
  const streams = state.streams.get(channel.id) || [];
  if (streams.length) {
    const button = document.createElement("button");
    button.className = "play-button";
    button.type = "button";
    button.textContent = streams.length > 1 ? `Watch in app · ${streams.length}` : "Watch in app";
    button.setAttribute("aria-label", `Watch ${channel.name} in the app`);
    button.addEventListener("click", () => openPlayer(channel));
    foot.append(button);
  } else {
    const unavailable = document.createElement("button");
    unavailable.className = "play-button";
    unavailable.type = "button";
    unavailable.disabled = true;
    unavailable.textContent = "No public HLS stream";
    foot.append(unavailable);
  }
  card.append(foot);
  return card;
}

function matches(channel, query) {
  const { region, country, language, genre } = state.filter;
  const selectedRegion = state.regions.get(region);
  if (selectedRegion && !selectedRegion.countries.includes(channel.country)) return false;
  if (country && channel.country !== country) return false;
  if (language && !channel.languageCodes.includes(language)) return false;
  if (genre && !(channel.categories || []).includes(genre)) return false;
  if (!query) return true;

  const searchable = [
    channel.name,
    channel.network,
    ...(channel.alt_names || []),
    channel.countryName,
    ...channel.languageCodes.map(code => displayName(state.languages, code)),
    ...(channel.categories || []).map(code => displayName(state.categories, code))
  ].join(" ").toLocaleLowerCase();
  return searchable.includes(query);
}

function render() {
  const query = state.filter.search.trim().toLocaleLowerCase();
  const filtered = state.channels.filter(channel => matches(channel, query));
  const shown = filtered.slice(0, state.visibleCount);

  elements.channels.replaceChildren(...shown.map(channelCard));
  elements.count.textContent = `${filtered.length.toLocaleString()} channels`;
  elements.loadMore.hidden = shown.length >= filtered.length;
  elements.message.hidden = filtered.length !== 0;
  if (filtered.length === 0) {
    elements.message.className = "message";
    elements.message.textContent = "No channels match those filters.";
  }
}

function setupFilters() {
  const usedCountries = new Set(state.channels.map(channel => channel.country).filter(Boolean));
  const regionOptions = [...state.regions.entries()]
    .filter(([, region]) => region.countries.some(code => usedCountries.has(code)))
    .map(([code, region]) => [code, region.name])
    .sort((a, b) => a[1].localeCompare(b[1]));
  const countryOptions = [...usedCountries]
    .map(code => [code, state.countries.get(code)])
    .filter(([, country]) => country)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([code, country]) => [code, `${country.flag || ""} ${country.name}`.trim()]);

  const usedLanguages = new Set(state.channels.flatMap(channel => channel.languageCodes));
  const languageOptions = [...usedLanguages]
    .map(code => [code, displayName(state.languages, code)])
    .sort((a, b) => a[1].localeCompare(b[1]));

  const usedGenres = new Set(state.channels.flatMap(channel => channel.categories || []));
  const genreOptions = [...usedGenres]
    .map(code => [code, displayName(state.categories, code)])
    .sort((a, b) => a[1].localeCompare(b[1]));

  fillSelect(elements.region, "All regions", regionOptions);
  fillSelect(elements.country, "All countries and regions", countryOptions);
  fillSelect(elements.language, "All languages", languageOptions);
  fillSelect(elements.genre, "All genres", genreOptions);
}

function showError(error) {
  elements.channels.replaceChildren();
  elements.loadMore.hidden = true;
  elements.count.textContent = "Directory unavailable";
  elements.message.hidden = false;
  elements.message.className = "message error";
  elements.message.replaceChildren();

  const text = document.createElement("p");
  text.textContent = `${error.message} Check your connection and try again.`;
  const retry = document.createElement("button");
  retry.className = "load-more";
  retry.type = "button";
  retry.textContent = "Retry";
  retry.addEventListener("click", loadDirectory, { once: true });
  elements.message.append(text, retry);
}

function stopPlayback() {
  if (state.hls) {
    state.hls.destroy();
    state.hls = null;
  }
  elements.video.pause();
  elements.video.removeAttribute("src");
  elements.video.load();
}

function playbackFailure(details) {
  if (details === "bufferAddCodecError") {
    elements.playerStatus.textContent = "This stream uses a video format this browser cannot decode. Try another stream quality or channel.";
    return;
  }
  elements.playerStatus.textContent = "Playback failed. The stream may be offline, geo-restricted, or block browser playback.";
}

function startPlayback() {
  const playback = elements.video.play();
  if (!playback || typeof playback.then !== "function") return;
  playback.then(() => {
    elements.playerStatus.textContent = `Playing ${state.currentChannel.name}.`;
  }).catch(() => {
    elements.playerStatus.textContent = "Stream ready. Press play to start.";
  });
}

function playStream(stream) {
  stopPlayback();
  const url = safeStream(stream.url);
  if (!url) {
    playbackFailure();
    return;
  }

  elements.playerStatus.textContent = "Connecting to the stream…";
  if (elements.video.canPlayType("application/vnd.apple.mpegurl")) {
    elements.video.src = url;
    startPlayback();
    return;
  }

  if (!window.Hls) {
    elements.playerStatus.textContent = "The HLS playback library could not be loaded.";
    return;
  }
  if (!window.Hls.isSupported()) {
    elements.playerStatus.textContent = "This browser does not support in-app HLS playback.";
    return;
  }

  const hls = new window.Hls();
  state.hls = hls;
  hls.on(window.Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
  hls.on(window.Hls.Events.MANIFEST_PARSED, startPlayback);
  hls.on(window.Hls.Events.ERROR, (_event, data) => {
    if (data.fatal) playbackFailure(data.details);
  });
  hls.attachMedia(elements.video);
}

function openPlayer(channel) {
  const streams = state.streams.get(channel.id) || [];
  if (!streams.length) return;

  state.currentChannel = channel;
  elements.player.hidden = false;
  elements.playerTitle.textContent = channel.name;
  elements.streamChoice.replaceChildren();
  streams.forEach((stream, index) => {
    const label = [stream.quality, stream.title].filter(Boolean).join(" · ") || `Stream ${index + 1}`;
    option(elements.streamChoice, String(index), label);
  });
  elements.streamChoice.disabled = streams.length < 2;
  playStream(streams[0]);
  elements.player.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function loadDirectory() {
  elements.message.hidden = false;
  elements.message.className = "message";
  elements.message.textContent = "Loading channel information…";
  elements.count.textContent = "Loading directory…";

  try {
    const [channels, feeds, streams, countries, regions, languages, categories] = await Promise.all([
      fetchJson("channels"),
      fetchJson("feeds"),
      fetchJson("streams"),
      fetchJson("countries"),
      fetchJson("regions"),
      fetchJson("languages"),
      fetchJson("categories")
    ]);

    state.countries = new Map(countries.map(country => [country.code, country]));
    state.regions = new Map(regions.map(region => [region.code, region]));
    state.languages = new Map(languages.map(language => [language.code, language.name]));
    state.categories = new Map(categories.map(category => [category.id, category.name]));

    const languageCodes = new Map();
    for (const feed of feeds) {
      if (!feed.channel || !feed.languages) continue;
      const current = languageCodes.get(feed.channel) || new Set();
      for (const code of feed.languages) current.add(code);
      languageCodes.set(feed.channel, current);
    }

    const today = new Date().toISOString().slice(0, 10);
    const activeChannels = channels
      .filter(channel => !channel.is_nsfw && !(channel.categories || []).includes("xxx") && (!channel.closed || channel.closed >= today))
      .map(channel => {
        const country = state.countries.get(channel.country);
        return {
          ...channel,
          countryName: country ? country.name : "",
          languageCodes: [...(languageCodes.get(channel.id) || [])]
        };
      });

    const activeById = new Map(activeChannels.map(channel => [channel.id, channel]));
    const streamsByChannel = new Map();
    for (const stream of streams) {
      const channel = activeById.get(stream.channel);
      if (!channel || (stream.labels || []).includes("Geo-blocked")) continue;
      if (stream.referrer || stream.user_agent) continue;
      const url = safeStream(stream.url);
      if (!url || !isOfficialHost(channel, url)) continue;
      const current = streamsByChannel.get(stream.channel) || [];
      if (current.some(item => item.url === url)) continue;
      current.push({ ...stream, url });
      streamsByChannel.set(stream.channel, current);
    }

    for (const channelStreams of streamsByChannel.values()) {
      channelStreams.sort((a, b) => {
        const height = quality => Number.parseInt(String(quality || "").match(/\d+/)?.[0] || "0", 10);
        return height(b.quality) - height(a.quality);
      });
    }
    state.streams = streamsByChannel;
    state.channels = activeChannels.sort((a, b) => a.name.localeCompare(b.name));

    state.visibleCount = PAGE_SIZE;
    setupFilters();
    elements.message.hidden = true;
    render();
  } catch (error) {
    showError(error instanceof Error ? error : new Error("An unexpected error occurred."));
  }
}

elements.streamChoice.addEventListener("change", () => {
  if (!state.currentChannel) return;
  const streams = state.streams.get(state.currentChannel.id) || [];
  const stream = streams[Number(elements.streamChoice.value)];
  if (stream) playStream(stream);
});

elements.closePlayer.addEventListener("click", () => {
  stopPlayback();
  state.currentChannel = null;
  elements.player.hidden = true;
});

for (const [key, element] of [
  ["region", elements.region],
  ["country", elements.country],
  ["language", elements.language],
  ["genre", elements.genre]
]) {
  element.addEventListener("change", () => {
    state.filter[key] = element.value;
    state.visibleCount = PAGE_SIZE;
    render();
  });
}

elements.search.addEventListener("input", () => {
  state.filter.search = elements.search.value;
  state.visibleCount = PAGE_SIZE;
  render();
});

elements.loadMore.addEventListener("click", () => {
  state.visibleCount += PAGE_SIZE;
  render();
});

loadDirectory();
