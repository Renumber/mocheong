# 모청 (모바일 청첩장)

Vue 3 + Vite + TypeScript + Tailwind CSS 기반 모바일 청첩장.

## 주요 기능

- **카카오톡 공유 카드**: URL 공유 시 OG 메타태그 기반 카드 노출 + 카카오 SDK 공유 버튼 (위치 카드형)
- **카카오 지도**: 예식장 위치 마커 + 카카오맵/네이버지도/티맵 길찾기 버튼
- **실시간 카운트다운**: 예식까지 일/시/분/초 실시간 표시 + 달력 위젯
- 인사말, 갤러리(전체화면 스와이프 뷰어), 계좌번호 복사, 전화/문자 연락처
- **게스트 스냅**: 청첩장 맨 아래 섹션에서 사진 업로드 → S3 저장. 신랑신부는 `/guest-snap/album`에서 로그인 없이 조회

## 시작하기

```bash
npm install
npm run dev
```

## 개인정보 설정 (.env)

모든 개인정보(이름, 연락처, 계좌, 예식장 정보 등)는 `.env` 파일로 관리합니다.
`.env.example`을 복사해서 본인 정보로 수정하세요.

```bash
cp .env.example .env
```

- `.env`는 git에 커밋되지 않습니다 (`.gitignore` 처리됨).
- 인사말(`VITE_GREETING_MESSAGE`)은 `\n`으로 줄바꿈합니다.
- 계좌는 `은행|계좌번호|예금주` 형식이며, 비워두면 해당 항목이 표시되지 않습니다.

## 카카오 키 발급 (지도 + 공유 필수)

1. [Kakao Developers](https://developers.kakao.com)에서 애플리케이션 생성
2. **앱 설정 > 앱 키**에서 **JavaScript 키** 복사 → `.env`의 `VITE_KAKAO_JS_KEY`에 입력
3. **앱 설정 > 플랫폼 > Web**에 사이트 도메인 등록
   - 로컬 개발: `http://localhost:5173`
   - 배포 후: Amplify 도메인 (예: `https://main.xxxx.amplifyapp.com`)
4. **제품 설정 > 카카오맵** 활성화

## AWS Amplify 배포

1. 이 저장소를 GitHub에 push
2. [Amplify 콘솔](https://console.aws.amazon.com/amplify) > **새 앱 호스팅** > GitHub 저장소 연결
3. 빌드 설정은 저장소의 `amplify.yml`이 자동 적용됨
4. **환경 변수**에 `.env`의 모든 `VITE_*` 변수를 등록
   - `.env`는 git에 없으므로, Amplify 콘솔 환경변수가 빌드 시 주입됩니다 (`amplify.yml` 참고)
5. 배포 완료 후:
   - `VITE_SITE_URL`을 실제 Amplify 도메인으로 수정 후 재배포
   - 카카오 개발자 콘솔 플랫폼에 Amplify 도메인 등록

### 커스텀 도메인 (선택)

Amplify 콘솔 > 도메인 관리에서 보유 도메인 연결 가능. 연결 후 `VITE_SITE_URL`과 카카오 플랫폼 도메인도 함께 갱신하세요.

### SPA 새로고침 (필수)

`/guest-snap` 같은 경로에서 새로고침이 404가 나면 Amplify 콘솔 **Rewrites and redirects**에 아래 규칙을 추가하세요.

| Source | Target | Type |
| --- | --- | --- |
| `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)/>` | `/index.html` | `200 (Rewrite)` |

빌드 산출물에 `guest-snap/index.html`, `guest-snap/album/index.html` 복사본도 넣으므로, 콘솔 rewrite 전에도 두 경로는 직접 진입 가능합니다.

### 카카오톡 공유 카드 디버깅

배포 후 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 URL을 넣어 카드 미리보기 확인 및 OG 캐시 초기화 가능.

## 게스트 스냅 (S3 + Lambda)

청첩장 맨 아래 **Guest Snap** 섹션에서 손님이 사진을 올립니다. `/guest-snap` 은 `#guest-snap` 으로 이동합니다. 조회는 `https://<도메인>/guest-snap/album` — URL을 아는 사람은 인증 없이 사진을 볼 수 있습니다.

### 1. S3 버킷

1. 버킷 생성 (리전: `ap-northeast-2` 권장). **Block all public access** 유지.
2. **Permissions > CORS** 에 사이트 도메인만 허용:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://<Amplify-도메인>"
    ],
    "ExposeHeaders": ["ETag", "Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2. Lambda

소스는 [`functions/guest-snap/index.mjs`](functions/guest-snap/index.mjs).

```bash
cd functions/guest-snap
pnpm install --prod
zip -r function.zip index.mjs node_modules package.json
```

1. Lambda 생성: Runtime **Node.js 20.x**, handler `index.handler`
2. zip 업로드
3. 환경 변수
   - `BUCKET_NAME` — 버킷 이름
   - `ALLOWED_ORIGINS` — 쉼표 구분. 예: `http://localhost:5173,https://<Amplify-도메인>`
   - (선택) `PREFIX` 기본값 `guest-snaps`, `MAX_BYTES` 기본값 `15728640`
4. **Function URL**: Auth `NONE`. CORS에서 동일 origin 허용 (`GET`, `POST`, header `content-type`)
5. IAM 역할에 해당 prefix만 허용:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/guest-snaps/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>",
      "Condition": {
        "StringLike": { "s3:prefix": ["guest-snaps/*"] }
      }
    }
  ]
}
```

API:

- `POST /presign` `{ "contentType": "image/jpeg", "contentLength": 12345 }` → `{ url, key, headers }`
- `GET /list?limit=60&cursor=` → `{ items, nextToken }`

허용 MIME: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`. 키 형식: `guest-snaps/{yyyy-mm-dd}/{uuid}.{ext}` (날짜는 KST).

### 3. Amplify 환경변수

`VITE_GUEST_SNAP_API_URL` = Function URL (끝 슬래시 없이). 등록 후 재배포.

비워두면 로컬에서 청첩장은 그대로 되고, 업로드/앨범 페이지만 미연결 안내를 보여줍니다.
