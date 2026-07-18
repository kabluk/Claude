#!/usr/bin/env bash
# Runs on every Stop. Checks if a local dev server is up and pages render.
# Exit 2 = rewake Claude with the failure details.
# Exit 0 = all good, stay silent.

PORT=5173
BASE="http://localhost:$PORT"

# Only run if dev server is up
if ! curl -sf --max-time 2 "$BASE" > /dev/null 2>&1; then
  exit 0
fi

FAILED=()

check_page() {
  local url="$1"
  local label="$2"

  body=$(curl -sf --max-time 5 "$url" 2>/dev/null)
  if [ -z "$body" ]; then
    FAILED+=("$label ($url): пустой ответ")
    return
  fi

  # Check that React root got content (not just the empty shell)
  if node -e "
const html = $(echo "$body" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.stringify(d)))");
// Check root div has children rendered (Vite SSR-less: root stays empty until JS runs)
// So instead check HTTP returns 200 and non-trivial HTML size
if (html.length < 200) process.exit(1);
" 2>/dev/null; then
    : # ok
  fi

  # Use Playwright for real render check
  result=$(node -e "
import('/opt/node22/lib/node_modules/playwright/index.mjs').then(async ({ chromium }) => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('$url');
  await page.waitForTimeout(2500);
  const bodyText = await page.evaluate(() => document.body.innerText.trim());
  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  await browser.close();
  const result = {
    hasContent: bodyText.length > 50 || rootHTML.length > 100,
    errors: errors.filter(e => !e.includes('ERR_CONNECTION_RESET') && !e.includes('favicon')),
    bodyLength: bodyText.length
  };
  console.log(JSON.stringify(result));
}).catch(e => { console.log(JSON.stringify({hasContent: false, errors: [e.message], bodyLength: 0})); });
" 2>/dev/null)

  if [ -z "$result" ]; then
    FAILED+=("$label ($url): не удалось запустить Playwright")
    return
  fi

  has_content=$(echo "$result" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).hasContent" 2>/dev/null <<< "$result")
  errors=$(echo "$result" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).errors.join('; ')" 2>/dev/null <<< "$result")

  if [ "$has_content" != "true" ]; then
    FAILED+=("$label ($url): БЕЛЫЙ ЭКРАН — страница не отрендерилась")
  fi
  if [ -n "$errors" ] && [ "$errors" != "" ] && [ "$errors" != "undefined" ]; then
    FAILED+=("$label ($url): ошибки в консоли: $errors")
  fi
}

# Check key pages
check_page "$BASE/" "Landing"
check_page "$BASE/three-rules" "Three Rules"
check_page "$BASE/auth" "Auth"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "=== VERIFY FAILED: найдены проблемы ==="
  for f in "${FAILED[@]}"; do
    echo "  ✗ $f"
  done
  echo ""
  echo "Исправь эти проблемы перед тем как сообщать результат пользователю."
  exit 2
fi

exit 0
