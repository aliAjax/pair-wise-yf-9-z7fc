const storageKey = "zfl18-boardgame-rule-cards";
const today = new Date();

function freshCheck() {
  return { counts: {}, subs: {}, started: false, startedAt: "", adjustments: [] };
}

const defaultState = {
  selectedId: "",
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
        { id: crypto.randomUUID(), name: "随从木块", expected: 30, substitute: "用彩色骰子代替，按颜色对应职业" },
        { id: crypto.randomUUID(), name: "货物板块", expected: 25, substitute: "用硬币代替，计分时按货物种类折算" },
        { id: crypto.randomUUID(), name: "商人指示物", expected: 5, substitute: "用任意小摆件代替" }
      ],
      check: freshCheck()
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
      components: [
        { id: crypto.randomUUID(), name: "能量标记", expected: 30, substitute: "用玻璃珠或硬币代替" },
        { id: crypto.randomUUID(), name: "科技板", expected: 18, substitute: "拍照记录科技效果，用纸条代替" },
        { id: crypto.randomUUID(), name: "联邦标记", expected: 12, substitute: "用扑克筹码代替" }
      ],
      check: freshCheck()
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
        { id: crypto.randomUUID(), name: "花砖", expected: 100, substitute: "缺的颜色用纸片标记，补砖照常抽取" },
        { id: crypto.randomUUID(), name: "工厂圆盘", expected: 9, substitute: "用杯垫或纸盘代替" },
        { id: crypto.randomUUID(), name: "起始玩家标记", expected: 1, substitute: "用任意小摆件代替" }
      ],
      check: freshCheck()
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
  visibleCount: document.querySelector("#visibleCount")
};

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
  loaded.games = (Array.isArray(loaded.games) ? loaded.games : []).map(normalizeGame);
  return loaded;
}

function normalizeGame(game) {
  game.components = (Array.isArray(game.components) ? game.components : []).map((comp) => ({
    id: comp.id || crypto.randomUUID(),
    name: String(comp.name || "未命名配件"),
    expected: Math.max(1, Number(comp.expected) || 1),
    substitute: String(comp.substitute || "")
  }));
  const check = game.check && typeof game.check === "object" ? game.check : {};
  game.check = {
    counts: check.counts && typeof check.counts === "object" ? check.counts : {},
    subs: check.subs && typeof check.subs === "object" ? check.subs : {},
    started: Boolean(check.started),
    startedAt: check.startedAt || "",
    adjustments: Array.isArray(check.adjustments) ? check.adjustments : []
  };
  return game;
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
  if (!isoString || Number.isNaN(date.getTime())) return "时间未知";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
}

function getAllRules(game) {
  return [...game.forgets, ...game.disputes, ...game.setup, ...game.scoring];
}

function checkItemState(game, comp) {
  const raw = game.check.counts[comp.id];
  const counted = raw !== undefined && raw !== "" && !Number.isNaN(Number(raw));
  const actual = counted ? Number(raw) : 0;
  const shortage = counted ? Math.max(0, comp.expected - actual) : 0;
  const sub = String(game.check.subs[comp.id] || "").trim();
  const resolved = counted && (shortage === 0 || sub !== "");
  return { counted, actual, shortage, sub, resolved };
}

function getCheckProgress(game) {
  const items = game.components.map((comp) => checkItemState(game, comp));
  const checked = items.filter((item) => item.counted).length;
  const unresolvedCount = items.filter((item) => item.counted && !item.resolved).length;
  return {
    total: items.length,
    checked,
    unresolvedCount,
    canStart: items.length > 0 && checked === items.length && unresolvedCount === 0
  };
}

function checkProgressHtml(progress) {
  const shortage = progress.unresolvedCount ? ` · <strong>${progress.unresolvedCount} 项有缺口</strong>` : "";
  return `已核对 ${progress.checked}/${progress.total}${shortage}`;
}

function checkBlockReasons(game, progress) {
  const reasons = [];
  if (!game.components.length) reasons.push("先登记配件清单");
  if (progress.checked < progress.total) reasons.push(`还有 ${progress.total - progress.checked} 项未填实有数量`);
  if (progress.unresolvedCount) reasons.push(`${progress.unresolvedCount} 项缺口待补足或确认替代办法`);
  return reasons;
}

function checkBadgeView(item) {
  if (!item.counted) return ["badge pending", "未核对"];
  if (item.shortage === 0) return ["badge ok", "齐全"];
  if (item.resolved) return ["badge ok", `缺 ${item.shortage} · 替代顶上`];
  return ["badge short", `缺 ${item.shortage}`];
}

function checkBadgeHtml(item, compId) {
  const [className, text] = checkBadgeView(item);
  return `<span class="${className}" data-badge-for="${compId}">${text}</span>`;
}

function renderCheckBadge(game) {
  if (!game.components.length) return "";
  if (game.check.started) return `<span class="pill check-open">已开局</span>`;
  const progress = getCheckProgress(game);
  if (progress.canStart) return `<span class="pill check-ready">可开局</span>`;
  if (progress.unresolvedCount) return `<span class="pill check-short">缺 ${progress.unresolvedCount} 项</span>`;
  return `<span class="pill check-doing">核对 ${progress.checked}/${progress.total}</span>`;
}

function getFilteredGames() {
  const keyword = els.searchInput.value.trim();
  const player = els.playerFilter.value;
  const complexity = els.complexityFilter.value;
  const games = state.games.filter((game) => {
    const text = `${game.name}${getAllRules(game).join("")}`;
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
                ${renderCheckBadge(game)}
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
      ${renderCheckSection(game)}
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
      <div class="detail-actions">
        <button id="playedTodayBtn" type="button">标记今天玩过</button>
        <button id="deleteGameBtn" type="button">删除桌游</button>
      </div>
    </div>
  `;
}

function renderCheckSection(game) {
  const componentItems = game.components
    .map(
      (comp) => `
        <li>
          <span><strong>${escapeHtml(comp.name)}</strong> · 应有 ${comp.expected} 件
            ${comp.substitute ? `<br><em>替代：${escapeHtml(comp.substitute)}</em>` : `<br><em>未登记替代办法</em>`}
          </span>
          <button type="button" title="删除配件" data-component-delete="${comp.id}">×</button>
        </li>
      `
    )
    .join("");

  return `
    <section class="rule-section check-section">
      <h3>开盒核对 · 配件清单</h3>
      <ul class="rule-list component-list">
        ${componentItems || `<li><span>还没有登记配件，先把这款游戏的配件逐项加进来。</span></li>`}
      </ul>
      <form class="add-rule" id="componentForm">
        <input id="componentNameInput" placeholder="配件名称，如：工人米宝" required />
        <div class="split">
          <label>
            应有数量
            <input id="componentExpectedInput" type="number" min="1" step="1" value="1" required />
          </label>
          <label>
            替代办法
            <input id="componentSubstituteInput" placeholder="缺件时怎么凑" />
          </label>
        </div>
        <button class="primary" type="submit">登记配件</button>
      </form>
    </section>
    <section class="rule-section check-section">
      <h3>开局前核对</h3>
      ${renderPreCheck(game)}
    </section>
    ${game.check.started ? renderAdjustSection(game) : ""}
  `;
}

function renderPreCheck(game) {
  if (!game.components.length) {
    return `<p class="empty">登记配件后，开局前在这里逐项填写现场实有数量。</p>`;
  }
  const check = game.check;
  const progress = getCheckProgress(game);
  const locked = check.started;
  const rows = game.components
    .map((comp) => {
      const item = checkItemState(game, comp);
      return `
        <li class="check-row" data-check-row="${comp.id}">
          <div class="check-line">
            <span class="check-name">${escapeHtml(comp.name)}<small>应有 ${comp.expected} 件</small></span>
            <input type="number" min="0" step="1" placeholder="实有" value="${item.counted ? item.actual : ""}" data-count-for="${comp.id}" ${locked ? "disabled" : ""} />
            ${checkBadgeHtml(item, comp.id)}
          </div>
          <div class="check-sub" data-subrow-for="${comp.id}" ${item.counted && item.shortage > 0 ? "" : "hidden"}>
            <input type="text" placeholder="确认替代办法后放行" value="${escapeHtml(check.subs[comp.id] || "")}" data-sub-for="${comp.id}" ${locked ? "disabled" : ""} />
            ${comp.substitute && !locked ? `<button type="button" data-use-sub-for="${comp.id}" title="${escapeHtml(comp.substitute)}">用登记替代</button>` : ""}
          </div>
        </li>
      `;
    })
    .join("");
  const reasons = checkBlockReasons(game, progress);
  return `
    <p class="check-progress">${checkProgressHtml(progress)}</p>
    <ul class="check-list">${rows}</ul>
    ${
      locked
        ? `<p class="started-note">✓ 已于 ${formatTime(check.startedAt)} 开局。之后再发现缺件，请在下方“局中补记”登记，不影响本局。</p>`
        : `<button class="primary" id="startGameBtn" type="button" ${progress.canStart ? "" : "disabled"}>开始开局</button>
           <p class="block-reason" ${progress.canStart ? "hidden" : ""}>${reasons.join("；")}</p>`
    }
    <button id="resetCheckBtn" type="button">重新核对（清空本次填写）</button>
  `;
}

function renderAdjustSection(game) {
  const options = game.components
    .map((comp) => `<option value="${comp.id}">${escapeHtml(comp.name)}（应有 ${comp.expected}）</option>`)
    .join("");
  const items = [...game.check.adjustments]
    .reverse()
    .map(
      (adj) => `
        <li>
          <span><strong>${escapeHtml(adj.componentName)}</strong> 缺 ${adj.shortage} 件（应有 ${adj.expected} / 实有 ${adj.actual}）
            ${adj.substitute ? `<br>替代：${escapeHtml(adj.substitute)}` : ""}
            ${adj.note ? `<br>备注：${escapeHtml(adj.note)}` : ""}
            <br><em>${formatTime(adj.time)}</em>
          </span>
          <button type="button" title="删除补记" data-adjust-delete="${adj.id}">×</button>
        </li>
      `
    )
    .join("");
  return `
    <section class="rule-section check-section">
      <h3>局中补记</h3>
      ${
        game.components.length
          ? `<form class="add-rule" id="adjustForm">
              <label>
                配件
                <select id="adjustComponent">${options}</select>
              </label>
              <div class="split">
                <label>
                  现场实有
                  <input id="adjustActualInput" type="number" min="0" step="1" value="0" required />
                </label>
                <label>
                  替代办法
                  <input id="adjustSubInput" placeholder="本局怎么凑" value="${escapeHtml(game.components[0]?.substitute || "")}" />
                </label>
              </div>
              <label>
                备注
                <input id="adjustNoteInput" placeholder="可选，如：少了 2 个红色工人" />
              </label>
              <button class="primary" type="submit">补记缺口（不影响本局）</button>
            </form>`
          : ""
      }
      <ul class="rule-list adjust-list">
        ${items || `<li><span>本局暂无补记。</span></li>`}
      </ul>
    </section>
  `;
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

function refreshCheckRow(game, compId) {
  const comp = game.components.find((item) => item.id === compId);
  const row = els.detailView.querySelector(`[data-check-row="${compId}"]`);
  if (!comp || !row) return;
  const item = checkItemState(game, comp);
  const badge = row.querySelector("[data-badge-for]");
  if (badge) {
    const [className, text] = checkBadgeView(item);
    badge.className = className;
    badge.textContent = text;
  }
  const subRow = row.querySelector("[data-subrow-for]");
  if (subRow) subRow.hidden = !(item.counted && item.shortage > 0);
  refreshCheckFooter(game);
}

function refreshCheckFooter(game) {
  const progress = getCheckProgress(game);
  const progressEl = els.detailView.querySelector(".check-progress");
  if (progressEl) progressEl.innerHTML = checkProgressHtml(progress);
  const startButton = els.detailView.querySelector("#startGameBtn");
  if (startButton) startButton.disabled = !progress.canStart;
  const reasonEl = els.detailView.querySelector(".block-reason");
  if (reasonEl) {
    reasonEl.textContent = checkBlockReasons(game, progress).join("；");
    reasonEl.hidden = progress.canStart;
  }
  saveState();
  renderList();
}

function saveCountInput(game, input) {
  const id = input.dataset.countFor;
  if (input.value === "") {
    delete game.check.counts[id];
    return;
  }
  const value = Number(input.value);
  if (Number.isNaN(value)) return;
  game.check.counts[id] = Math.max(0, Math.round(value));
}

function saveSubInput(game, input) {
  const id = input.dataset.subFor;
  const value = input.value.trim();
  if (value) game.check.subs[id] = value;
  else delete game.check.subs[id];
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
    check: freshCheck()
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
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;

  if (event.target.id === "ruleForm") {
    event.preventDefault();
    const key = document.querySelector("#ruleTypeInput").value;
    const text = document.querySelector("#ruleTextInput").value.trim();
    if (!text) return;
    game[key].push(text);
    renderAll();
  }

  if (event.target.id === "componentForm") {
    event.preventDefault();
    const name = document.querySelector("#componentNameInput").value.trim();
    const expected = Math.max(1, Math.round(Number(document.querySelector("#componentExpectedInput").value)) || 1);
    const substitute = document.querySelector("#componentSubstituteInput").value.trim();
    if (!name) return;
    game.components.push({ id: crypto.randomUUID(), name, expected, substitute });
    renderAll();
  }

  if (event.target.id === "adjustForm") {
    event.preventDefault();
    const comp = game.components.find((item) => item.id === document.querySelector("#adjustComponent").value);
    if (!comp) return;
    const actual = Math.max(0, Math.round(Number(document.querySelector("#adjustActualInput").value)) || 0);
    game.check.adjustments.push({
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      componentId: comp.id,
      componentName: comp.name,
      expected: comp.expected,
      actual,
      shortage: Math.max(0, comp.expected - actual),
      substitute: document.querySelector("#adjustSubInput").value.trim(),
      note: document.querySelector("#adjustNoteInput").value.trim()
    });
    renderAll();
  }
});

els.detailView.addEventListener("input", (event) => {
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;
  const countInput = event.target.closest("[data-count-for]");
  const subInput = event.target.closest("[data-sub-for]");
  if (countInput) {
    saveCountInput(game, countInput);
    saveState();
  }
  if (subInput) {
    saveSubInput(game, subInput);
    saveState();
  }
});

els.detailView.addEventListener("change", (event) => {
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;
  const countInput = event.target.closest("[data-count-for]");
  const subInput = event.target.closest("[data-sub-for]");
  if (countInput) {
    saveCountInput(game, countInput);
    refreshCheckRow(game, countInput.dataset.countFor);
  }
  if (subInput) {
    saveSubInput(game, subInput);
    refreshCheckRow(game, subInput.dataset.subFor);
  }
  if (event.target.id === "adjustComponent") {
    const comp = game.components.find((item) => item.id === event.target.value);
    const subField = document.querySelector("#adjustSubInput");
    if (comp && subField) subField.value = comp.substitute || "";
  }
});

els.detailView.addEventListener("click", (event) => {
  const ruleButton = event.target.closest("[data-rule-key]");
  const playedButton = event.target.closest("#playedTodayBtn");
  const deleteButton = event.target.closest("#deleteGameBtn");
  const componentButton = event.target.closest("[data-component-delete]");
  const useSubButton = event.target.closest("[data-use-sub-for]");
  const startButton = event.target.closest("#startGameBtn");
  const resetButton = event.target.closest("#resetCheckBtn");
  const adjustDeleteButton = event.target.closest("[data-adjust-delete]");
  const game = state.games.find((item) => item.id === state.selectedId);
  if (!game) return;

  if (ruleButton) {
    const key = ruleButton.dataset.ruleKey;
    const index = Number(ruleButton.dataset.ruleIndex);
    game[key].splice(index, 1);
    renderAll();
  }

  if (componentButton) {
    const id = componentButton.dataset.componentDelete;
    game.components = game.components.filter((item) => item.id !== id);
    delete game.check.counts[id];
    delete game.check.subs[id];
    renderAll();
  }

  if (useSubButton) {
    const id = useSubButton.dataset.useSubFor;
    const comp = game.components.find((item) => item.id === id);
    if (comp && comp.substitute) {
      game.check.subs[id] = comp.substitute;
      const input = els.detailView.querySelector(`[data-sub-for="${id}"]`);
      if (input) input.value = comp.substitute;
      refreshCheckRow(game, id);
    }
  }

  if (startButton) {
    const progress = getCheckProgress(game);
    if (!progress.canStart) return;
    game.check.started = true;
    game.check.startedAt = new Date().toISOString();
    renderAll();
  }

  if (resetButton) {
    const hasData =
      game.check.started || Object.keys(game.check.counts).length > 0 || game.check.adjustments.length > 0;
    if (hasData && !window.confirm("重新核对会清空本次填写的实有数量、替代确认和局中补记，确定吗？")) return;
    game.check = freshCheck();
    renderAll();
  }

  if (adjustDeleteButton) {
    const id = adjustDeleteButton.dataset.adjustDelete;
    game.check.adjustments = game.check.adjustments.filter((item) => item.id !== id);
    renderAll();
  }

  if (playedButton) {
    game.lastPlayed = new Date().toISOString().slice(0, 10);
    renderAll();
  }

  if (deleteButton) {
    state.games = state.games.filter((item) => item.id !== game.id);
    state.selectedId = state.games[0]?.id || "";
    renderAll();
  }
});

setDefaultDate();
renderAll();
