const TOKEN_PATH = "/oauth2/tokenP";
const REQUEST_TIMEOUT_MS = 8000;
const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

let tokenCache = null;
let tokenRequest = null;

export class KisError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = "KisError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function getKisConfig() {
  const appKey = process.env.KIS_APP_KEY && process.env.KIS_APP_KEY.trim();
  const appSecret = process.env.KIS_APP_SECRET && process.env.KIS_APP_SECRET.trim();
  const baseUrl = process.env.KIS_BASE_URL && process.env.KIS_BASE_URL.trim();

  if (!appKey || !appSecret || !baseUrl) {
    throw new KisError(
      "KIS 환경변수가 설정되지 않았습니다. KIS_APP_KEY, KIS_APP_SECRET, KIS_BASE_URL을 등록하세요.",
      500,
      "KIS_CONFIGURATION_MISSING"
    );
  }

  let normalizedBaseUrl;
  try {
    normalizedBaseUrl = new URL(baseUrl).toString().replace(/\/$/, "");
  } catch (error) {
    throw new KisError("KIS_BASE_URL 환경변수 형식이 올바르지 않습니다.", 500, "KIS_CONFIGURATION_INVALID");
  }

  return { appKey, appSecret, baseUrl: normalizedBaseUrl };
}

function createTimeoutSignal() {
  const controller = new AbortController();
  const timeout = setTimeout(function () {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  return { signal: controller.signal, clear: function () { clearTimeout(timeout); } };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return {};
  }
}

function mapUpstreamStatus(status) {
  if (status === 401 || status === 403 || status === 429) return status;
  if (status >= 500) return 502;
  return 502;
}

async function requestJson(url, options, operation) {
  const timeout = createTimeoutSignal();
  try {
    const response = await fetch(url, { ...options, signal: timeout.signal });
    const data = await parseResponse(response);
    if (!response.ok) {
      throw new KisError(
        operation + " 요청이 실패했습니다.",
        mapUpstreamStatus(response.status),
        "KIS_UPSTREAM_" + response.status
      );
    }
    return data;
  } catch (error) {
    if (error instanceof KisError) throw error;
    if (error && error.name === "AbortError") {
      throw new KisError("KIS 서버 응답 시간이 초과되었습니다.", 504, "KIS_TIMEOUT");
    }
    throw new KisError("KIS 서버에 연결하지 못했습니다.", 502, "KIS_NETWORK_ERROR");
  } finally {
    timeout.clear();
  }
}

export async function getAccessToken() {
  const config = getKisConfig();
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + TOKEN_REFRESH_MARGIN_MS) {
    return tokenCache.value;
  }
  if (tokenRequest) return tokenRequest;

  tokenRequest = (async function () {
    try {
      const data = await requestJson(
        config.baseUrl + TOKEN_PATH,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: config.appKey,
            appsecret: config.appSecret,
          }),
        },
        "KIS 접근토큰"
      );

      if (!data.access_token) {
        throw new KisError("KIS 접근토큰 응답이 올바르지 않습니다.", 502, "KIS_TOKEN_INVALID");
      }

      const expiresIn = Number(data.expires_in);
      tokenCache = {
        value: data.access_token,
        expiresAt: Date.now() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 23 * 60 * 60 * 1000),
      };
      return tokenCache.value;
    } finally {
      tokenRequest = null;
    }
  })();

  return tokenRequest;
}

export async function kisGet(path, query, headers) {
  const config = getKisConfig();
  const accessToken = await getAccessToken();
  const url = new URL(config.baseUrl + path);
  Object.entries(query || {}).forEach(function ([key, value]) {
    url.searchParams.set(key, value);
  });

  const data = await requestJson(
    url.toString(),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        authorization: "Bearer " + accessToken,
        appkey: config.appKey,
        appsecret: config.appSecret,
        custtype: "P",
        ...(headers || {}),
      },
    },
    "KIS 시세"
  );

  if (data.rt_cd !== undefined && String(data.rt_cd) !== "0") {
    throw new KisError("KIS 시세 응답이 정상 처리되지 않았습니다.", 502, "KIS_RESPONSE_ERROR");
  }
  return data;
}
