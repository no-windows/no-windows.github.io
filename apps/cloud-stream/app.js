const proxyUrl = "https://cors-anywhere.pulkitpareekofficial.workers.dev/?url=";
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-query");
const searchButton = document.querySelector("#search-button");
const searchStatus = document.querySelector("#search-status");
const resultsList = document.querySelector("#results");

let searchSequence = 0;

function setStatus(message, isError = false) {
  searchStatus.textContent = message;
  searchStatus.dataset.state = isError ? "error" : "info";
}

function renderResults(results) {
  resultsList.replaceChildren();

  for (const result of results) {
    const item = document.createElement("li");
    item.className = "result";

    const title = document.createElement("h2");
    title.textContent = result.l;
    item.append(title);

    const details = document.createElement("p");
    const type = result.qid === "movie" ? "Movie" : "TV";
    details.textContent = [type, result.y].filter(Boolean).join(" · ");
    item.append(details);

    resultsList.append(item);
  }
}

searchForm.addEventListener("submit", async event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  const requestId = ++searchSequence;
  const targetUrl = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(query)}.json`;
  searchButton.disabled = true;
  resultsList.replaceChildren();
  setStatus("Searching…");

  try {
    const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Search service returned HTTP ${response.status}.`);

    const data = await response.json();
    if (!Array.isArray(data.d)) throw new Error("Search service returned an unexpected response.");

    if (requestId !== searchSequence) return;
    const results = data.d.filter(result =>
      result &&
      typeof result.l === "string" &&
      (result.qid === "movie" || result.qid === "tvSeries")
    );
    renderResults(results);
    setStatus(results.length ? `${results.length} results` : "No movie or TV results found.");
  } catch (error) {
    if (requestId === searchSequence) {
      setStatus(error instanceof Error ? `Search failed: ${error.message}` : "Search failed.", true);
    }
  } finally {
    if (requestId === searchSequence) searchButton.disabled = false;
  }
});
