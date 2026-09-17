# Stock Arena 개발 계획

작성 기준: 2026-09-15
현재 단계: 1단계 프로젝트 분석 및 계획 수립

## 1. 분석 범위

실제 프로젝트 루트와 파일을 확인했다.

```text
index.html
README.md
실습과정_전체.md
api/
  ai.js
assets/
  logo.svg
pages/
  _새페이지_템플릿.html
  board.html
  market.html
  mypage.html
  stock.html
static/
  css/style.css
  js/board.js
  js/common.js
  js/home.js
  js/market.js
  js/mypage.js
  js/stock.js
  js/새페이지.js
.env.local
.gitignore
```

현재 존재하지 않는 파일:

- `pages/arena.html`
- `pages/portfolio.html`
- `pages/ranking.html`
- `api/kis.js`
- `api/stock-price.js`
- `api/stock-history.js`
- `api/stock-rankings.js`
- `api/market-summary.js`
- `api/paper-trade.js`
- `api/portfolio.js`
- `api/leaderboard.js`
- `supabase/stock_arena_schema.sql`

현재 비어 있는 파일:

- `pages/market.html`
- `pages/stock.html`
- `static/js/market.js`
- `static/js/stock.js`

## 2. 현재 구조

### 브라우저 화면

- 모든 HTML은 `/static/css/style.css`를 사용한다.
- 페이지별 JS는 `/static/js/`에 둔다.
- Supabase CDN 스크립트를 HTML에서 먼저 로드한 뒤 `common.js`를 로드한다.
- `/`로 시작하는 절대 경로를 사용하므로 루트와 `pages/`에서 경로가 달라지지 않는다.

### Supabase와 로그인

`static/js/common.js`가 다음을 중앙 관리한다.

- `SUPABASE_URL`, 공개용 `SUPABASE_KEY`
- `db = supabase.createClient(...)`
- `currentUser`
- `pageReady`
- `renderNav()`
- `signUp()`
- `signIn()`
- `signOut()`
- `db.auth.onAuthStateChange(...)`
- `askAI(prompt)`

페이지는 `onAuthReady()`를 전역 함수로 정의하고, 로그인 상태가 정해진 뒤 `common.js`가 호출한다. `body[data-require-auth="true"]` 페이지는 비로그인 상태에서 `/index.html`로 이동한다.

### 게시판

`pages/board.html`과 `static/js/board.js`는 로그인 사용자만 접근하는 기존 게시판이다.

- `content`: 글 입력
- `list`: 글 목록
- `aiBtn`, `aiBox`: AI 문장 다듬기
- `addPost()`, `deletePost()`, `polish()`, `loadPosts()`
- Supabase `posts` 테이블을 직접 사용
- 현재 insert 시 `user_id`를 명시하지 않고 DB 기본값/RLS에 의존한다.

### 마이페이지

`pages/mypage.html`과 `static/js/mypage.js`는 현재 이메일, 본인 글 개수, 본인 글 목록과 삭제만 제공한다.

### AI

`api/ai.js`는 Vercel Serverless Function 형식인 `export default async function handler(req, res)`를 사용한다.

- POST만 허용
- `GROQ_API_TEST` 또는 `GROQ_API_KEY` 환경변수 탐색
- 서버에서 Groq API 호출
- 브라우저의 `askAI()`는 `/api/ai`에 `{ prompt }`만 전송
- Groq 키는 브라우저 코드에 들어 있지 않다.

### 현재 홈

`index.html`은 이전 작업으로 Stock Arena형 대시보드가 들어간 상태다.

- 시장 요약, 상승/하락 목록, 아레나 연출, 빠른 거래 UI를 표시한다.
- `static/js/home.js`는 시뮬레이션, 폭탄 효과, 매수/매도 준비 문구만 처리한다.
- 현재 홈 수치와 종목은 HTML에 하드코딩된 샘플이다.
- 실제 API 연결 전에는 가짜 주가를 표시하지 말라는 새 요구사항과 충돌하므로 다음 홈 단계에서 `-`, 연결 대기, 로딩 상태로 교체해야 한다.
- 현재 홈에는 요구사항에서 보존 대상으로 예시된 `loginBox`, `welcomeBox`, `hello`, `email`, `password`가 존재하지 않는다. 이 ID를 참조하는 현재 소스도 확인되지 않았다. 로그인 UI를 다시 넣을 때는 이 ID를 그대로 사용한다.

## 3. 반드시 유지할 기존 계약

다음 이름과 흐름은 이후 단계에서 유지한다.

- `nav`
- `db`
- `currentUser`
- `pageReady`
- `renderNav()`
- `signUp()`
- `signIn()`
- `signOut()`
- `askAI()`
- `onAuthReady()` 호출 규약
- `api/ai.js`의 Vercel handler 구조와 `process.env` 기반 키 사용
- Supabase CDN 방식
- 순수 HTML/CSS/바닐라 JavaScript 방식
- 기존 `posts` 게시판 기능과 기존 함수 이름
- 기존 Vercel 배포 구조

HTML을 수정하기 전에는 각 ID와 함수의 참조를 먼저 검색한다. 게시판은 `addPost()`, `deletePost()`, `polish()`, `loadPosts()` 구조를 최대한 유지한다.

## 4. 현재 문제와 위험

### 기능/구조

1. `common.js`의 메뉴에는 아직 생성되지 않은 `arena.html`, `portfolio.html`, `ranking.html` 링크가 등록되어 있어 현재 404가 발생한다. 페이지 생성 단계에 맞춰 메뉴를 추가해야 한다.
2. `market.html`, `stock.html` 및 해당 JS는 빈 파일이므로 메뉴가 가리키는 실제 화면이 없다.
3. `static/js/market.js`, `static/js/stock.js`는 빈 파일이다.
4. KIS 서버 API 계층이 전혀 없다. 브라우저에서 KIS를 직접 호출하지 않고, `api/kis.js`를 공통 서버 모듈로 먼저 만들어야 한다.
5. 현재 모의 거래 UI는 실제 주문 저장을 하지 않는다. Supabase 스키마와 서버 검증이 완료되기 전에는 거래 성공으로 표시하지 않는다.
6. Supabase 모의투자 테이블/RLS SQL이 아직 없다.
7. KIS 공식 문서 확인 없이 TR ID, 파라미터, 응답 필드를 추측해 구현하면 안 된다.

### 보안

1. `static/js/board.js`와 `static/js/mypage.js`가 사용자 입력을 `innerHTML`로 출력한다. 게시글 내용과 닉네임에 HTML이 들어가면 XSS 위험이 있으므로 DOM API와 `textContent`로 바꾼다.
2. `static/js/common.js`의 `renderNav()`가 이메일을 문자열 HTML에 직접 삽입한다. 인증 이메일 값을 HTML로 조합하지 않도록 DOM API로 바꾸거나 이스케이프한다.
3. `api/ai.js`가 키의 앞 4글자를 로그에 남긴다. 키 일부도 로그에 남기지 않도록 제거한다.
4. `api/ai.js`가 외부 Groq 오류 원문을 로그로 기록할 수 있으므로, 비밀정보가 포함될 가능성을 낮추고 사용자 응답은 정규화된 메시지만 반환한다.
5. `.env.local`은 `.gitignore`에 포함되어 있으나 실제 값은 읽거나 출력하지 않는다. `KIS_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`는 서버 환경변수로만 사용한다.
6. 현재 `common.js`의 Supabase 키는 Publishable key 용도다. Secret/service-role 키를 브라우저에 넣지 않는다.

## 5. 단계별 개발 순서

현재 단계에서는 계획만 작성한다. 아래 단계는 다음 요청에서 하나씩 진행한다.

### 1단계: 분석 및 계획

완료 산출물:

- `STOCK_ARENA_PLAN.md`
- 기존 파일과 실행 흐름 정리
- 보존 계약과 보안 이슈 목록

### 2단계: 백업 및 디자인 시스템 정리

수정 후보:

- `static/css/style.css`
- 필요 시 `README.md`

작업:

- 현재 CSS 토큰과 페이지 공통 컴포넌트 보존
- 상승/하락 색상 규칙 통일
- 포커스, 오류, 로딩, 빈 상태, reduced-motion 추가
- 기존 레이아웃을 깨뜨리지 않는 범위에서 정리

### 3단계: 홈페이지 정리

수정 후보:

- `index.html`
- `static/js/home.js`
- `static/css/style.css`

작업:

- 로그인/회원가입 UI에 `loginBox`, `welcomeBox`, `hello`, `email`, `password` ID 사용
- API 연결 전 주가는 숫자가 아닌 연결 대기 상태로 표시
- Market Builders 오리지널 캐릭터와 서비스 안내 유지
- 가짜 통계와 가짜 거래 성공 문구 제거

### 4단계: 시장 페이지

생성/수정 후보:

- `pages/market.html`
- `static/js/market.js`
- 이후 실제 API `api/market-summary.js`, `api/stock-rankings.js`

작업:

- 검색, 시장 상태, 기준 시각, 순위 영역
- API별 개별 로딩/빈 상태/오류 처리
- 종목 클릭 시 `/pages/stock.html?code=...`
- API가 준비되기 전에는 가짜 종목을 만들지 않음

### 5단계: KIS 공통 모듈과 현재가 API

생성 후보:

- `api/kis.js`
- `api/stock-price.js`

선행 조건:

- KIS Developers 공식 문서와 공식 `open-trading-api` 저장소 확인
- 운영 URL, 토큰 URL, TR ID, 요청 파라미터, 응답 필드 검증
- 환경변수 등록 안내 작성

검증:

- `GET /api/stock-price?code=005930`
- 잘못된 메서드, 잘못된 종목코드, KIS 오류, timeout 처리
- 브라우저에는 정규화된 필드만 반환

이 API가 성공하기 전에는 순위, 포트폴리오, 게임 연결 단계로 진행하지 않는다.

### 6단계: 순위 API와 시장 화면 연결

생성 후보:

- `api/stock-rankings.js`
- `api/market-summary.js`

작업:

- `rise`, `fall`, `volume`, `value`를 공식 KIS 조건으로 각각 조회
- 최대 10개
- 한 목록 실패가 전체 화면을 중단하지 않게 처리

### 7단계: 종목 상세와 OHLC 차트

생성/수정 후보:

- `pages/stock.html`
- `static/js/stock.js`
- `api/stock-history.js`

작업:

- 실제 현재가와 실제 OHLC만 표시
- 1개월/3개월/6개월/1년
- 가격축과 거래량축 분리
- 차트와 Arena 캐릭터 영역 분리
- CDN 차트 라이브러리가 필요하면 먼저 의존성과 출처를 검토

### 8단계: Supabase 모의투자 스키마

생성 후보:

- `supabase/stock_arena_schema.sql`

작업:

- `profiles`, `holdings`, `trades`, `watchlists`, `leaderboard_snapshots`
- auth.users 외래키와 cascade
- quantity/금액 제약
- 사용자별 RLS
- 랭킹 공개 필드 제한
- 회원가입 후 profile 자동 생성 trigger 또는 안전한 초기화

SQL은 파일만 작성하고 Supabase에 자동 실행했다고 말하지 않는다. 사용자가 SQL Editor에서 직접 실행해야 한다.

### 9단계: 모의 거래

생성 후보:

- `api/paper-trade.js`
- 필요 시 SQL RPC 추가
- `pages/portfolio.html`
- `static/js/portfolio.js`

원칙:

- 실제 KIS 주문 API를 사용하지 않음
- 서버가 현재가를 재조회하고 브라우저 가격을 신뢰하지 않음
- Supabase Auth 토큰으로 사용자 확인
- 원자적 거래와 동시 요청 방지
- 잔액/보유수량/수량 형식 검증
- 수수료 0과 장외 거래 정책을 설정값으로 분리

### 10단계: 포트폴리오 및 랭킹

생성/수정 후보:

- `api/portfolio.js`
- `api/leaderboard.js`
- `pages/ranking.html`
- `static/js/ranking.js`
- `static/js/mypage.js`
- `pages/mypage.html`

작업:

- 현재가는 KIS에서 서버 조회
- 실패 종목은 실패 상태로 표시하고 계산 처리 방식을 알림
- 사용자 이메일을 랭킹에 노출하지 않음
- snapshot 정책으로 반복적인 전체 현재가 조회 방지

### 11단계: Arena

생성/수정 후보:

- `pages/arena.html`
- `static/js/arena.js`
- `static/css/style.css`

작업:

- REST 10~30초 갱신 MVP
- 실제 가격/등락률/거래량만으로 테스트 가능한 시각화
- 호가 데이터가 없으면 세력 게이지를 만들지 않고 연결 대기 표시
- Canvas는 캐릭터/파티클에만 사용하고 금융 수치는 접근 가능한 HTML로 표시
- requestAnimationFrame, 탭 비활성 정지, DPR, reduced-motion, 개수 제한
- 실제 데이터와 게임 승률을 혼동하는 문구 금지

### 12단계: AI 시장 해설

수정 후보:

- `api/ai.js`
- `static/js/common.js`는 기존 `askAI()` 계약을 유지
- `pages/stock.html`, `static/js/stock.js`

작업:

- KIS에서 받은 데이터만 AI 입력으로 전달
- 매수/매도 지시, 미래 가격 단정, 확인되지 않은 원인 생성 금지
- 공개 시장 데이터를 정리한 참고정보라는 고지 표시
- 필요 시 `ai_analyses` 테이블과 RLS를 별도로 설계

### 13단계: 게시판과 전체 점검

수정 후보:

- `pages/board.html`
- `static/js/board.js`
- `pages/mypage.html`
- `static/js/mypage.js`
- `README.md`
- 필요 시 `supabase/stock_arena_schema.sql`

작업:

- 종목코드 필터 및 `posts.stock_code`
- `textContent` 기반 XSS 방지
- 로그인/권한/삭제/RLS 확인
- 반응형, 키보드 포커스, reduced-motion, 로딩/빈/오류 상태
- 존재하지 않는 메뉴 링크 제거 또는 실제 페이지 생성 후 등록

### 14단계: WebSocket 검토

REST MVP가 안정화된 후에만 진행한다.

- KIS 공식 실시간 문서 재확인
- Vercel Serverless Functions가 장시간 WebSocket 중계에 적합한지 검토
- 불안정하면 별도 Node.js 실시간 서버 구조만 제안
- WebSocket 전까지 가짜 틱을 생성하지 않음

## 6. 생성 예정 파일과 용도

| 파일 | 생성 시점 | 역할 |
|---|---:|---|
| `pages/arena.html` | Arena 단계 | 게임형 시장 화면 |
| `pages/portfolio.html` | 모의 거래 단계 | 가상자금/보유종목 |
| `pages/ranking.html` | 랭킹 단계 | 수익률 순위 |
| `static/js/arena.js` | Arena 단계 | Canvas/REST 시각화 |
| `static/js/portfolio.js` | 모의 거래 단계 | 포트폴리오 화면 |
| `static/js/ranking.js` | 랭킹 단계 | 랭킹 화면 |
| `api/kis.js` | 현재가 단계 | 토큰/공통 KIS 요청 |
| `api/stock-price.js` | 현재가 단계 | 현재가 정규화 |
| `api/stock-history.js` | 차트 단계 | OHLC 정규화 |
| `api/stock-rankings.js` | 순위 단계 | 시장 순위 정규화 |
| `api/market-summary.js` | 시장 단계 | 지수/장 상태 |
| `api/paper-trade.js` | 거래 단계 | 서버 검증 모의 거래 |
| `api/portfolio.js` | 포트폴리오 단계 | 자산 계산 |
| `api/leaderboard.js` | 랭킹 단계 | snapshot 기반 랭킹 |
| `supabase/stock_arena_schema.sql` | DB 단계 | 테이블/RLS/trigger |

아직 필요한 단계가 아닌 파일은 빈 파일로 미리 만들지 않는다.

## 7. 백업 권장 목록

현재 작업 전 별도 복사본을 만들 것을 권장하는 파일:

- `index.html`
- `static/css/style.css`
- `static/js/common.js`
- `static/js/home.js`
- `static/js/board.js`
- `static/js/mypage.js`
- `pages/board.html`
- `pages/mypage.html`
- `api/ai.js`
- `.gitignore`

백업은 사용자가 원하는 위치에 직접 복사한다. 자동 백업이나 기존 파일 삭제는 하지 않는다. Git의 현재 커밋/작업 상태도 먼저 확인해야 한다.

## 8. 사용자 준비 사항

현재 단계에서는 실행할 외부 설정이 없다. 다음 단계부터 필요하다.

- KIS Developers 앱 키와 앱 시크릿 발급
- Vercel Environment Variables 등록
  - `KIS_APP_KEY`
  - `KIS_APP_SECRET`
  - `KIS_BASE_URL=https://openapi.koreainvestment.com:9443`
  - 기존 `GROQ_API_KEY`
- 로컬 개발 시 루트 `.env.local`에 저장
- `.env`, `.env.local`, `.env.*.local`이 `.gitignore`에 포함된 상태 유지
- Supabase SQL Editor에서 스키마를 직접 실행

환경변수 실제 값, API 키, 토큰은 로그/문서/브라우저에 기록하지 않는다.

## 9. 1단계 검증 결과

확인한 내용:

- 실제 폴더와 파일 목록 확인
- 로그인, Supabase, `pageReady`, `onAuthReady()`, 게시판, AI 호출 흐름 확인
- 빈 페이지와 없는 서버 API 확인
- 현재 홈의 하드코딩 데이터 확인
- XSS 가능 출력 지점과 AI 키 로그 확인
- `.gitignore`의 환경변수 제외 규칙 확인

이번 단계에서 수정한 파일:

- `STOCK_ARENA_PLAN.md`만 새로 작성했다.
- 기존 HTML, CSS, JavaScript, API, 환경변수 파일은 수정하지 않았다.

다음 단계는 사용자의 확인 후 진행한다. 다음 구현에서는 우선 백업 여부와 디자인 시스템 정리 범위를 확정하고, KIS 현재가 API보다 앞서 필요한 문서 확인 순서를 지킨다.
