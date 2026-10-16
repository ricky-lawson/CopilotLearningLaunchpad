(() => {
  const ACCOUNT_KEY = "copilotLaunchpadLmsAccount";
  const PROGRESS_KEY = "copilotLaunchpadLmsProgress";
  const GOAL_KEY = "copilotLaunchpadLmsGoal";
  const BOOKMARK_KEY = "copilotLaunchpadLmsBookmark";
  const TOTAL_MODULES = 9;
  const COMMUNITY_PATH = "/community";
  const LEADERBOARD_PATH = "/leaderboard";
  const ADMIN_PATH = "/admin";
  const COURSE_LABELS = [
    "Foundations",
    "Chat Essentials",
    "Prompting",
    "Microsoft 365 Copilot in Practice",
    "Cowork",
    "Agents",
    "Choose the tool",
    "Leadership",
    "Governance",
  ];

  const getJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  };

  const setJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const account = () => getJson(ACCOUNT_KEY, null);
  const progress = () => getJson(PROGRESS_KEY, { completed: [], minutes: 0 });
  const goal = () => Number(localStorage.getItem(GOAL_KEY) || "60");
  const bookmark = () => getJson(BOOKMARK_KEY, null);

  const currentRoute = () => `${location.pathname}${location.search}`.replace(/^\/[^/]+(?=\/)/, "") || "/";

  const currentLabel = () => {
    const h1 = document.querySelector("main h1, main h2, [role='main'] h1, [role='main'] h2");
    return h1?.textContent?.trim() || "Current lesson";
  };

  const pct = () => {
    const count = progress().completed.length;
    return Math.min(100, Math.round((count / TOTAL_MODULES) * 100));
  };

  const level = () => {
    const complete = progress().completed.length;
    if (complete >= 9) return "Certified explorer";
    if (complete >= 6) return "Applied learner";
    if (complete >= 3) return "Confident learner";
    return "New learner";
  };

  const xp = () => progress().completed.length * 100;

  const initials = (name) => {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (parts[0]?.slice(0, 2) || "").toUpperCase();
  };

  const updateAccountDependentText = () => {
    const profile = account();
    const firstName = profile?.name?.trim()?.split(/\s+/)[0] || "learner";
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(".lms-account-panel")) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const replacements = [];
    while (walker.nextNode()) replacements.push(walker.currentNode);
    replacements.forEach((node) => {
      const original = node.nodeValue || "";
      const next = original
        .replace(/Good morning, /g, profile ? `Welcome back, ` : "Start your Copilot learning journey")
        .replace(/^Avery$/g, profile ? firstName : "")
        .replace(/Avery Chen/g, firstName)
        .replace(/^Level 2$/g, "Level 1")
        .replace(/^Lv 2$/g, "Lv 1")
        .replace(/^655 XP$/g, `${xp()} XP`)
        .replace(/^145 XP to Practitioner$/g, "create an account to track progress")
        .replace(/Level 2 · Navigator · 145 XP to Practitioner/g, "Level 1 · New learner · create an account to track progress")
        .replace(/Level 2 · New learner · 145 XP to Practitioner/g, "Level 1 · New learner · create an account to track progress")
        .replace(/71% toward the next level/g, `${pct()}% toward your next milestone`)
        .replace(/recommended for a project manager:/g, "recommended first:")
        .replace(/Lessons completed/g, "Lessons completed")
        .replace(/^78%$/g, "Not started")
        .replace(/through the eyes of one of ten colleagues, from new learner to executive sponsor/g, "by choosing a learning goal and starting with a clean plan")
        .replace(/Explore as a persona/g, "Choose a learning goal")
        .replace(/colleagues/g, "other learners")
        .replace(/colleague/g, "learner")
        .replace(/company-wide/gi, "community-wide")
        .replace(/Company-wide/g, "Community-wide")
        .replace(/Copilot at Work/g, "Copilot in Practice")
        .replace(/Microsoft 365 Copilot at Work/g, "Microsoft 365 Copilot in Practice")
        .replace(/workplace/g, "learning journey")
        .replace(/\bwork\b/g, "learning")
        .replace(/ at work/g, " in practice");
      const cleaned = next
        .replace(/Colearning/g, "Cowork")
        .replace(/Matches your role \(Project Manager\)/g, "Suggested for general Copilot learning")
        .replace(/Matches your role/g, "Suggested for general Copilot learning")
        .replace(/Fits your interest in individual productivity/g, "Relevant to general productivity learning")
        .replace(/Uses Microsoft 365 Copilot, which you said is available to you/g, "Uses Microsoft 365 Copilot when available")
        .replace(/Supports your goal: "Write clearer status updates"/g, "Supports a common Copilot learning goal");
      if (cleaned !== original) node.nodeValue = cleaned;
    });
  };

  const hideSyntheticSurfaces = () => {
    const profile = account();
    document.querySelectorAll(`a[href*="${LEADERBOARD_PATH}"], a[href*="${ADMIN_PATH}"]`).forEach((el) => {
      const item = el.closest("li") || el;
      item.setAttribute("data-lms-hidden", "true");
    });

    document.querySelectorAll('nav a[href*="/profile"]').forEach((el) => {
      const item = el.closest("li") || el;
      item.setAttribute("data-lms-hidden", "true");
    });

    document.querySelectorAll('header button[aria-label*="Profile menu"], header button[aria-label*="profile menu"], header button[aria-label*="Learner account"], header button').forEach((button) => {
      const buttonText = (button.textContent || "").trim();
      const buttonLabel = button.getAttribute("aria-label") || "";
      if (!buttonLabel.includes("Profile menu") && !buttonLabel.includes("profile menu") && !buttonLabel.includes("Learner account") && buttonText !== "AC") return;
      button.setAttribute("data-lms-profile-button", "true");
      if (!profile) {
        button.setAttribute("data-lms-hidden", "true");
        button.setAttribute("aria-label", "Learner account available after signup");
        button.tabIndex = -1;
        return;
      }
      button.removeAttribute("data-lms-hidden");
      button.tabIndex = 0;
      button.setAttribute("aria-label", `Learner account for ${profile.name}`);
      const badge = button.querySelector("span, div") || button;
      if (badge) badge.textContent = initials(profile.name);
    });

    document.querySelectorAll('header button[aria-label*="Notifications"], header button[aria-label*="Help and onboarding"]').forEach((button) => {
      button.setAttribute("data-lms-hidden", "true");
      button.tabIndex = -1;
    });

    document.querySelectorAll('header a[href*="/progress"]').forEach((link) => {
      if (!profile) {
        link.setAttribute("data-lms-hidden", "true");
        link.tabIndex = -1;
        return;
      }
      link.removeAttribute("data-lms-hidden");
      link.tabIndex = 0;
      link.setAttribute("aria-label", `Level 1 ${level()}, ${xp()} XP, ${pct()}% complete`);
      const textNodes = [];
      const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        const value = node.nodeValue || "";
        if (/Lv\s*\d+/.test(value)) node.nodeValue = value.replace(/Lv\s*\d+/, "Lv 1");
        if (/\d+\s*XP/.test(value)) node.nodeValue = value.replace(/\d+\s*XP/g, `${xp()} XP`);
        if (/Navigator|Practitioner|Expert/.test(value)) node.nodeValue = value.replace(/Navigator|Practitioner|Expert/g, level());
      });
      link.querySelectorAll("span, div").forEach((node) => {
        const text = (node.textContent || "").trim();
        if (/^Lv\s*\d+$/.test(text)) node.textContent = "Lv 1";
        if (/^\d+\s*XP$/.test(text)) node.textContent = `${xp()} XP`;
        if (/^(Navigator|Practitioner|Expert)$/.test(text)) node.textContent = level();
      });
    });

    document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
      const text = dialog.textContent || "";
      if (
        text.includes("Explore as a persona") ||
        text.includes("Choose a learning goal") ||
        text.includes("ten colleagues") ||
        text.includes("Learn it. Practice it.")
      ) {
        dialog.setAttribute("data-lms-hidden", "true");
        dialog.setAttribute("aria-hidden", "true");
        document.querySelectorAll('[data-slot="dialog-overlay"]').forEach((overlay) => {
          overlay.setAttribute("data-lms-hidden", "true");
        });
        dialog.querySelectorAll("button").forEach((button) => {
          button.tabIndex = -1;
        });
      }
    });

    document.querySelectorAll("section, [role='region'], article").forEach((section) => {
      const text = section.textContent || "";
      if (
        text.includes("Community highlights") ||
        text.includes("New badge earned") ||
        text.includes("Trending discussion") ||
        text.includes("Featured success story") ||
        text.includes("Daniel Kim") ||
        text.includes("Liam O'Connor")
      ) {
        section.setAttribute("data-lms-hidden", "true");
      }
    });
  };

  const blankCommunity = () => {
    if (!location.pathname.includes(COMMUNITY_PATH)) return;
    const main = document.querySelector("main");
    if (!main) return;
    Array.from(main.children).forEach((child) => {
      if (!child.classList.contains("lms-community-empty")) child.setAttribute("data-lms-hidden", "true");
    });
    if (main.dataset.lmsCommunityBlanked === "true") return;
    main.dataset.lmsCommunityBlanked = "true";
    const empty = document.createElement("div");
    empty.className = "lms-community-empty";
    empty.innerHTML = `
        <p class="lms-small">Community</p>
        <h1>Community space</h1>
        <p>This area is intentionally blank. Discussions, events, and shared prompts will appear here after real learners create them.</p>
    `;
    main.appendChild(empty);
  };

  const normalizeCleanSlateProgress = () => {
    const hasStarted = progress().completed.length > 0;
    document.querySelectorAll("p").forEach((node) => {
      const text = node.textContent || "";
      if (text.includes("145 XP to Practitioner")) node.textContent = "Level 1 · New learner · create an account to track progress";
      if (text.includes("71% toward the next level")) node.textContent = `${pct()}% toward your next milestone`;
      if (text.includes("recommended for a project manager:")) node.textContent = text.replace("recommended for a project manager:", "recommended first:");
      if (text.includes("Colearning")) node.textContent = text.replace(/Colearning/g, "Cowork");
      if (text.includes("Project Manager")) node.textContent = text.replace(/Matches your role \(Project Manager\)/g, "Suggested for general Copilot learning");
    });
    document.querySelectorAll("span, div, text, tspan").forEach((node) => {
      if ((node.textContent || "").trim() === "2" && (node.parentElement?.textContent || "").includes("Level")) {
        node.textContent = "1";
      }
    });
    document.querySelectorAll("a, span, p, div").forEach((node) => {
      if (!node.childNodes || node.childNodes.length !== 1 || node.childNodes[0].nodeType !== Node.TEXT_NODE) return;
      const text = node.textContent || "";
      if (text === "Lv 2") node.textContent = "Lv 1";
      if (text === "Navigator") node.textContent = level();
      if (text === "655 XP") node.textContent = `${xp()} XP`;
      if (/145 XP to Practitioner/.test(text)) node.textContent = "Create an account to start tracking progress";
      if (/71% toward the next level/.test(text)) node.textContent = `${pct()}% toward your next milestone`;
    });

    if (!hasStarted) {
      const cleanSlateValues = new Map([
        ["655", "0"],
        ["185", "0"],
        ["4 days", "0 days"],
        ["Grounding Guardian", "No badges yet"],
        ["52 min", "0 min"],
        ["87%", "0%"],
        ["67%", "0%"],
        ["33%", "0%"],
        ["25%", "0%"],
        ["Recommended · 33%", "Recommended · 0%"],
      ]);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || parent.closest(".lms-account-panel")) return NodeFilter.FILTER_REJECT;
          if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        const value = (node.nodeValue || "").trim();
        if (cleanSlateValues.has(value)) node.nodeValue = (node.nodeValue || "").replace(value, cleanSlateValues.get(value));
      });
    }

    document.querySelectorAll("dt, dd").forEach((node) => {
      const text = node.textContent || "";
      const label = node.previousElementSibling?.textContent || "";
      if (label.includes("Lessons completed") && /^\d+$/.test(text.trim())) node.textContent = String(progress().completed.length);
      if (label.includes("Activities completed") && /^\d+$/.test(text.trim())) node.textContent = String(progress().completed.length);
      if (label.includes("Quiz accuracy")) node.textContent = progress().completed.length ? text : "Not started";
      if (label.includes("Current streak") || label.includes("Streak")) node.textContent = progress().completed.length ? text : "0 days";
    });

    document.querySelectorAll('[aria-label*="Level 2"], [aria-label*="Navigator"], [aria-label*="655 XP"]').forEach((node) => {
      node.setAttribute("aria-label", "Level 1, 0% to next milestone");
    });
    document.querySelectorAll("span, div").forEach((node) => {
      const text = (node.textContent || "").trim();
      if (text === "87%") node.textContent = `${pct()}%`;
    });
  };

  const renderPanel = (force = false) => {
    let panel = document.querySelector(".lms-account-panel");
    const main = document.querySelector("main");
    if (!main) return;
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "lms-account-panel";
      panel.setAttribute("aria-label", "Learner account and progress");
      main.parentElement?.insertBefore(panel, main);
    }
    if (!force && panel.contains(document.activeElement)) return;

    const profile = account();
    const state = progress();
    const complete = state.completed.length;
    const percent = pct();
    const savedBookmark = bookmark();

    if (!profile) {
      panel.innerHTML = `
        <div class="lms-account-header">
          <div>
            <p class="lms-account-title">Create your learner account</p>
            <p class="lms-account-subtitle">Track your Copilot learning locally in this browser. No default learner, company profile, persona, or synthetic progress is used.</p>
          </div>
          <span class="lms-pill">Clean slate</span>
        </div>
        <form class="lms-account-form" data-lms-create-account>
          <label>First and last name<input required name="name" autocomplete="name" placeholder="First Last"></label>
          <label>Email optional<input name="email" type="email" autocomplete="email" placeholder="you@example.com"></label>
          <label>Learning goal
            <select name="goal">
              <option>Learn Copilot basics</option>
              <option>Build better prompts</option>
              <option>Use Microsoft 365 Copilot</option>
              <option>Understand agents and Cowork</option>
              <option>Lead a Copilot learning cohort</option>
            </select>
          </label>
          <button class="lms-button" type="submit">Create account</button>
        </form>
      `;
      return;
    }

    panel.innerHTML = `
      <div class="lms-account-header">
        <div>
          <p class="lms-account-title">Welcome, ${escapeHtml(profile.name)}</p>
          <p class="lms-account-subtitle">${escapeHtml(profile.goal)} · ${level()} · browser-local account</p>
        </div>
        <span class="lms-pill">${complete}/${TOTAL_MODULES} modules</span>
      </div>
      <div class="lms-progress-row">
        <div class="lms-meter" aria-label="${percent}% complete"><span style="width: ${percent}%"></span></div>
        <p class="lms-small">${percent}% complete · ${state.minutes || 0}/${goal()} weekly minutes · certificate readiness starts at 9 modules.</p>
      </div>
      <div class="lms-account-actions">
        <button class="lms-button" data-lms-complete-current>Mark current lesson complete</button>
        <button class="lms-button secondary" data-lms-bookmark>Bookmark this page</button>
        <button class="lms-button secondary" data-lms-resume>${savedBookmark ? "Resume bookmarked lesson" : "Start next module"}</button>
        <button class="lms-button secondary" data-lms-reset>Reset progress</button>
      </div>
      <p class="lms-small">Suggested path: ${COURSE_LABELS[Math.min(complete, COURSE_LABELS.length - 1)]}. Progress stays on this device unless you clear browser storage.</p>
    `;
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  const wirePanel = () => {
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-lms-create-account]");
      if (!form) return;
      event.preventDefault();
      const data = new FormData(form);
      setJson(ACCOUNT_KEY, {
        name: String(data.get("name") || "Learner").trim(),
        email: String(data.get("email") || "").trim(),
        goal: String(data.get("goal") || "Learn Copilot basics"),
        createdAt: new Date().toISOString(),
      });
      setJson(PROGRESS_KEY, { completed: [], minutes: 0 });
      renderAll(true);
    });

    document.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.matches("[data-lms-complete-current]")) {
        const state = progress();
        const route = currentRoute();
        if (!state.completed.some((item) => item.route === route)) {
          state.completed.push({ route, label: currentLabel(), completedAt: new Date().toISOString() });
          state.minutes = Number(state.minutes || 0) + 10;
          setJson(PROGRESS_KEY, state);
        }
        renderAll(true);
      }
      if (target.matches("[data-lms-bookmark]")) {
        setJson(BOOKMARK_KEY, { route: currentRoute(), label: currentLabel(), savedAt: new Date().toISOString() });
        renderAll(true);
      }
      if (target.matches("[data-lms-resume]")) {
        const saved = bookmark();
        if (saved?.route) history.pushState({}, "", saved.route);
        else history.pushState({}, "", "/learn/f1");
        window.dispatchEvent(new PopStateEvent("popstate"));
        renderAll(true);
      }
      if (target.matches("[data-lms-reset]")) {
        setJson(PROGRESS_KEY, { completed: [], minutes: 0 });
        localStorage.removeItem(BOOKMARK_KEY);
        renderAll();
      }
    });
  };

  const renderAll = (force = false) => {
    renderPanel(force);
    updateAccountDependentText();
    normalizeCleanSlateProgress();
    hideSyntheticSurfaces();
    blankCommunity();
  };

  const patchHistory = () => {
    for (const name of ["pushState", "replaceState"]) {
      const original = history[name];
      history[name] = function patchedHistoryMethod(...args) {
        const result = original.apply(this, args);
        setTimeout(renderAll, 80);
        return result;
      };
    }
    window.addEventListener("popstate", () => setTimeout(renderAll, 80));
  };

  wirePanel();
  patchHistory();
  const observer = new MutationObserver(() => {
    clearTimeout(window.__lmsRenderTimer);
    window.__lmsRenderTimer = setTimeout(renderAll, 80);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("load", renderAll);
  setTimeout(renderAll, 500);
})();
