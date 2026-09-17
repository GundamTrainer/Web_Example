function getStockCodeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("code") || "005930";
}

async function loadStockDetails() {
  const code = getStockCodeFromQuery();
  try {
    const response = await fetch("/api/stock-price?code=" + encodeURIComponent(code));
    if (!response.ok) {
      throw new Error("stock-price " + response.status);
    }
    const stock = await response.json();
    renderStockHeader(stock);
    renderPriceDetail(stock);
  } catch (error) {
    console.error("종목 상세를 불러오지 못했습니다:", error);
    const card = document.querySelector("main");
    if (card) {
      card.innerHTML = "<section class='card'><p>최근 거래일 시세를 불러오지 못했습니다.</p><p>공공데이터포털 연결 상태를 확인해 주세요.</p></section>";
    }
  }
}

function renderStockHeader(stock) {
  const title = document.getElementById("stockTitle");
  const price = document.getElementById("stockCurrentPrice");
  const rate = document.getElementById("stockChangeRate");
  const updated = document.getElementById("stockUpdatedAt");

  if (title) title.textContent = stock.name || "종목 정보";
  if (price) price.textContent = stock.price == null ? "-" : Number(stock.price).toLocaleString("ko-KR") + "원";
  if (rate) {
    const value = stock.changeRate == null ? 0 : Number(stock.changeRate);
    rate.textContent = (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
    rate.className = value > 0 ? "up" : value < 0 ? "down" : "flat";
  }
  if (updated) updated.textContent = stock.updatedAt ? "기준: " + stock.updatedAt : "기준 시각 확인 필요";
}

function renderPriceDetail(stock) {
  const fields = [
    ["open", "시가"],
    ["high", "고가"],
    ["low", "저가"],
    ["price", "최근 종가"],
    ["volume", "거래량"],
    ["tradingValue", "거래대금"],
  ];

  fields.forEach(function ([key, label]) {
    const element = document.getElementById("detail-" + key);
    if (!element) return;
    const value = stock[key];
    element.textContent = value == null ? "-" : Number(value).toLocaleString("ko-KR");
  });
}

window.addEventListener("DOMContentLoaded", function () {
  loadStockDetails();
});
