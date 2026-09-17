import { PublicDataError, fetchPublicStockData, normalizePublicStockItem } from "./stock-data.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET 요청만 허용됩니다.", code: "METHOD_NOT_ALLOWED" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      error: "종목코드는 숫자 6자리여야 합니다.",
      code: "INVALID_STOCK_CODE",
    });
  }

  try {
    const rawItems = await fetchPublicStockData({
      code,
      pageNo: 1,
      numOfRows: 10,
    });

    const item = rawItems[0] || null;
    if (!item) {
      return res.status(404).json({
        error: "해당 종목의 최근 거래일 데이터를 찾을 수 없습니다.",
        code: "PUBLIC_DATA_NO_MATCH",
      });
    }

    const normalized = normalizePublicStockItem(item, code);
    return res.status(200).json({
      code: normalized.code || code,
      name: normalized.name,
      price: normalized.price,
      change: normalized.change,
      changeRate: normalized.changeRate,
      open: normalized.open,
      high: normalized.high,
      low: normalized.low,
      volume: normalized.volume,
      tradingValue: normalized.tradingValue,
      tradeDate: normalized.tradeDate,
      updatedAt: normalized.updatedAt,
      isRealtime: false,
      source: "금융위원회 주식시세정보",
    });
  } catch (error) {
    if (error instanceof PublicDataError) {
      return res.status(error.statusCode || 502).json({
        error: "최근 제공 시세를 불러오지 못했습니다.",
        code: error.code || "PUBLIC_DATA_ERROR",
      });
    }

    return res.status(500).json({
      error: "서버 내부 오류가 발생했습니다.",
      code: "STOCK_PRICE_INTERNAL_ERROR",
    });
  }
}
