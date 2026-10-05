# chram (True Education)

교사 상담 기록 × 교권침해 분석 Agent 앱 — GitHub Pages 배포용 저장소

## 배포 (최초 1회)
1. 저장소 상단 **Settings** → 좌측 **Pages**
2. **Build and deployment** → Source: `Deploy from a branch` → Branch: `main`, 폴더: `/ (root)` → **Save**
3. 1~3분 후 `https://<계정이름>.github.io/<저장소이름>/` 에서 접속

## 구조
- `index.html`, `assets/`, `chram_logo.png`, `.nojekyll` : 바로 서비스되는 빌드 결과물 (건드리지 마세요)
- `source/` : React + Vite 원본 소스

## 소스를 수정한 뒤 다시 배포하려면
```bash
cd source
npm install
npm run pages     # 빌드 후 결과물을 저장소 루트에 덮어씀
```
그 뒤 변경된 파일을 커밋·푸시하면 Pages가 자동으로 갱신됩니다.

## 참고
- 서버 없이 동작합니다. 모의 상담·시나리오 생성 Agent는 브라우저 안의 규칙 기반 로직으로 실행됩니다.
- 기록·메모는 접속한 브라우저의 localStorage에 저장됩니다(기기·브라우저별로 따로 저장).
- Gemini 연동 서버(`source/server.ts`)는 Pages에서는 사용되지 않습니다. API 키를 프런트 코드에 넣지 마세요.
