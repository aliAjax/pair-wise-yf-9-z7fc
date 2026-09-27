const storageKey = "zfl18-boardgame-rule-cards";
const today = new Date();

function makeComponent(name, expected, substitute = "") {
  return { id: crypto.randomUUID(), name, expected, substitute };
}

function freshCheck() {
  return { status: "idle", entries: {}, startedAt: null };
}

const gaiaComponents = [
  makeComponent("能量标记", 36, "用骰子点数记录"),
  makeComponent("科技板", 10, "拍照记录后共用"),
  makeComponent("联邦标记", 6, "")
];

const defaultState = {
  selectedId: "",
  detailTab: "rules",
  games: [
    {
      id: crypto.randomUUID(),
      name: "奥尔良",
      minPlayers: 2,
      maxPlayers: 4,
      duration: 90,
      complexity: "中",
      lastPlayed: "2025-11-20",
      cover: "",
      forgets: ["商站建造前先确认道路或水路连接", "袋中随从抽完后不是重洗弃堆，而是从已回袋内容继续抽"],
      disputes: ["事件顺序和玩家动作结算先后", "科技板是否能替代所有同类随从"],
      setup: ["按人数放置货物板块", "每位玩家拿起始随从、商人和个人板"],
      scoring: ["货物分数", "商站和市民乘区块", "金币和建筑剩余加分"],
      components: [
        makeComponent("随从圆片", 24, "用同色纽扣代替"),
        makeComponent("商人标记", 5, "用硬币代替"),
        makeComponent("货物板块", 40, "")
      ],
      check: freshCheck(),
      issues: []
    },
    {
      id: crypto.randomUUID(),
      name: "盖亚计划",
      minPlayers: 1,
      maxPlayers: 4,
      duration: 150,
      complexity: "重",
      lastPlayed: "2025-08-02",
      cover: "",
      forgets: ["联邦连接时卫星数量和能量消耗要一起核对", "研究升到顶必须拿对应科技板限制"],
      disputes: ["被动充能是否能拒绝", "星球改造费用受哪些能力影响"],
      setup: ["随机终局计分板和回合得分板", "按种族设置起始资源和母星"],
      scoring: ["终局计分板", "科技轨排名", "联邦和建筑分"],
      components: gaiaComponents,
      check: freshCheck(),
      issues: [
        {
          id: crypto.randomUUID(),
          componentId: gaiaComponents[0].id,
          name: "能量标记",
          expected: 36,
          actual: 33,
          gap: 3,
          substitute: "用骰子点数记录",
          at: "2026-08-15T20:30:00.000Z"
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      name: "花砖物语",
      minPlayers: 2,
      maxPlayers: 4,
      duration: 45,
      complexity: "轻",
      lastPlayed: "2026-03-15",
      cover: "",
      forgets: ["每轮结束先铺墙再补工厂展示区", "地板线扣分后清空对应砖"],
      disputes: ["同色砖放置限制是否看整面墙", "中央区起始玩家标记是否必须拿"],
      setup: ["按人数放工厂圆盘", "每个圆盘补4块砖"],
      scoring: ["横竖相邻即时分", "完整行列和颜色终局加分"],
      components: [
        makeComponent("花砖", 100, "缺的颜色用纸条标记"),
        makeComponent("工厂圆盘", 9, ""),
        makeComponent("起始玩家标记", 1, "用任意小物件代替")
      ],
      check: freshCheck(),
      issues: []
    }
  ]
};

let state = loadState();
if (!state.selectedId) state.selectedId = state.games[0]?.id || "";

const els = {
  searchInput: document.querySelector("#searchInput"),
  playerFilter: document.querySelector("#playerFilter"),
  complexityFilter: document.querySelector("#complexityFilter"),
  sortMode: document.querySelector("#sortMode"),
  gameForm: document.querySelector("#gameForm"),
  nameInput: document.querySelector("#nameInput"),
  minPlayersInput: document.querySelector("#minPlayersInput"),
  maxPlayersInput: document.querySelector("#maxPlayersInput"),
  durationInput: document.querySelector("#durationInput"),
  complexityInput: document.querySelector("#complexityInput"),
  lastPlayedInput: document.querySelector("#lastPlayedInput"),
  coverInput: document.querySelector("#coverInput"),
  gameList: document.querySelector("#gameList"),
  detailView: document.querySelector("#detailView"),
  gameCount: document.querySelector("#gameCount"),
  ruleCount: document.querySelector("#ruleCount"),
  staleGame: document.querySelector("#staleGame"),
  playingCount: document.querySelector("#playingCount"),
  visibleCount: document.querySelector("#visibleCount")
};

function normalizeGame(game) {
  game.components = Array.isArray(game.components) ? game.components : [];
  game.issues = Array.isArray(game.issues) ? game.issues : [];
  const check = game.check && typeof game.check === "object" ? game.check : {};
  game.check = {
    status: check.status === "playing" ? "playing" : "idle",
    entries: check.entries && typeof check.entries === "object" ? check.entries : {},
    startedAt: check.startedAt || null
  };
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  let loaded;
  if (!saved) {
    loaded = structuredClone(defaultState);
  } else {
    try {
      loaded = { ...structuredClone(defaultState), ...JSON.parse(saved) };
    } catch {
      loaded = structuredClone(defaultState);
    }
  }
  loaded.games.forEach(normalizeGame);
  if (loaded.detailTab !== "check") loaded.detailTab = "rules";
  return loaded;
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function daysSince(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return Math.max(0, Math.floor((today - date) / 86400000));
}

function formatTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getAllRules(game) {
  return [...game.forgets, ...game.disputes, ...game.setup, ...game.scoring];
}

function getCheckProgress(game) {
  const total = game.components.length;
  let filled = 0;
  let gaps = 0;
  let unresolved = 0;
  for (const component of game.components) {
    const entry = game.check.entries[component.id];
    if (!entry || !Number.isFinite(entry.actual)) continue;
    filled += 1;
    const gap = component.expected - entry.actual;
    if (gap > 0) {
      gaps += 1;
      if (!entry.substituted) unresolved += 1;
    }
  }
  return { total, filled, gaps, unresolved, ready: total > 0 && filled === total && unresolved === 0 };
}

function getFilteredGames() {
  const keyword = els.searchInput.value.trim();
  const player = els.playerFilter.value;
  const complexity = els.complexityFilter.value;
  const games = state.games.filter((game) => {
    const text = `${game.name}${getAllRules(game).join("")}${game.components.map((item) => item.name).join("")}`;
    const matchesKeyword = !keyword || text.includes(keyword);
    const matchesPlayer = player === "all" || (Number(player) >= game.minPlayers && Number(player) <= game.maxPlayers);
    const matchesComplexity = complexity === "all" || game.complexity === complexity;
    return matchesKeyword && matchesPlayer && matchesComplexity;
  });

  if (els.sortMode.value === "name") return games.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  if (els.sortMode.value === "complexity") {
    const rank = { 轻: 1, 中: 2, 重: 3 };
    return games.sort((a, b) => rank[b.complexity] - rank[a.complexity]);
  }
  return games.sort((a, b) => daysSince(b.lastPlayed) - daysSince(a.lastPlayed));
}

function renderSummary() {
  const allRuleCount = state.games.reduce((sum, game) => sum + getAllRules(game).length, 0);
  const stale = [...state.games].sort((a, b) => daysSince(b.lastPlayed) - daysSince(a.lastPlayed))[0];
  els.gameCount.textContent = state.games.length;
  els.ruleCount.textContent = allRuleCount;
  els.staleGame.textContent = stale ? `${daysSince(stale.lastPlayed)}天` : "-";
  els.playingCount.textContent = state.games.filter((game) => game.check.status === "playing").length;
}

function renderList() {
  const games = getFilteredGames();
  els.visibleCount.textContent = `${games.length}个匹配`;
  els.gameList.innerHTML =
    games
      .map((game) => {
        const selected = game.id === state.selectedId ? "selected" : "";
        return `
          <article class="game-card ${selected}" data-game-id="${game.id}">
            <div class="cover">
              ${
                game.cover
                  ? `<img src="${game.cover}" alt="${escapeHtml(game.name)}封面" />`
                  : `<span>${escapeHtml(game.name.slice(0, 2))}</span>`
              }
              <span class="stale-ribbon">${daysSince(game.lastPlayed)}天未玩</span>
            </div>
            <div class="game-body">
              <h3>${escapeHtml(game.name)}</h3>
              <div class="game-meta">
                <span class="pill">${game.minPlayers}-${game.maxPlayers}人</span>
                <span class="pill">${game.duration}分钟</span>
                <span class="pill heavy">${escapeHtml(game.complexity)}</span>
                ${game.check.status === "playing" ? `<span class="pill playing">对局中</span>` : ""}
              </div>
            </div>
          </article>
        `;
      })
      .join("") || `<p class="empty">没有符合筛选的桌游。</p>`;
}

function renderDetail() {
  const game = state.games.find((item) => item.id === state.selectedId) || state.games[0];
  if (!game) {
    els.detailView.innerHTML = `<p class="empty">先添加一个桌游。</p>`;
    return;
  }
  state.selectedId = game.id;
  const focusCountFor = document.activeElement?.dataset?.countFor || "";
  const tab = state.detailTab === "check" ? "check" : "rules";
  const progress = getCheckProgress(game);
  els.detailView.innerHTML = `
    <div class="quick-card">
      <div class="detail-cover">
        ${game.cover ? `<img src="${game.cover}" alt="${escapeHtml(game.name)}封面" />` : `<span>${escapeHtml(game.name.slice(0, 2))}</span>`}
      </div>
      <div>
        <h2>${escapeHtml(game.name)}</h2>
        <div class="game-meta">
          <span class="pill">${game.minPlayers}-${game.maxPlayers}人</span>
          <span class="pill">${game.duration}分钟</span>
          <span class="pill heavy">${escapeHtml(game.complexity)}</span>
          <span class="pill">${daysSince(game.lastPlayed)}天未玩</span>
        </div>
      </div>
      <div class="tabs">
        <button type="button" data-tab="rules" class="${tab === "rules" ? "active" : ""}">规则卡片</button>
        <button type="button" data-tab="check" class="${tab === "check" ? "active" : ""}">开盒核对${renderCheckBadge(game, progress)}</button>
      </div>
      ${tab === "check" ? renderCheckTab(game, progress) : renderRulesTab(game)}
      <div class="detail-actions">
        <button id="playedTodayBtn" type="button">标记今天玩过</button>
        <button id="deleteGameBtn" type="button">删除桌游</button>
      </div>
    </div>
  `;
  if (focusCountFor) {
    const input = els.detailView.querySelector(`[data-count-for="${focusCountFor}"]`);
    if (input) input.focus({ preventScroll: true });
  }
}

function renderRulesTab(game) {
  return `
    ${renderRuleSection("容易忘的规则", "forgets", game.forgets)}
    ${renderRuleSection("常见争议", "disputes", game.disputes)}
    ${renderRuleSection("开局准备", "setup", game.setup)}
    ${renderRuleSection("计分提醒", "scoring", game.scoring)}
    <form class="add-rule" id="ruleForm">
      <select id="ruleTypeInput">
        <option value="forgets">容易忘的规则</option>
        <option value="disputes">常见争议</option>
        <option value="setup">开局准备</option>
        <option value="scoring">计分提醒</option>
      </select>
      <textarea id="ruleTextInput" rows="3" placeholder="补充一条聚会前要看的提醒" required></textarea>
      <button class="primary" type="submit">加入规则卡片</button>
    </form>
  `;
}

function renderCheckBadge(game, progress) {
  if (game.check.status === "playing") return `<span class="tab-badge playing">对局中</span>`;
  if (progress.unresolved > 0) return `<span class="tab-badge bad">缺${progress.unresolved}</span>`;
  if (progress.ready) return `<span class="tab-badge ok">可开局</span>`;
  return "";
}

function renderCheckTab(game, progress) {
  const playing = game.check.status === "playing";
  return `
    ${renderCheckBanner(game, progress)}
    ${renderComponentRegistry(game)}
    <section class="rule-section">
      <h3>开局前核对</h3>
      ${
        game.components.length
          ? `<ul class="check-list">${game.components.map((component) => renderCheckRow(game, component, playing)).join("")}</ul>`
          : `<p class="hint">登记配件后，在这里逐项填写现场实有数量。</p>`
      }
      ${renderStartArea(game, progress)}
    </section>
    ${playing ? renderIssueForm(game) : ""}
    ${renderIssueHistory(game)}
  `;
}

function renderCheckBanner(game, progress) {
  if (game.check.status === "playing") {
    return `<div class="check-status ok">对局中 · 开始于 ${formatTime(game.check.startedAt)}，开局前核对结果已锁定。</div>`;
  }
  if (progress.total === 0) {
    return `<div class="check-status">先登记配件名称、应有数量和替代办法，再逐项核对。</div>`;
  }
  if (progress.ready) {
    const note = progress.gaps > 0 ? `（其中 ${progress.gaps} 项用替代办法补足）` : "";
    return `<div class="check-status ok">核对完成：${progress.total} 项配件全部到位${note}，可以开局。</div>`;
  }
  const parts = [];
  const unfilled = progress.total - progress.filled;
  if (unfilled > 0) parts.push(`${unfilled} 项未填实有数量`);
  if (progress.unresolved > 0) parts.push(`${progress.unresolved} 项缺口待补足或确认替代`);
  return `<div class="check-status ${progress.unresolved > 0 ? "bad" : "warn"}">核对中（已填 ${progress.filled}/${progress.total}）：${parts.join("，")}。</div>`;
}

function renderComponentRegistry(game) {
  const items = game.components
    .map(
      (component) => `
        <li>
          <span>
            <strong>${escapeHtml(component.name)}</strong> · 应有 ×${component.expected}<br />
            <em class="sub-note">替代：${component.substitute ? escapeHtml(component.substitute) : "未登记"}</em>
          </span>
          <button type="button" title="删除" data-delete-component="${component.id}">×</button>
        </li>`
    )
    .join("");
  return `
    <section class="rule-section">
      <h3>配件登记</h3>
      <ul class="rule-list">${items || `<li><span>暂无配件，先在下方登记。</span></li>`}</ul>
      <form class="component-form" id="componentForm">
        <div class="split">
          <input id="compNameInput" placeholder="配件名称，如：米宝" required />
          <input id="compExpectedInput" type="number" min="1" value="1" title="应有数量" required />
        </div>
        <input id="compSubstituteInput" placeholder="替代办法，如：用硬币代替（可留空）" />
        <button class="primary" type="submit">登记配件</button>
      </form>
    </section>
  `;
}

function renderCheckRow(game, component, playing) {
  const entry = game.check.entries[component.id];
  const filled = Boolean(entry) && Number.isFinite(entry.actual);
  const gap = filled ? component.expected - entry.actual : 0;
  let badge = `<span class="check-badge todo">未填</span>`;
  if (filled && gap <= 0) badge = `<span class="check-badge ok">齐</span>`;
  else if (filled && entry.substituted) badge = `<span class="check-badge warn">替代补足</span>`;
  else if (filled) badge = `<span class="check-badge bad">缺${gap}</span>`;

  let gapLine = "";
  if (filled && gap > 0) {
    if (entry.substituted) {
      gapLine = `
        <div class="gap-line resolved">
          <span>缺 ${gap} 件 · 已采用替代：${escapeHtml(component.substitute)}</span>
          <button type="button" data-toggle-substitute="${component.id}" ${playing ? "disabled" : ""}>取消替代</button>
        </div>`;
    } else {
      gapLine = `
        <div class="gap-line">
          <span>缺 ${gap} 件 · ${component.substitute ? `替代：${escapeHtml(component.substitute)}` : "未登记替代办法"}</span>
          <button type="button" data-toggle-substitute="${component.id}" ${component.substitute && !playing ? "" : "disabled"} title="${component.substitute ? "按登记的替代办法处理缺口" : "先在配件登记中补上替代办法"}">采用替代</button>
        </div>`;
    }
  }

  return `
    <li class="check-row">
      <div class="check-row-main">
        <span class="check-name">${escapeHtml(component.name)} <em class="sub-note">应有 ×${component.expected}</em></span>
        ${badge}
        <input type="number" min="0" placeholder="实有" aria-label="${escapeHtml(component.name)}实有数量" data-count-for="${component.id}" value="${filled ? entry.actual : ""}" ${playing ? "disabled" : ""} />
      </div>
      ${gapLine}
    </li>`;
}

function renderStartArea(game, progress) {
  if (game.check.status === "playing") {
    return `
      <div class="start-area">
        <button id="endGameBtn" type="button">结束本局（收盒）</button>
        <p class="hint">收盒后清空本次核对数量，下次开盒重新核对；缺少记录会保留。</p>
      </div>`;
  }
  let hint = "全部配件到位，可以开局。";
  if (progress.total === 0) hint = "先登记配件，再逐项核对。";
  else if (!progress.ready) {
    const parts = [];
    const unfilled = progress.total - progress.filled;
    if (unfilled > 0) parts.push(`${unfilled} 项未填实有数量`);
    if (progress.unresolved > 0) parts.push(`${progress.unresolved} 项缺口未补足或未确认替代`);
    hint = `开局被挡住：${parts.join("，")}。`;
  }
  return `
    <div class="start-area">
      <button id="startGameBtn" class="primary" type="button" ${progress.ready ? "" : "disabled"}>开局</button>
      <p class="hint">${hint}</p>
    </div>`;
}

function renderIssueForm(game) {
  if (!game.components.length) return "";
  const first = game.components[0];
  const firstEntry = game.check.entries[first.id];
  return `
    <section class="rule-section">
      <h3>对局中补记缺少</h3>
      <form class="component-form" id="issueForm">
        <select id="issueComponentInput">
          ${game.components.map((component) => `<option value="${component.id}">${escapeHtml(component.name)}（应有 ×${component.expected}）</option>`).join("")}
        </select>
        <div class="split">
          <input id="issueActualInput" type="number" min="0" placeholder="现场实有" value="${firstEntry && Number.isFinite(firstEntry.actual) ? firstEntry.actual : ""}" required />
          <input id="issueSubstituteInput" placeholder="本局替代方案" value="${escapeHtml(first.substitute || "")}" />
        </div>
        <button class="primary" type="submit">补记缺少</button>
      </form>
      <p class="hint">补记只追加缺少记录，不影响本局继续。</p>
    </section>`;
}

function renderIssueHistory(game) {
  if (!game.issues.length) return "";
  const items = [...game.issues]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .map(
      (issue) => `
        <li>
          <span>
            <strong>${escapeHtml(issue.name)}</strong> 缺 ${issue.gap} 件（应有 ×${issue.expected}，实有 ×${issue.actual}）<br />
            <em class="sub-note">替代：${issue.substitute ? escapeHtml(issue.substitute) : "未记录"} · ${formatTime(issue.at)}</em>
          </span>
          <button type="button" title="删除" data-delete-issue="${issue.id}">×</button>
        </li>`
    )
    .join("");
  return `
    <section class="rule-section">
      <h3>缺少记录</h3>
      <ul class="rule-list">${items}</ul>
    </section>`;
}

function renderRuleSection(title, key, items) {
  return `
    <section class="rule-section">
      <h3>${title}</h3>
      <ul class="rule-list">
        ${
          items
            .map(
              (item, index) => `
                <li>
                  <span>${escapeHtml(item)}</span>
                  <button type="button" title="删除" data-rule-key="${key}" data-rule-index="${index}">×</button>
                </li>
              `
            )
            .join("") || `<li><span>暂无内容。</span></li>`
        }
      </ul>
    </section>
  `;
}

function renderAll() {
  saveState();
  renderSummary();
  renderList();
  renderDetail();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function addGame(event) {
  event.preventDefault();
  const minPlayers = Number(els.minPlayersInput.value);
  const maxPlayers = Math.max(minPlayers, Number(els.maxPlayersInput.value));
  const cover = await readFileAsDataUrl(els.coverInput.files[0]);
  const game = {
    id: crypto.randomUUID(),
    name: els.nameInput.value.trim(),
    minPlayers,
    maxPlayers,
    duration: Number(els.durationInput.value),
    complexity: els.complexityInput.value,
    lastPlayed: els.lastPlayedInput.value,
    cover,
    forgets: ["本局开始前先补充容易忘的规则。"],
    disputes: [],
    setup: ["整理组件并按人数调整初始设置。"],
    scoring: ["确认终局计分项和即时得分项。"],
    components: [],
    check: freshCheck(),
    issues: []
  };
  state.games.unshift(game);
  state.selectedId = game.id;
  els.gameForm.reset();
  setDefaultDate();
  renderAll();
}

function setDefaultDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 2);
  els.lastPlayedInput.value = date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.searchInput.addEventListener("input", renderAll);
els.playerFilter.addEventListener("change", renderAll);
els.complexityFilter.addEventListener("change", renderAll);
els.sortMode.addEventListener("change", renderAll);
els.gameForm.addEventListener("submit", addGame);

els.gameList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-game-id]");
  if (!card) return;
  state.selectedId = card.dataset.gameId;
  renderAll();
});

els.detailView.addEventListener("submit", (event) => {
  event.preventDefault();
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;

  if (event.target.id === "ruleForm") {
    const key = document.querySelector("#ruleTypeInput").value;
    const text = document.querySelector("#ruleTextInput").value.trim();
    if (!text) return;
    game[key].push(text);
    renderAll();
    return;
  }

  if (event.target.id === "componentForm") {
    const name = document.querySelector("#compNameInput").value.trim();
    const expected = Math.floor(Number(document.querySelector("#compExpectedInput").value));
    const substitute = document.querySelector("#compSubstituteInput").value.trim();
    if (!name || !Number.isFinite(expected) || expected < 1) return;
    game.components.push({ id: crypto.randomUUID(), name, expected, substitute });
    renderAll();
    return;
  }

  if (event.target.id === "issueForm") {
    if (game.check.status !== "playing") return;
    const component = game.components.find((item) => item.id === document.querySelector("#issueComponentInput").value);
    if (!component) return;
    const actualField = document.querySelector("#issueActualInput");
    const actual = Math.floor(Number(actualField.value));
    if (!Number.isFinite(actual) || actual < 0) return;
    const gap = component.expected - actual;
    if (gap <= 0) {
      actualField.setCustomValidity("该配件数量充足，无需补记缺少");
      actualField.reportValidity();
      return;
    }
    game.issues.push({
      id: crypto.randomUUID(),
      componentId: component.id,
      name: component.name,
      expected: component.expected,
      actual,
      gap,
      substitute: document.querySelector("#issueSubstituteInput").value.trim(),
      at: new Date().toISOString()
    });
    renderAll();
  }
});

els.detailView.addEventListener("input", (event) => {
  const field = event.target;
  if (field.id === "issueActualInput") field.setCustomValidity("");
  const componentId = field.dataset?.countFor;
  if (!componentId) return;
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game || game.check.status === "playing") return;
  const raw = field.value.trim();
  if (raw === "") {
    delete game.check.entries[componentId];
  } else {
    const actual = Math.floor(Number(raw));
    if (!Number.isFinite(actual) || actual < 0) return;
    const entry = game.check.entries[componentId] || { actual: 0, substituted: false };
    entry.actual = actual;
    game.check.entries[componentId] = entry;
  }
  renderAll();
});

els.detailView.addEventListener("change", (event) => {
  if (event.target.id !== "issueComponentInput") return;
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;
  const component = game.components.find((item) => item.id === event.target.value);
  if (!component) return;
  const substituteField = document.querySelector("#issueSubstituteInput");
  const actualField = document.querySelector("#issueActualInput");
  if (substituteField) substituteField.value = component.substitute || "";
  const entry = game.check.entries[component.id];
  if (actualField && entry && Number.isFinite(entry.actual)) actualField.value = entry.actual;
});

els.detailView.addEventListener("click", (event) => {
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;

  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    state.detailTab = tabButton.dataset.tab;
    renderAll();
    return;
  }

  const ruleButton = event.target.closest("[data-rule-key]");
  if (ruleButton) {
    const key = ruleButton.dataset.ruleKey;
    const index = Number(ruleButton.dataset.ruleIndex);
    game[key].splice(index, 1);
    renderAll();
    return;
  }

  const componentButton = event.target.closest("[data-delete-component]");
  if (componentButton) {
    const id = componentButton.dataset.deleteComponent;
    game.components = game.components.filter((item) => item.id !== id);
    delete game.check.entries[id];
    renderAll();
    return;
  }

  const substituteButton = event.target.closest("[data-toggle-substitute]");
  if (substituteButton) {
    const entry = game.check.entries[substituteButton.dataset.toggleSubstitute];
    if (entry && game.check.status !== "playing") {
      entry.substituted = !entry.substituted;
      renderAll();
    }
    return;
  }

  if (event.target.closest("#startGameBtn")) {
    if (game.check.status === "playing" || !getCheckProgress(game).ready) return;
    game.check.status = "playing";
    game.check.startedAt = new Date().toISOString();
    renderAll();
    return;
  }

  if (event.target.closest("#endGameBtn")) {
    game.check = freshCheck();
    renderAll();
    return;
  }

  const issueButton = event.target.closest("[data-delete-issue]");
  if (issueButton) {
    game.issues = game.issues.filter((item) => item.id !== issueButton.dataset.deleteIssue);
    renderAll();
    return;
  }

  if (event.target.closest("#playedTodayBtn")) {
    game.lastPlayed = new Date().toISOString().slice(0, 10);
    renderAll();
    return;
  }

  if (event.target.closest("#deleteGameBtn")) {
    state.games = state.games.filter((item) => item.id !== game.id);
    state.selectedId = state.games[0]?.id || "";
    renderAll();
  }
});

setDefaultDate();
renderAll();
