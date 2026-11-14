# Wish On

**Wish On**은 마음속 소원을 기록하고, 원하는 소원만 다른 사람과 나누며 서로 응원하는 웹 서비스입니다. 소원은 기본적으로 비공개로 저장되고, 공유할 때는 닉네임 공개 여부도 선택할 수 있습니다.

## 주요 기능

- 회원가입, 로그인, 로그아웃 및 마이페이지
- 소원 작성, 수정, 삭제와 달성 상태 기록
- 기본 비공개 저장 및 공유 여부 선택
- 공유 소원의 익명 게시 선택
- 공개 소원 목록과 카테고리별 탐색
- 비공개 소원은 작성자만 조회, 수정, 삭제

## 기술 구성

- 프런트엔드: React, Vite, React Router
- 백엔드: Node.js, Express
- 데이터베이스: MySQL (`mysql2`)
- 인증: bcrypt 비밀번호 해시, JWT HttpOnly 쿠키

## 준비 사항

- Node.js 20.19 이상 또는 22.12 이상
- MySQL Server
- MySQL Workbench (SQL 실행에 편리합니다)

## 설치 및 실행

### 1. 데이터베이스 준비

새로 설치하는 경우 Workbench에서 `database/setup.sql` 전체를 실행하세요. 이 스크립트는 `bucketlist_20603` 데이터베이스와 `users`, `bucketlists` 테이블을 생성합니다.

이미 사용 중인 데이터베이스에 `bucketlists` 테이블이 있다면 `database/migrate_wish_sharing.sql`을 **한 번만** 실행하세요. 기존 소원은 공유 상태로 유지됩니다. 이미 `is_shared`, `is_anonymous` 열이 있다면 마이그레이션을 다시 실행하지 마세요.

### 2. 서버 설정 및 실행

PowerShell 터미널에서 프로젝트 폴더의 `server`로 이동합니다.

```powershell
cd server
npm ci
Copy-Item .env.example .env
```

`server/.env`를 열어 실제 MySQL 접속 정보와 충분히 긴 임의의 `JWT_SECRET`을 입력한 뒤 실행합니다.

```powershell
npm run dev
```

기본 서버 주소는 `http://localhost:5000`입니다.

### 3. 프런트엔드 실행

새 PowerShell 터미널에서 프로젝트 폴더의 `client`로 이동합니다.

```powershell
cd client
npm ci
npm run dev
```

Vite가 출력하는 주소(기본 `http://localhost:5173`)를 브라우저에서 엽니다.

## 데이터베이스 설정

기본 DB 이름은 `bucketlist_20603`이며 서버 환경 변수로 설정할 수 있습니다.

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=본인의_MySQL_비밀번호
DB_NAME=bucketlist_20603
JWT_SECRET=충분히_긴_임의의_문자열
NODE_ENV=development
```

`DB_NAME`을 바꾸면 `database/setup.sql`의 `CREATE DATABASE`와 `USE`, 그리고 마이그레이션 파일의 `USE`에 적힌 이름도 함께 변경하세요. `server/.env`에는 비밀 정보가 있으므로 GitHub에 올리지 마세요. 저장소의 `.gitignore`가 `.env`, `node_modules`, 빌드 결과를 제외합니다.

## API

| 기능 | 메서드 | 경로 | 권한 |
|---|---|---|---|
| 회원가입 | POST | `/api/users/signup` | 공개 |
| 로그인 / 로그아웃 | POST | `/api/users/login`, `/api/users/logout` | 공개 |
| 내 정보 조회 / 수정 / 탈퇴 | GET / PUT / DELETE | `/api/users/me` | 로그인 |
| 공유된 소원 목록 | GET | `/api/bucketlists` | 공개 |
| 내 소원 목록 | GET | `/api/bucketlists/mine` | 로그인 |
| 소원 상세 | GET | `/api/bucketlists/:id` | 공유 소원은 공개, 비공개 소원은 작성자 |
| 소원 작성 | POST | `/api/bucketlists` | 로그인 |
| 소원 수정 / 삭제 | PUT / DELETE | `/api/bucketlists/:id` | 작성자 |

## 유용한 명령

```powershell
# client 폴더에서
npm run lint
npm run build
```

`npm run build`는 `client/dist`를 생성합니다. 이 폴더는 빌드할 때 다시 만들어지므로 Git 저장소에는 포함하지 않습니다.
