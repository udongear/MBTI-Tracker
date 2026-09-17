import { initCloudSync, queueCloudPush } from "./cloud-sync.js";

(() => {
  "use strict";

  const STORAGE_KEY = "mbtiViewer.entries";
  const DATA_VERSION_KEY = "mbtiViewer.dataVersion";
  // Bumping this wipes any previously-seeded entries/relationships/sub-categories
  // (see the reset block below) and reseeds from the DEFAULT_* lists here — used
  // once to strip this app's personal example data for public release.
  const DATA_VERSION = "public-template-2026-09-08";

  // Intentionally empty — this is the public template. Entries are added via the
  // "+ Add Entry" button once the page is running.
  const DEFAULT_ENTRIES = [];

  const MBTI_TYPES = [
    { code: "ISTJ", name: "Logistician", group: "sentinel" },
    { code: "ISFJ", name: "Defender",    group: "sentinel" },
    { code: "INFJ", name: "Advocate",    group: "diplomat" },
    { code: "INTJ", name: "Architect",   group: "analyst" },
    { code: "ISTP", name: "Virtuoso",    group: "explorer" },
    { code: "ISFP", name: "Adventurer",  group: "explorer" },
    { code: "INFP", name: "Mediator",    group: "diplomat" },
    { code: "INTP", name: "Logician",    group: "analyst" },
    { code: "ESTP", name: "Entrepreneur",group: "explorer" },
    { code: "ESFP", name: "Entertainer", group: "explorer" },
    { code: "ENFP", name: "Campaigner",  group: "diplomat" },
    { code: "ENTP", name: "Debater",     group: "analyst" },
    { code: "ESTJ", name: "Executive",   group: "sentinel" },
    { code: "ESFJ", name: "Consul",      group: "sentinel" },
    { code: "ENFJ", name: "Protagonist", group: "diplomat" },
    { code: "ENTJ", name: "Commander",   group: "analyst" },
  ];

  // Shared lookup/order tables — declared early since several sections below
  // (CSV import validation, list sorting) reference them at module-load time.
  const GENDER_ORDER = ["M", "F"];
  const STATUS_ORDER = ["Confirmed", "AI Confirmed", "Pending", "Speculated", "Rejected"];
  // Intentionally empty — add your own via Settings → Relationships / Sub-Categories.
  const DEFAULT_RELATIONSHIP_NAMES = [];
  const DEFAULT_SUBCATEGORY_NAMES = [];

  function orderIndex(order, value) {
    const i = order.indexOf(value);
    return i === -1 ? Infinity : i; // blank/unrecognized values sort last
  }

  // Relationships and sub-categories are user-editable (see Settings), so their
  // sort order and valid-value lists are read live off the current lists below
  // rather than baked in as static arrays.
  function relationshipNames() { return relationships.map((r) => r.name); }
  function subCategoryNames() { return subCategories.map((s) => s.name); }

  function mbtiIndex(code) {
    const i = MBTI_TYPES.findIndex((t) => t.code === code);
    return i === -1 ? Infinity : i;
  }

  const STEREOTYPES = {
    ISTJ: ["Rigid", "Methodical", "Boring"],
    ISFJ: ["People Pleasing", "Self Sacrificing", "Nurturing"],
    INFJ: ["Philosophical", "Passionate", "Cautious"],
    INTJ: ["Awkward", "Reserved", "Smart"],
    ISTP: ["Lone Wolf", "Practical", "Reserved"],
    ISFP: ["Airheaded", "Artistic", "Unemployed"],
    INFP: ["Expressive", "Daydreamer", "Crybaby"],
    INTP: ["Messy", "Curious", "Knowledgeable"],
    ESTP: ["Jock", "Rebellious", "Inconsiderate"],
    ESFP: ["Social butterfly", "Energetic", "Enthusistic"],
    ENFP: ["Authentic", "Bubbly", "Optimistic"],
    ENTP: ["Argumentative", "Persuasive", "Troll"],
    ESTJ: ["Bossy", "Karen", "By The Book"],
    ESFJ: ["Ammicable", "Socially Intelligent", "Enjoys Drama"],
    ENFJ: ["Virtuous", "Prideful", "Steadfast"],
    ENTJ: ["Managerial", "Intimidating", "Visionary"],
  };

  const OBS_KEY = "mbtiViewer.observations";

  function loadObservations() {
    try {
      const raw = localStorage.getItem(OBS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Failed to load observations", e);
      return {};
    }
  }

  function saveObservations() {
    localStorage.setItem(OBS_KEY, JSON.stringify(observations));
  }

  /** @type {Object<string, string[]>} */
  let observations = loadObservations();

  // ---------- settings: icon style, relationships, sub-categories ----------
  const ICON_MODE_KEY = "mbtiViewer.iconMode";
  const RELATIONSHIPS_KEY = "mbtiViewer.relationships";
  const SUBCATEGORIES_KEY = "mbtiViewer.subCategories";

  // A DATA_VERSION bump (see loadEntries) means previously-seeded personal data is
  // being retired — wipe any relationships/sub-categories a prior version seeded too,
  // so this and every already-visited browser starts clean instead of just new ones.
  if (localStorage.getItem(DATA_VERSION_KEY) !== DATA_VERSION) {
    localStorage.removeItem(RELATIONSHIPS_KEY);
    localStorage.removeItem(SUBCATEGORIES_KEY);
  }

  function loadIconMode() {
    return localStorage.getItem(ICON_MODE_KEY) === "initial" ? "initial" : "emoji";
  }

  function saveIconMode() {
    localStorage.setItem(ICON_MODE_KEY, iconMode);
  }

  /** Loads a user-editable {id, name}[] list, seeding it from defaultNames on first run. */
  function loadOptionList(key, defaultNames) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
    }
    const seeded = defaultNames.map((name) => ({ id: uid(), name }));
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  function saveRelationships() {
    localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(relationships));
  }

  function saveSubCategories() {
    localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(subCategories));
  }

  let iconMode = loadIconMode();
  /** @type {Array<{id: string, name: string}>} */
  let relationships = loadOptionList(RELATIONSHIPS_KEY, DEFAULT_RELATIONSHIP_NAMES);
  /** @type {Array<{id: string, name: string}>} */
  let subCategories = loadOptionList(SUBCATEGORIES_KEY, DEFAULT_SUBCATEGORY_NAMES);

  function iconGlyph(en) {
    if (iconMode === "initial") {
      const letter = (en.name || "").trim().charAt(0).toUpperCase();
      return escapeHtml(letter || "?");
    }
    return en.emoji || "❓";
  }

  /** @type {Array<Object>} */
  let entries = loadEntries();
  let editingId = null;
  const selectedIds = new Set();

  // ---------- persistence ----------
  function loadEntries() {
    try {
      // A version bump here wipes whatever's stored and reseeds with DEFAULT_ENTRIES —
      // used once to swap in a fresh dataset.
      if (localStorage.getItem(DATA_VERSION_KEY) !== DATA_VERSION) {
        const seeded = DEFAULT_ENTRIES.map((en) => ({ id: uid(), ...en }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
        return seeded;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load entries", e);
      return [];
    }
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Self-heals the Relationships/Sub-Categories catalogs (the lists behind
   * the Settings editor and the entry-form dropdowns) against whatever
   * values entries actually carry. An entry's relationship/subCategory is
   * just a plain string, independent of the catalog, so the two can drift —
   * e.g. a catalog wiped by a stale/empty cross-device sync, or a CSV import
   * that used a name not yet in the catalog. Returns true if it changed anything.
   */
  function reconcileOptionCatalogs() {
    let changed = false;
    const relNames = new Set(relationships.map((r) => r.name));
    const subNames = new Set(subCategories.map((s) => s.name));
    entries.forEach((en) => {
      if (en.relationship && !relNames.has(en.relationship)) {
        relationships.push({ id: uid(), name: en.relationship });
        relNames.add(en.relationship);
        changed = true;
      }
      if (en.subCategory && !subNames.has(en.subCategory)) {
        subCategories.push({ id: uid(), name: en.subCategory });
        subNames.add(en.subCategory);
        changed = true;
      }
    });
    if (changed) {
      saveRelationships();
      saveSubCategories();
    }
    return changed;
  }

  // ---------- cross-device sync (see cloud-sync.js) ----------
  /** Bundles the account-specific state to mirror into Firestore. */
  function getCloudState() {
    return { entries, observations, relationships, subCategories, iconMode };
  }

  /** Applies a state document that arrived from another signed-in device. */
  function applyCloudState(remote) {
    if (!remote) return;

    if (Array.isArray(remote.entries)) {
      entries = remote.entries;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
    if (remote.observations && typeof remote.observations === "object") {
      observations = remote.observations;
      localStorage.setItem(OBS_KEY, JSON.stringify(observations));
    }
    if (Array.isArray(remote.relationships)) {
      relationships = remote.relationships;
      localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(relationships));
    }
    if (Array.isArray(remote.subCategories)) {
      subCategories = remote.subCategories;
      localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(subCategories));
    }
    if (remote.iconMode === "emoji" || remote.iconMode === "initial") {
      iconMode = remote.iconMode;
      localStorage.setItem(ICON_MODE_KEY, iconMode);
    }

    // The remote entries may reference relationship/subCategory names this
    // device's remote catalog doesn't have (e.g. another device imported a
    // CSV with a new value) — patch the catalog back in and re-sync it up.
    if (reconcileOptionCatalogs()) queueCloudPush();

    // Any of the above could have changed, and we don't know which — just
    // refresh everything that depends on this state.
    populateRelationshipDropdown();
    populateSubCategoryDropdown();
    renderList();
    renderGrid();
    iconModeToggle.checked = iconMode === "initial";
    if (!settingsModal.classList.contains("hidden")) {
      relationshipManager.render();
      subCategoryManager.render();
    }
    if (currentModalCode) {
      modalMembers.innerHTML = renderModalMembers(currentModalCode);
      modalObservations.innerHTML = renderModalObservations(currentModalCode);
    }
  }

  // ---------- dom refs ----------
  const listModeBtn = document.getElementById("listModeBtn");
  const gridModeBtn = document.getElementById("gridModeBtn");
  const listView = document.getElementById("listView");
  const gridView = document.getElementById("gridView");

  const entryForm = document.getElementById("entryForm");
  const entryIdField = document.getElementById("entryId");
  const statusField = document.getElementById("status");
  const emojiField = document.getElementById("emoji");
  const emojiButton = document.getElementById("emojiButton");
  const emojiPicker = document.getElementById("picker");
  const nameField = document.getElementById("name");
  const mbtiField = document.getElementById("mbti");
  const genderField = document.getElementById("gender");
  const relationshipField = document.getElementById("relationship");
  const subCategoryField = document.getElementById("subCategory");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const entryModal = document.getElementById("entryModal");
  const entryModalTitle = document.getElementById("entryModalTitle");
  const entryModalCloseBtn = document.getElementById("entryModalCloseBtn");
  const openAddEntryBtn = document.getElementById("openAddEntryBtn");

  const importExportModal = document.getElementById("importExportModal");
  const importExportCloseBtn = document.getElementById("importExportCloseBtn");
  const openImportExportBtn = document.getElementById("openImportExportBtn");
  const exportCount = document.getElementById("exportCount");
  const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const importCsvBtn = document.getElementById("importCsvBtn");
  const importCsvFile = document.getElementById("importCsvFile");

  const importPreviewModal = document.getElementById("importPreviewModal");
  const importPreviewCloseBtn = document.getElementById("importPreviewCloseBtn");
  const importPreviewSummary = document.getElementById("importPreviewSummary");
  const importPreviewBody = document.getElementById("importPreviewBody");
  const confirmImportBtn = document.getElementById("confirmImportBtn");
  const confirmImportCount = document.getElementById("confirmImportCount");
  const cancelImportPreviewBtn = document.getElementById("cancelImportPreviewBtn");

  const searchBox = document.getElementById("searchBox");
  const sortHeaders = document.querySelectorAll(".entry-table th.sortable");
  const entryCount = document.getElementById("entryCount");
  const entryList = document.getElementById("entryList");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");

  const mbtiGrid = document.getElementById("mbtiGrid");
  const toast = document.getElementById("toast");

  const mbtiModal = document.getElementById("mbtiModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalTitle = document.getElementById("modalTitle");
  const modalAvatarM = document.getElementById("modalAvatarM");
  const modalAvatarF = document.getElementById("modalAvatarF");
  const modalMembers = document.getElementById("modalMembers");
  const modalStereotypes = document.getElementById("modalStereotypes");
  const modalObservations = document.getElementById("modalObservations");
  const observationForm = document.getElementById("observationForm");
  const observationInput = document.getElementById("observationInput");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const settingsCloseBtn = document.getElementById("settingsCloseBtn");
  const iconModeToggle = document.getElementById("iconModeToggle");
  const relationshipEditor = document.getElementById("relationshipEditor");
  const subCategoryEditor = document.getElementById("subCategoryEditor");
  const addRelationshipBtn = document.getElementById("addRelationshipBtn");
  const addSubCategoryBtn = document.getElementById("addSubCategoryBtn");

  // ---------- init ----------
  function populateMbtiDropdown() {
    mbtiField.innerHTML =
      `<option value="">-</option>` +
      MBTI_TYPES.map(
        (t) => `<option value="${t.code}">${t.code} — ${t.name}</option>`
      ).join("");
  }

  function populateRelationshipDropdown() {
    const current = relationshipField.value;
    relationshipField.innerHTML =
      `<option value="">-</option>` +
      relationships.map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join("");
    relationshipField.value = current;
  }

  function populateSubCategoryDropdown() {
    const current = subCategoryField.value;
    subCategoryField.innerHTML =
      `<option value="">-</option>` +
      subCategories.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
    subCategoryField.value = current;
  }

  function switchMode(mode) {
    const toList = mode === "list";
    listView.classList.toggle("hidden", !toList);
    gridView.classList.toggle("hidden", toList);
    listModeBtn.classList.toggle("active", toList);
    gridModeBtn.classList.toggle("active", !toList);
    listModeBtn.setAttribute("aria-selected", String(toList));
    gridModeBtn.setAttribute("aria-selected", String(!toList));
    if (!toList) renderGrid();
  }

  listModeBtn.addEventListener("click", () => switchMode("list"));
  gridModeBtn.addEventListener("click", () => switchMode("grid"));

  // ---------- emoji picker ----------
  emojiPicker.style.display = "none";

  emojiButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = emojiPicker.style.display !== "none";
    emojiPicker.style.display = isOpen ? "none" : "block";
    emojiButton.setAttribute("aria-expanded", String(!isOpen));
  });

  emojiPicker.addEventListener("emoji-click", (event) => {
    const chosen = event.detail.unicode;
    emojiField.value = chosen;
    emojiButton.textContent = chosen;
    emojiPicker.style.display = "none";
    emojiButton.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".emoji-field")) {
      emojiPicker.style.display = "none";
      emojiButton.setAttribute("aria-expanded", "false");
    }
  });

  // ---------- add/edit entry modal ----------
  function openEntryModal() {
    entryModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeEntryModal() {
    entryModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function closeAndResetEntryModal() {
    stopEditing();
    resetFormFields();
    closeEntryModal();
  }

  openAddEntryBtn.addEventListener("click", () => {
    closeAndResetEntryModal();
    entryModalTitle.textContent = "Add Entry";
    openEntryModal();
    nameField.focus();
  });

  entryModalCloseBtn.addEventListener("click", closeAndResetEntryModal);

  entryModal.addEventListener("click", (e) => {
    if (e.target === entryModal) closeAndResetEntryModal();
  });

  // ---------- import / export ----------
  const CSV_FIELDS = [
    { header: "Name", key: "name" },
    { header: "MBTI", key: "mbti" },
    { header: "Status", key: "status" },
    { header: "Gender", key: "gender" },
    { header: "Relationship", key: "relationship" },
    { header: "Sub Category", key: "subCategory" },
  ];

  function csvEscape(value) {
    const str = String(value ?? "");
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  function toCSV(rows) {
    return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { field += ch; }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field); field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        rows.push(row); row = [];
      } else {
        field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.length > 1 || r[0] !== "");
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function canonicalize(value, knownList) {
    const v = (value || "").trim();
    if (!v) return "";
    const match = knownList.find((k) => k.toLowerCase() === v.toLowerCase());
    return match || v;
  }

  function openImportExportModal() {
    exportCount.textContent = String(entries.length);
    importExportModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeImportExportModal() {
    importExportModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  openImportExportBtn.addEventListener("click", openImportExportModal);
  importExportCloseBtn.addEventListener("click", closeImportExportModal);
  importExportModal.addEventListener("click", (e) => {
    if (e.target === importExportModal) closeImportExportModal();
  });

  downloadTemplateBtn.addEventListener("click", () => {
    const header = CSV_FIELDS.map((f) => f.header);
    const example = ["Jane Doe", "INFP", "Confirmed", "F", "Friend", "JW Pre-Covid"];
    downloadFile("mbti-viewer-template.csv", toCSV([header, example]), "text/csv");
  });

  exportCsvBtn.addEventListener("click", () => {
    const header = CSV_FIELDS.map((f) => f.header);
    const rows = entries.map((en) => CSV_FIELDS.map((f) => en[f.key] ?? ""));
    downloadFile("mbti-viewer-data.csv", toCSV([header, ...rows]), "text/csv");
    showToast(`Exported ${entries.length} entries`);
  });

  importCsvBtn.addEventListener("click", () => importCsvFile.click());

  function getKnownValues() {
    return {
      mbti: MBTI_TYPES.map((t) => t.code),
      status: STATUS_ORDER,
      gender: ["M", "F"],
      relationship: relationshipNames(),
      subCategory: subCategoryNames(),
    };
  }

  function isRecognized(key, value) {
    if (!value) return true; // blank is always fine
    return getKnownValues()[key].some((k) => k.toLowerCase() === value.toLowerCase());
  }

  importCsvFile.addEventListener("change", () => {
    const file = importCsvFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result));
        if (rows.length === 0) throw new Error("File is empty.");

        const headerRow = rows[0].map((h) => h.trim().toLowerCase());
        const colIndex = CSV_FIELDS.map((f) => headerRow.indexOf(f.header.toLowerCase()));
        const get = (row, fieldIdx) => {
          const col = colIndex[fieldIdx];
          return col === -1 ? "" : (row[col] || "").trim();
        };
        const KNOWN = getKnownValues();

        const previewRows = [];
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const raw = {
            name: get(row, 0),
            mbti: get(row, 1),
            status: get(row, 2),
            gender: get(row, 3),
            relationship: get(row, 4),
            subCategory: get(row, 5),
          };
          if (Object.values(raw).every((v) => v === "")) continue; // fully blank line

          const skip = !raw.name;
          const issues = [];
          if (skip) issues.push("Missing Name — this row will be skipped");
          if (!isRecognized("mbti", raw.mbti)) issues.push(`MBTI "${raw.mbti}" not recognized`);
          if (!isRecognized("status", raw.status)) issues.push(`Status "${raw.status}" not recognized`);
          if (!isRecognized("gender", raw.gender)) issues.push(`Gender "${raw.gender}" not recognized — will be left blank`);
          if (!isRecognized("relationship", raw.relationship)) issues.push(`Relationship "${raw.relationship}" isn't a standard option`);
          if (!isRecognized("subCategory", raw.subCategory)) issues.push(`Sub Category "${raw.subCategory}" isn't a standard option`);

          previewRows.push({
            rowNumber: r + 1, // CSV line number (header is line 1)
            skip,
            issues,
            entry: {
              id: uid(),
              emoji: "❓", // emojis aren't supported via CSV — assigned by hand after import
              name: raw.name,
              mbti: canonicalize(raw.mbti, KNOWN.mbti),
              status: canonicalize(raw.status, KNOWN.status),
              gender: /^[mf]$/i.test(raw.gender) ? raw.gender.toUpperCase() : "",
              relationship: canonicalize(raw.relationship, KNOWN.relationship),
              subCategory: canonicalize(raw.subCategory, KNOWN.subCategory),
            },
          });
        }

        if (previewRows.length === 0) throw new Error("No data rows found in this file.");

        openImportPreview(previewRows);
      } catch (err) {
        alert("Could not read file: " + err.message);
      } finally {
        importCsvFile.value = "";
      }
    };
    reader.readAsText(file);
  });

  // ---------- import preview / checkpoint ----------
  let pendingImportRows = [];

  function openImportPreview(rows) {
    pendingImportRows = rows;
    const ready = rows.filter((r) => !r.skip);
    const warned = ready.filter((r) => r.issues.length > 0);
    const skipped = rows.filter((r) => r.skip);

    importPreviewSummary.textContent =
      `${ready.length} ready to import` +
      (warned.length ? ` · ${warned.length} with warnings` : "") +
      (skipped.length ? ` · ${skipped.length} skipped (missing Name)` : "");

    confirmImportCount.textContent = String(ready.length);
    confirmImportBtn.disabled = ready.length === 0;
    document.querySelector('input[name="importMode"][value="merge"]').checked = true;

    importPreviewBody.innerHTML = rows
      .map((r) => {
        const en = r.entry;
        let notes;
        if (r.skip) notes = `<span class="ip-skip-label">Skipped</span>`;
        else if (r.issues.length) notes = `<ul class="ip-issues">${r.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
        else notes = `<span class="ip-ok">✓ Ready</span>`;

        return `
        <tr class="${r.skip ? "ip-skip" : ""}">
          <td>${r.rowNumber}</td>
          <td>${escapeHtml(en.name) || "—"}</td>
          <td>${escapeHtml(en.mbti) || "-"}</td>
          <td>${escapeHtml(en.status) || "-"}</td>
          <td>${escapeHtml(en.gender) || "-"}</td>
          <td>${escapeHtml(en.relationship) || "-"}</td>
          <td>${escapeHtml(en.subCategory) || "-"}</td>
          <td class="ip-notes">${notes}</td>
        </tr>`;
      })
      .join("");

    closeImportExportModal();
    importPreviewModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeImportPreview() {
    importPreviewModal.classList.add("hidden");
    document.body.style.overflow = "";
    pendingImportRows = [];
  }

  confirmImportBtn.addEventListener("click", () => {
    const ready = pendingImportRows.filter((r) => !r.skip).map((r) => r.entry);
    if (ready.length === 0) return;

    const mode = document.querySelector('input[name="importMode"]:checked').value;
    if (mode === "replace" && !confirm(`Replace all existing entries with these ${ready.length}? This cannot be undone.`)) {
      return;
    }

    entries = mode === "replace" ? ready : entries.concat(ready);
    saveEntries();
    queueCloudPush();
    renderList();
    renderGrid();
    closeImportPreview();
    showToast(`Imported ${ready.length} entries`);
  });

  importPreviewCloseBtn.addEventListener("click", closeImportPreview);
  cancelImportPreviewBtn.addEventListener("click", closeImportPreview);
  importPreviewModal.addEventListener("click", (e) => {
    if (e.target === importPreviewModal) closeImportPreview();
  });

  // ---------- form handling ----------
  entryForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {
      status: statusField.value,
      emoji: emojiField.value.trim() || "❓",
      name: nameField.value.trim(),
      mbti: mbtiField.value,
      gender: genderField.value,
      relationship: relationshipField.value,
      subCategory: subCategoryField.value,
    };

    if (!data.name) {
      nameField.focus();
      return;
    }

    if (editingId) {
      const idx = entries.findIndex((en) => en.id === editingId);
      if (idx !== -1) entries[idx] = { ...entries[idx], ...data };
      showToast(`Updated ${data.name}`);
    } else {
      entries.push({ id: uid(), ...data });
      showToast(`Added ${data.name}`);
    }

    saveEntries();
    queueCloudPush();
    closeAndResetEntryModal();
    renderList();
    renderGrid();
  });

  cancelEditBtn.addEventListener("click", closeAndResetEntryModal);

  function resetFormFields() {
    entryForm.reset();
    entryIdField.value = "";
    emojiField.value = "";
    emojiButton.textContent = "❓";
  }

  function startEditing(id) {
    const entry = entries.find((en) => en.id === id);
    if (!entry) return;
    editingId = id;
    entryIdField.value = id;
    statusField.value = entry.status;
    emojiField.value = entry.emoji;
    emojiButton.textContent = entry.emoji || "❓";
    nameField.value = entry.name;
    mbtiField.value = entry.mbti;
    genderField.value = entry.gender;
    relationshipField.value = entry.relationship;
    subCategoryField.value = entry.subCategory;
    submitBtn.textContent = "Save Changes";
    entryModalTitle.textContent = "Edit Entry";
    openEntryModal();
    nameField.focus();
  }

  function stopEditing() {
    editingId = null;
    submitBtn.textContent = "Add Entry";
  }

  function deleteEntry(id) {
    const entry = entries.find((en) => en.id === id);
    if (!entry) return;
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return;
    entries = entries.filter((en) => en.id !== id);
    if (editingId === id) closeAndResetEntryModal();
    saveEntries();
    queueCloudPush();
    renderList();
    renderGrid();
    showToast(`Deleted ${entry.name}`);
  }

  // ---------- list rendering ----------
  function statusClass(status) {
    return status.replace(/\s+/g, "-");
  }

  function mbtiGroup(code) {
    const type = MBTI_TYPES.find((t) => t.code === code);
    return type ? type.group : "";
  }

  function compareEntries(a, b, key) {
    switch (key) {
      case "mbti":
        return mbtiIndex(a.mbti) - mbtiIndex(b.mbti) || a.name.localeCompare(b.name);
      case "gender":
        return orderIndex(GENDER_ORDER, a.gender) - orderIndex(GENDER_ORDER, b.gender) || a.name.localeCompare(b.name);
      case "status":
        return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
      case "relationship": {
        const order = relationshipNames();
        return orderIndex(order, a.relationship) - orderIndex(order, b.relationship) || a.name.localeCompare(b.name);
      }
      case "subCategory": {
        const order = subCategoryNames();
        return orderIndex(order, a.subCategory) - orderIndex(order, b.subCategory) || a.name.localeCompare(b.name);
      }
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  }

  // ---------- column-header sorting ----------
  let sortField = "name";
  let sortDir = "asc";

  sortHeaders.forEach((th) => {
    th.setAttribute("aria-sort", "none");
    th.addEventListener("click", () => {
      if (sortField === th.dataset.sort) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortField = th.dataset.sort;
        sortDir = "asc";
      }
      renderList();
    });
  });

  function updateSortIndicators() {
    sortHeaders.forEach((th) => {
      th.setAttribute(
        "aria-sort",
        th.dataset.sort === sortField ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      );
    });
  }

  function renderList() {
    const query = searchBox.value.trim().toLowerCase();

    const visible = entries
      .filter((en) => !query || en.name.toLowerCase().includes(query))
      .sort((a, b) => compareEntries(a, b, sortField) * (sortDir === "desc" ? -1 : 1));

    // drop selections that scrolled out of view (e.g. a search narrowed the list)
    const visibleIds = new Set(visible.map((en) => en.id));
    selectedIds.forEach((id) => { if (!visibleIds.has(id)) selectedIds.delete(id); });

    entryCount.textContent = `${visible.length} / ${entries.length} entries`;
    updateSortIndicators();

    bulkDeleteBtn.hidden = selectedIds.size === 0;
    bulkDeleteBtn.textContent = `🗑️ Delete Selected (${selectedIds.size})`;
    selectAllCheckbox.checked = visible.length > 0 && visible.every((en) => selectedIds.has(en.id));
    selectAllCheckbox.indeterminate = selectedIds.size > 0 && !selectAllCheckbox.checked;

    if (visible.length === 0) {
      entryList.innerHTML = `<tr class="empty-row"><td colspan="9">No entries yet. Fill out the form above to add one.</td></tr>`;
      return;
    }

    entryList.innerHTML = visible
      .map((en) => {
        return `
        <tr data-id="${en.id}">
          <td class="cell-select"><input type="checkbox" class="row-select" data-id="${en.id}" ${selectedIds.has(en.id) ? "checked" : ""}></td>
          <td class="cell-emoji">${iconGlyph(en)}</td>
          <td class="cell-name">${escapeHtml(en.name)}</td>
          <td><span class="entry-mbti ${en.mbti ? "group-" + mbtiGroup(en.mbti) : ""}">${en.mbti || "-"}</span></td>
          <td><span class="status-badge ${statusClass(en.status)}">${en.status || "-"}</span></td>
          <td><span class="gender-tag ${en.gender}">${en.gender === "M" ? "Male" : en.gender === "F" ? "Female" : "-"}</span></td>
          <td class="cell-relationship">${escapeHtml(en.relationship) || "-"}</td>
          <td class="cell-subcategory">${escapeHtml(en.subCategory) || "-"}</td>
          <td class="cell-actions">
            <div class="entry-actions">
              <button class="icon-btn edit-btn" title="Edit">✏️</button>
              <button class="icon-btn danger delete-btn" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  entryList.addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-id]");
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest(".edit-btn")) startEditing(id);
    if (e.target.closest(".delete-btn")) deleteEntry(id);
  });

  entryList.addEventListener("change", (e) => {
    const cb = e.target.closest(".row-select");
    if (!cb) return;
    if (cb.checked) selectedIds.add(cb.dataset.id);
    else selectedIds.delete(cb.dataset.id);
    renderList();
  });

  selectAllCheckbox.addEventListener("change", () => {
    const ids = Array.from(entryList.querySelectorAll("tr[data-id]")).map((tr) => tr.dataset.id);
    if (selectAllCheckbox.checked) ids.forEach((id) => selectedIds.add(id));
    else ids.forEach((id) => selectedIds.delete(id));
    renderList();
  });

  bulkDeleteBtn.addEventListener("click", () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(`Delete ${count} selected entr${count === 1 ? "y" : "ies"}? This cannot be undone.`)) return;
    entries = entries.filter((en) => !selectedIds.has(en.id));
    if (editingId && selectedIds.has(editingId)) closeAndResetEntryModal();
    selectedIds.clear();
    saveEntries();
    queueCloudPush();
    renderList();
    renderGrid();
    showToast(`Deleted ${count} entries`);
  });

  searchBox.addEventListener("input", renderList);

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- grid rendering ----------
  function renderGrid() {
    mbtiGrid.innerHTML = MBTI_TYPES.map((type) => {
      const maleEntries = entriesFor(type.code, "M");
      const femaleEntries = entriesFor(type.code, "F");
      return `
        <div class="type-cell group-${type.group}">
          <div class="type-header" data-mbti="${type.code}" title="Click for details">
            <div class="type-code">${type.code}</div>
            <div class="type-name">${type.name}</div>
          </div>
          <div class="type-body">
            ${genderColumnHtml(maleEntries, "male-col")}
            ${genderColumnHtml(femaleEntries, "female-col")}
          </div>
        </div>`;
    }).join("");
  }

  function entriesFor(mbti, gender) {
    return entries
      .filter((en) => en.mbti === mbti && en.gender === gender)
      .sort((a, b) => a.subCategory.localeCompare(b.subCategory) || a.name.localeCompare(b.name));
  }

  function avatarPath(code, gender) {
    const num = mbtiIndex(code) + 1; // 1-based, matches the "1) ISTJ M.png" filenames
    const g = gender === "F" ? "F" : "M";
    return `imgs/${encodeURIComponent(`${num}) ${code} ${g}.png`)}`;
  }

  function genderColumnHtml(list, colClass) {
    const minSlots = 6; // 2 rows x 3 cols, matches the reference layout
    const slotCount = Math.max(minSlots, Math.ceil(list.length / 3) * 3);

    let html = `<div class="gender-col ${colClass}">`;
    for (let i = 0; i < slotCount; i++) {
      const en = list[i];
      if (en) {
        const titleParts = [en.name, en.subCategory || en.relationship].filter(Boolean).map(escapeHtml);
        html += `<div class="slot filled" data-id="${en.id}" title="${titleParts.join(" — ")}">${iconGlyph(en)}</div>`;
      } else {
        html += `<div class="slot empty"></div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  mbtiGrid.addEventListener("click", (e) => {
    const slot = e.target.closest(".slot.filled");
    if (slot) {
      startEditing(slot.dataset.id);
      return;
    }
    const header = e.target.closest(".type-header");
    if (header) openMbtiModal(header.dataset.mbti);
  });

  // ---------- MBTI detail modal ----------
  let currentModalCode = null;

  function renderModalMembers(code) {
    const list = entries
      .filter((en) => en.mbti === code)
      .sort((a, b) => orderIndex(GENDER_ORDER, a.gender) - orderIndex(GENDER_ORDER, b.gender) || a.name.localeCompare(b.name));

    if (list.length === 0) {
      return `<p class="modal-empty">No members recorded yet.</p>`;
    }

    return list
      .map((en) => {
        const sub = [en.relationship, en.subCategory].filter(Boolean).map(escapeHtml).join(" · ");
        const genderLabel = en.gender === "M" ? "Male" : en.gender === "F" ? "Female" : "-";
        return `
        <div class="modal-member">
          <span class="modal-member-emoji">${iconGlyph(en)}</span>
          <span class="modal-member-name">${escapeHtml(en.name)}</span>
          <span class="gender-tag ${en.gender}">${genderLabel}</span>
          <span class="modal-member-sub">${sub}</span>
        </div>`;
      })
      .join("");
  }

  function renderModalObservations(code) {
    const list = observations[code] || [];
    if (list.length === 0) {
      return `<li class="modal-empty-item">No observations yet — add one below.</li>`;
    }
    return list
      .map(
        (text, i) => `
        <li>
          <span>${escapeHtml(text)}</span>
          <button type="button" class="obs-delete" data-index="${i}" title="Remove">✕</button>
        </li>`
      )
      .join("");
  }

  function openMbtiModal(code) {
    const type = MBTI_TYPES.find((t) => t.code === code);
    if (!type) return;

    currentModalCode = code;
    modalTitle.textContent = `${type.code} — ${type.name}`;
    modalAvatarM.src = avatarPath(code, "M");
    modalAvatarM.alt = `${code} male avatar`;
    modalAvatarF.src = avatarPath(code, "F");
    modalAvatarF.alt = `${code} female avatar`;
    modalMembers.innerHTML = renderModalMembers(code);
    modalStereotypes.innerHTML = (STEREOTYPES[code] || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
    modalObservations.innerHTML = renderModalObservations(code);
    observationInput.value = "";

    mbtiModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeMbtiModal() {
    mbtiModal.classList.add("hidden");
    currentModalCode = null;
    document.body.style.overflow = "";
  }

  modalCloseBtn.addEventListener("click", closeMbtiModal);

  mbtiModal.addEventListener("click", (e) => {
    if (e.target === mbtiModal) closeMbtiModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!mbtiModal.classList.contains("hidden")) closeMbtiModal();
    else if (!entryModal.classList.contains("hidden")) closeAndResetEntryModal();
    else if (!importPreviewModal.classList.contains("hidden")) closeImportPreview();
    else if (!importExportModal.classList.contains("hidden")) closeImportExportModal();
    else if (!settingsModal.classList.contains("hidden")) closeSettingsModal();
  });

  observationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = observationInput.value.trim();
    if (!text || !currentModalCode) return;
    if (!observations[currentModalCode]) observations[currentModalCode] = [];
    observations[currentModalCode].push(text);
    saveObservations();
    queueCloudPush();
    observationInput.value = "";
    modalObservations.innerHTML = renderModalObservations(currentModalCode);
  });

  modalObservations.addEventListener("click", (e) => {
    const btn = e.target.closest(".obs-delete");
    if (!btn || !currentModalCode) return;
    observations[currentModalCode].splice(Number(btn.dataset.index), 1);
    saveObservations();
    queueCloudPush();
    modalObservations.innerHTML = renderModalObservations(currentModalCode);
  });

  // ---------- settings modal ----------
  function openSettingsModal() {
    iconModeToggle.checked = iconMode === "initial";
    relationshipManager.render();
    subCategoryManager.render();
    settingsModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeSettingsModal() {
    settingsModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  settingsBtn.addEventListener("click", openSettingsModal);
  settingsCloseBtn.addEventListener("click", closeSettingsModal);
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettingsModal();
  });

  iconModeToggle.addEventListener("change", () => {
    iconMode = iconModeToggle.checked ? "initial" : "emoji";
    saveIconMode();
    queueCloudPush();
    renderList();
    renderGrid();
  });

  /**
   * Wires up an add/edit/delete UI for a user-editable {id, name}[] list
   * (Relationships or Sub-Categories) that doubles as one of an entry's field values.
   */
  function makeOptionManager({ container, list, entryField, save, refreshDropdown, noun }) {
    function render() {
      container.innerHTML =
        list
          .map(
            (item) => `
        <div class="option-row" data-id="${item.id}">
          <input type="text" class="option-name" value="${escapeHtml(item.name)}" placeholder="Name">
          <button type="button" class="icon-btn danger option-delete" title="Delete ${escapeHtml(noun)}">🗑️</button>
        </div>`
          )
          .join("") || `<p class="settings-empty">No ${noun.toLowerCase()}s yet.</p>`;
    }

    container.addEventListener("change", (e) => {
      if (!e.target.classList.contains("option-name")) return;
      const row = e.target.closest(".option-row");
      if (!row) return;
      const item = list.find((x) => x.id === row.dataset.id);
      if (!item) return;

      const newName = e.target.value.trim();
      if (!newName) { e.target.value = item.name; return; }
      const oldName = item.name;
      if (newName !== oldName) {
        item.name = newName;
        entries.forEach((en) => { if (en[entryField] === oldName) en[entryField] = newName; });
        saveEntries();
        renderList();
        renderGrid();
        refreshDropdown();
      }
      save();
      queueCloudPush();
    });

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".option-delete");
      if (!btn) return;
      const item = list.find((x) => x.id === btn.closest(".option-row").dataset.id);
      if (!item) return;

      const usageCount = entries.filter((en) => en[entryField] === item.name).length;
      const msg =
        usageCount > 0
          ? `Delete "${item.name}"? ${usageCount} entr${usageCount === 1 ? "y uses" : "ies use"} it — ${usageCount === 1 ? "it" : "they"}'ll be left with a blank ${noun.toLowerCase()}.`
          : `Delete "${item.name}"?`;
      if (!confirm(msg)) return;

      list.splice(list.indexOf(item), 1);
      if (usageCount > 0) {
        entries.forEach((en) => { if (en[entryField] === item.name) en[entryField] = ""; });
        saveEntries();
        renderList();
        renderGrid();
      }
      save();
      queueCloudPush();
      refreshDropdown();
      render();
    });

    return { render };
  }

  const relationshipManager = makeOptionManager({
    container: relationshipEditor,
    list: relationships,
    entryField: "relationship",
    save: saveRelationships,
    refreshDropdown: populateRelationshipDropdown,
    noun: "Relationship",
  });

  const subCategoryManager = makeOptionManager({
    container: subCategoryEditor,
    list: subCategories,
    entryField: "subCategory",
    save: saveSubCategories,
    refreshDropdown: populateSubCategoryDropdown,
    noun: "Sub-Category",
  });

  addRelationshipBtn.addEventListener("click", () => {
    relationships.push({ id: uid(), name: "New Relationship" });
    saveRelationships();
    queueCloudPush();
    populateRelationshipDropdown();
    relationshipManager.render();
  });

  addSubCategoryBtn.addEventListener("click", () => {
    subCategories.push({ id: uid(), name: "New Sub-Category" });
    saveSubCategories();
    queueCloudPush();
    populateSubCategoryDropdown();
    subCategoryManager.render();
  });

  // ---------- toast ----------
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 2200);
  }

  // ---------- boot ----------
  // Recover any relationship/subCategory catalog entries this device's entries
  // still reference but the catalog itself is missing (see reconcileOptionCatalogs).
  reconcileOptionCatalogs();
  populateMbtiDropdown();
  populateRelationshipDropdown();
  populateSubCategoryDropdown();
  renderList();
  renderGrid();

  initCloudSync({ getState: getCloudState, setState: applyCloudState });
})();
