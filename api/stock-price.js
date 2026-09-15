import { KisError, kisGet } from "./kis.js";

const CURRENT_PRICE_PATH = "/uapi/domestic-stock/v1/quotations/inquire-price";
const CURRENT_PRICE_TR_ID = "FHKST01010100";

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function toText(value) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function normalizeCurrentPrice(code, output) {
  return {
    code: code,
    name: toText(output.hts_kor_isnm || output.stck_kor_isnm || output.rprs_mrkt_kor_name),
    price: toNumber(output.stck_prpr),
    change: toNumber(output.prdy_vrss),
    changeRate: toNumber(output.prdy_ctrt),
    open: toNumber(output.stck_oprc),
    high: toNumber(output.stck_hgpr),
    low: toNumber(output.stck_lwpr),
    volume: toNumber(output.acml_vol),
    tradingValue: toNumber(output.acml_tr_pbmn),
    marketStatus: toText(output.iscd_stat_cls_code),
    updatedAt: toText(output.stck_cntg_hour),
  };
}

function sendError(res, error) {
  if (error instanceof KisError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }
  console.error("현재가 API 내부 오류:", error && error.name ? error.name : "unknown");
  return res.status(500).json({
    error: "현재가를 처리하는 중 서버 오류가 발생했습니다.",
    code: "STOCK_PRICE_INTERNAL_ERROR",
  });
}

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
    const data = await kisGet(
      CURRENT_PRICE_PATH,
      {
        FID_COND_MRKT_DIV_CODE: "J",
        FID_INPUT_ISCD: code,
      },
      { tr_id: CURRENT_PRICE_TR_ID }
    );
    const output = data.output1;
    if (!output || typeof output !== "object") {
      throw new KisError("KIS 현재가 응답 데이터가 없습니다.", 502, "KIS_PRICE_DATA_MISSING");
    }
    return res.status(200).json(normalizeCurrentPrice(code, output));
  } catch (error) {
    return sendError(res, error);
  }
}
