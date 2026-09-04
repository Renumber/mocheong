# 모청 (모바일 청첩장)

Vue 3 + Vite + TypeScript + Tailwind CSS 기반 모바일 청첩장.

## 주요 기능

- **카카오톡 공유 카드**: URL 공유 시 OG 메타태그 기반 카드 노출 + 카카오 SDK 공유 버튼 (위치 카드형)
- **카카오 지도**: 예식장 위치 마커 + 카카오맵/네이버지도/티맵 길찾기 버튼
- **실시간 카운트다운**: 예식까지 일/시/분/초 실시간 표시 + 달력 위젯
- 인사말, 갤러리(전체화면 스와이프 뷰어), 계좌번호 복사, 전화/문자 연락처
- **참석 여부**: 이름/측/참석/인원 폼. 목록은 `/admin`에서만 확인
- **방명록**: 청첩장에 메시지 공개
- **게스트 스냅**: 사진은 S3에만 저장. 청첩장에는 갤러리로 보여 주지 않음

## 시작하기

```bash
pnpm install
pnpm dev
```

참석·방명록·스냅을 로컬에서 쓰려면 Amplify 백엔드가 필요합니다.

```bash
pnpm exec ampx sandbox secret set ADMIN_PASSWORD
pnpm sandbox
```

sandbox가 `amplify_outputs.json`을 만들면 Vite가 그걸 읽습니다. 파일이 없으면 폼은 보이고 제출만 막힙니다.

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

## AWS Amplify 배포 (Gen 2 fullstack)

호스팅만 있는 기존 앱이면, 콘솔에서 **Gen 2 백엔드**를 이 저장소의 `amplify/`에 연결해야 `amplify.yml` 백엔드 단계가 통과합니다. 연결 전에 배포하면 `ampx pipeline-deploy`가 실패합니다.

1. 이 저장소를 GitHub에 push
2. [Amplify 콘솔](https://console.aws.amazon.com/amplify) > **새 앱** > GitHub 저장소 연결 (Gen 2 fullstack)
3. 빌드 설정은 저장소의 `amplify.yml`이 적용됨 (백엔드 배포 후 프론트 빌드)
4. **환경 변수**에 `.env`의 모든 `VITE_*` 변수를 등록
   - `.env`는 git에 없으므로, Amplify 콘솔 환경변수가 빌드 시 주입됩니다 (`amplify.yml` 참고)
5. 배포 완료 후:
   - `VITE_SITE_URL`을 실제 Amplify 도메인으로 수정 후 재배포
   - 카카오 개발자 콘솔 플랫폼에 Amplify 도메인 등록

### 관리자 비밀번호

Cognito 계정은 만들지 않습니다. `/admin` 비밀번호는 Amplify **시크릿** `ADMIN_PASSWORD`입니다. 프론트 번들에 안 들어갑니다.

게스트가 로그인 없이 글을 남기고 사진을 올리려면 Amplify Identity Pool이 필요합니다. 콘솔에서 유저를 만들 일은 없습니다.

로컬:

```bash
pnpm exec ampx sandbox secret set ADMIN_PASSWORD
```

배포: Amplify 콘솔 > 해당 브랜치 > **Secret management**에 `ADMIN_PASSWORD` 등록.

그다음 `https://<도메인>/admin`에서 비밀번호만 넣고 들어가면 참석 목록/CSV, 방명록 삭제, 게스트 스냅 다운로드를 쓸 수 있습니다.

### SPA 새로고침 (`/admin`)

Amplify 호스팅 > **Rewrites and redirects**에 아래를 추가합니다. 없으면 `/admin` 직접 진입·새로고침이 404가 납니다.

- Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
- Target: `/index.html`
- Type: `200 (Rewrite)`

### 커스텀 도메인 (선택)

Amplify 콘솔 > 도메인 관리에서 보유 도메인 연결 가능. 연결 후 `VITE_SITE_URL`과 카카오 플랫폼 도메인도 함께 갱신하세요.

### 카카오톡 공유 카드 디버깅

배포 후 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 URL을 넣어 카드 미리보기 확인 및 OG 캐시 초기화 가능.
