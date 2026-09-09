#!/bin/bash
# TDD Guard Hook — PreToolUse[apply_patch]
# 구현 코드를 작성하려 할 때, 해당 모듈의 테스트 파일이 먼저 존재하는지 체크.
# 테스트 없이 구현 코드를 작성하려 하면 차단.
#
# Codex의 apply_patch는 tool_input.file_path가 없고 patch envelope 한 덩어리로 온다.
# `*** Add File:` / `*** Update File:` / `*** Move to:` 에서 대상 경로를 뽑아 검사한다.
# (`*** Delete File:` 은 테스트가 필요 없으므로 뽑지 않는다.)

INPUT=$(cat)
PATCH=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# patch envelope이 아니면 통과
if [ -z "$PATCH" ]; then
  exit 0
fi

FILE_PATHS=$(printf '%s\n' "$PATCH" | sed -n -E 's/^\*\*\* (Add File|Update File|Move to): (.*)$/\2/p')

if [ -z "$FILE_PATHS" ]; then
  exit 0
fi

# apply_patch 경로는 워크스페이스 루트 기준 상대경로다. 절대경로로 정규화한다.
BASE=$(echo "$INPUT" | jq -r '.cwd // empty')
if [ -z "$BASE" ]; then
  BASE=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
fi

# 테스트 파일이 먼저 있어야 하는 경로인가?
requires_test() {
  # 테스트 파일 자체를 수정하는 건 허용
  case "$1" in
    *test*|*spec*|*.test.*|*.spec.*|*__tests__*)
      return 1
      ;;
  esac

  # 설정/타입/스타일 파일은 테스트 불필요 — 허용
  case "$1" in
    *.json|*.css|*.scss|*.md|*.yml|*.yaml|*.env*|*.config.*|*tailwind*|*postcss*|*next.config*|*tsconfig*)
      return 1
      ;;
  esac

  # types/ 폴더는 테스트 불필요 — 허용
  case "$1" in
    */types/*|*/types.ts|*/types.d.ts)
      return 1
      ;;
  esac

  # Next.js 프레임워크 파일은 허용 (layout, page, loading, error, not-found, global styles)
  case "$1" in
    */layout.tsx|*/layout.ts|*/page.tsx|*/page.ts|*/loading.tsx|*/error.tsx|*/not-found.tsx|*/globals.css)
      return 1
      ;;
  esac

  # lib/ 또는 소스 파일이면 테스트 파일 존재 여부 확인
  case "$1" in
    *.ts|*.tsx|*.js|*.jsx)
      return 0
      ;;
  esac

  return 1
}

# 테스트 파일 후보 경로들을 뒤진다.
has_test() {
  local abs="$1"
  local dir base parent ext
  dir=$(dirname "$abs")
  base=$(basename "$abs" | sed -E 's/\.(ts|tsx|js|jsx)$//')

  # 같은 폴더에 .test 파일
  for ext in ts tsx js jsx; do
    if [ -f "${dir}/${base}.test.${ext}" ] || [ -f "${dir}/${base}.spec.${ext}" ]; then
      return 0
    fi
  done

  # __tests__ 폴더
  parent=$(dirname "$dir")
  for ext in ts tsx js jsx; do
    if [ -f "${parent}/__tests__/${base}.test.${ext}" ] || [ -f "${dir}/__tests__/${base}.test.${ext}" ]; then
      return 0
    fi
  done

  # src/__tests__/ 루트 테스트 폴더
  for ext in ts tsx js jsx; do
    if [ -f "${BASE}/src/__tests__/${base}.test.${ext}" ]; then
      return 0
    fi
  done

  return 1
}

MISSING=""
while IFS= read -r FILE_PATH; do
  [ -z "$FILE_PATH" ] && continue

  case "$FILE_PATH" in
    /*) ABS="$FILE_PATH" ;;
    *)  ABS="${BASE}/${FILE_PATH}" ;;
  esac

  requires_test "$ABS" || continue
  has_test "$ABS" && continue

  BASENAME=$(basename "$ABS" | sed -E 's/\.(ts|tsx|js|jsx)$//')
  MISSING="${MISSING}${MISSING:+, }${BASENAME}"
done <<< "$FILE_PATHS"

if [ -n "$MISSING" ]; then
  FIRST=${MISSING%%,*}
  cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "TDD GUARD: '${MISSING}'에 대한 테스트 파일이 존재하지 않습니다. 구현 코드를 작성하기 전에 테스트를 먼저 작성하세요. (테스트 파일 예: ${FIRST}.test.ts)"
  }
}
EOF
fi

exit 0
