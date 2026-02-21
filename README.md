# Godos

Git 기반 인터랙티브 TUI TodoList CLI.

Todo를 터미널에서 관리하고, 모든 변경사항을 자동으로 git commit하여 히스토리를 추적합니다.

## 설치

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# (선택) 전역 설치
npm link
```

## 사용법

### 인터랙티브 TUI

```bash
godos
# 또는
node dist/cli.js
```

TUI가 실행되면 키보드로 Todo를 관리할 수 있습니다.

### 빠른 추가

```bash
godos add "할 일 제목"
godos add "버그 수정" -P high -p myapp -t bug
godos add "문서 작성" -P low -p docs -t doc -t readme
```

| 옵션 | 축약 | 설명 | 기본값 |
|------|------|------|--------|
| `--priority` | `-P` | 우선순위 (`high`, `medium`, `low`) | `medium` |
| `--project` | `-p` | 프로젝트 이름 | - |
| `--tag` | `-t` | 태그 (여러 개 가능) | - |

### 목록 출력

```bash
godos list
```

```
● Fix login bug (HIGH) [myapp] #bug  2026-02-21
○ Write docs (MED) #doc  2026-02-21
```

| 아이콘 | 상태 |
|--------|------|
| `○` | 대기 (pending) |
| `◐` | 진행 중 (in_progress) |
| `●` | 완료 (done) |

## 키보드 단축키

TUI 메인 화면에서 사용할 수 있는 키:

| 키 | 동작 |
|----|------|
| `↑` `↓` / `j` `k` | 목록 탐색 |
| `Enter` / `Space` | 완료 토글 |
| `a` | Todo 추가 |
| `e` | 선택 항목 수정 |
| `d` | 삭제 (확인 프롬프트) |
| `p` | 우선순위 순환 (low → medium → high) |
| `Tab` | 상태 필터 순환 (all → pending → in_progress → done) |
| `/` | 필터/검색 화면 |
| `?` | 도움말 |
| `Esc` | 필터 초기화 / 뒤로가기 |
| `q` | 종료 |

### 폼 화면 (추가/수정/필터)

| 키 | 동작 |
|----|------|
| `Tab` | 다음 입력 필드로 이동 |
| `Enter` | 다음 필드 / 마지막 필드에서 저장 |
| `←` `→` | 선택형 필드 값 변경 (우선순위, 상태 등) |
| `Ctrl+S` | 즉시 저장 |
| `Esc` | 취소하고 뒤로가기 |

## Git 연동

모든 변경사항은 `.godos/todos.json` 파일에 저장되고, 자동으로 git commit됩니다.

- 커밋 메시지에 `godos:` 접두사가 붙습니다
- 빠른 연속 변경은 500ms 디바운스로 배치 커밋됩니다
- git 저장소가 아닌 경우에도 Todo 관리는 정상 동작합니다

```bash
# godos 커밋만 보기
git log --grep="godos:"

# 예시 출력
# a1b2c3d godos: add "버그 수정"
# d4e5f6g godos: complete "버그 수정"
# h7i8j9k godos: delete "임시 메모"
```

## 데이터 구조

Todo 데이터는 `.godos/todos.json`에 JSON으로 저장됩니다:

```json
{
  "version": 1,
  "todos": [
    {
      "id": "uuid",
      "title": "할 일 제목",
      "description": "상세 설명",
      "status": "pending",
      "priority": "medium",
      "tags": ["tag1", "tag2"],
      "project": "project-name",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## 개발

```bash
npm run build      # TypeScript 컴파일
npm run typecheck   # 타입 체크만 수행
npm run dev        # 워치 모드 컴파일
```

## 기술 스택

- [Ink](https://github.com/vadimdemedes/ink) - React 기반 터미널 UI
- [@inkjs/ui](https://github.com/vadimdemedes/ink-ui) - 터미널 UI 컴포넌트
- [simple-git](https://github.com/steveukx/git-js) - Git 연동
- [Zod](https://github.com/colinhacks/zod) - 런타임 스키마 검증
- [date-fns](https://date-fns.org/) - 날짜 포맷
- [meow](https://github.com/sindresorhus/meow) - CLI 파서

## 라이선스

ISC
