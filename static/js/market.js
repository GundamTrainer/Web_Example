const RANKING_TARGETS = {
  rise: "riseRanking",
  fall: "fallRanking",
  volume: "volumeRanking",
  value: "valueRanking",
};

let rankingCache = [];

function onAuthReady() {
  loadMarketSummary();
  loadAllRankings();
  bindSearch();
}

async function loadMarketSummary() {
  const status = document.getElementById("marketStatus");
  const updated = document.getElementById("marketUpdated");
  if (status) status.textContent = "시장 데이터 불러오는 중";
  if (updated) updated.textContent = "기준 시각 확인 중";

  try {
    const response = await fetch("/api/market-summary");
    if (!response.ok) throw new Error("market-summary " + response.status);
    const summary = await response.json();
    renderSummary(summary);
  } catch (error) {
    console.error("시장 요약을 불러오지 못했습니다:", error);
    renderSummaryError();
  }
}

async function loadAllRankings() {
  const results = await Promise.allSettled(
    Object.keys(RANKING_TARGETS).map(function (type) {
      return loadRanking(type);
    })
  );

  results.forEach(function (result, index) {
    if (result.status === "rejected") {
      showError(RANKING_TARGETS[Object.keys(RANKING_TARGETS)[index]], "시장 데이터를 확인하지 못했습니다.");
    }
  });
}

async function loadRanking(type) {
  const targetId = RANKING_TARGETS[type];
  showLoading(targetId);

  try {
    const response = await fetch("/api/stock-rankings?type=" + encodeURIComponent(type));
    if (!response.ok) throw new Error("stock-rankings " + response.status);
    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    rankingCache = rankingCache.concat(items);
    renderRanking(targetId, items);
    return items;
  } catch (error) {
    console.error(type + " 순위를 불러오지 못했습니다:", error);
    showError(targetId, "KIS 시장 데이터 연결 전입니다.");
    throw error;
  }
}

function renderSummary(summary) {
  const marketStatus = document.getElementById("marketStatus");
  const updated = document.getElementById("marketUpdated");
  if (marketStatus) marketStatus.textContent = summary.marketStatus || "시장 상태 확인 필요";
  if (updated) updated.textContent = summary.updatedAt ? "기준 " + summary.updatedAt : "기준 시각 확인 필요";
  renderSummaryValue("kospi", summary.kospi);
  renderSummaryValue("kosdaq", summary.kosdaq);
}

function renderSummaryValue(prefix, item) {
  const value = document.getElementById(prefix + "Value");
  const change = document.getElementById(prefix + "Change");
  if (!item) {
    if (value) value.textContent = "-";
    if (change) change.textContent = "데이터 없음";
    return;
  }
  if (value) value.textContent = item.value == null ? "-" : formatPrice(item.value);
  if (change) change.textContent = item.changeRate == null ? "-" : formatRate(item.changeRate);
}

function renderSummaryError() {
  const status = document.getElementById("marketStatus");
  const updated = document.getElementById("marketUpdated");
  if (status) status.textContent = "시장 데이터 확인 불가";
  if (updated) updated.textContent = "API 연결을 확인하세요";
  ["kospiChange", "kosdaqChange"].forEach(function (id) {
    const element = document.getElementById(id);
    if (element) element.textContent = "데이터 연결 오류";
  });
}

function renderRanking(targetId, items) {
  const target = document.getElementById(targetId);
  if (!target) return;
  if (!items.length) {
    showEmpty(targetId, "표시할 시장 데이터가 없습니다.");
    return;
  }

  target.innerHTML = "";
  items.slice(0, 10).forEach(function (item, index) {
    const link = document.createElement("a");
    link.className = "ranking-item";
    link.href = "/pages/stock.html?code=" + encodeURIComponent(item.code);

    const rank = document.createElement("span");
    rank.className = "ranking-rank";
    rank.textContent = String(item.rank || index + 1).padStart(2, "0");
    const name = document.createElement("strong");
    name.textContent = item.name || "종목명 없음";
    const code = document.createElement("small");
    code.textContent = item.code || "코드 없음";
    const price = document.createElement("span");
    price.textContent = item.price == null ? "-" : formatPrice(item.price);
    const rate = document.createElement("b");
    rate.className = getChangeClass(item.changeRate);
    rate.textContent = item.changeRate == null ? "-" : formatRate(item.changeRate);

    const identity = document.createElement("span");
    identity.className = "ranking-identity";
    identity.append(name, code);
    link.append(rank, identity, price, rate);
    target.appendChild(link);
  });
}

function bindSearch() {
  const input = document.getElementById("stockSearch");
  const status = document.getElementById("searchStatus");
  if (!input) return;
  input.addEventListener("input", function () {
    const keyword = input.value.trim().toLowerCase();
    if (!keyword) {
      status.textContent = "API 연결 후 종목을 검색할 수 있습니다.";
      return;
    }
    const matches = rankingCache.filter(function (item) {
      return String(item.name || "").toLowerCase().includes(keyword) || String(item.code || "").includes(keyword);
    });
    status.textContent = matches.length
      ? matches.length + "개 종목이 현재 화면 데이터에서 검색되었습니다."
      : "검색 결과가 없습니다. 전체 종목 검색은 API 연결 후 제공됩니다.";
  });
}

function formatPrice(value) {
  return Number(value).toLocaleString("ko-KR");
}

function formatVolume(value) {
  return value == null ? "-" : Number(value).toLocaleString("ko-KR");
}

function formatTradingValue(value) {
  return value == null ? "-" : Number(value).toLocaleString("ko-KR");
}

function formatRate(value) {
  const number = Number(value);
  return (number >= 0 ? "+" : "") + number.toFixed(2) + "%";
}

function getChangeClass(rate) {
  if (rate > 0) return "change-up";
  if (rate < 0) return "change-down";
  return "change-flat";
}

function showLoading(targetId) {
  const target = document.getElementById(targetId);
  if (target) {
    target.className = "ranking-state is-loading";
    target.textContent = "시장 데이터 불러오는 중";
  }
}

function showEmpty(targetId, message) {
  const target = document.getElementById(targetId);
  if (target) {
    target.className = "ranking-state is-empty";
    target.textContent = message;
  }
}

function showError(targetId, message) {
  const target = document.getElementById(targetId);
  if (target) {
    target.className = "ranking-state is-error";
    target.textContent = message;
  }
}
