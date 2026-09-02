(() => {
  "use strict";

  const STORAGE_KEY = "mbtiViewer.entries";
  const DATA_VERSION_KEY = "mbtiViewer.dataVersion";
  const DATA_VERSION = "seed-2026-08-27";

  const DEFAULT_ENTRIES = [
    { status: "AI Confirmed", emoji: "🧍", name: "Josh",     mbti: "ISTJ", gender: "M", relationship: "Coworker",          subCategory: "" },
    { status: "Speculated",   emoji: "🤖", name: "Tony",     mbti: "ISTJ", gender: "M", relationship: "Friend",            subCategory: "JW Post-Covid" },
    { status: "AI Confirmed", emoji: "🦁", name: "Mom",      mbti: "ISTJ", gender: "F", relationship: "Family",            subCategory: "Mother" },
    { status: "Pending",      emoji: "🍜", name: "Tra",      mbti: "ISFJ", gender: "F", relationship: "Family",            subCategory: "In-Law" },
    { status: "Speculated",   emoji: "🍚", name: "Kaileen",  mbti: "ISFJ", gender: "F", relationship: "Friend",            subCategory: "JW Post-Covid" },
    { status: "Pending",      emoji: "🏈", name: "Mathew",   mbti: "INFJ", gender: "M", relationship: "Coworker",          subCategory: "" },
    { status: "Speculated",   emoji: "⚓", name: "Nassau",   mbti: "INFJ", gender: "F", relationship: "Romantic Interest", subCategory: "" },
    { status: "Speculated",   emoji: "🦦", name: "Eric L",   mbti: "INFJ", gender: "M", relationship: "Partner/Ex",        subCategory: "JW Post-Covid" },
    { status: "Pending",      emoji: "🫗", name: "Norberto", mbti: "INFJ", gender: "M", relationship: "Friend",            subCategory: "LatinX" },
    { status: "Confirmed",    emoji: "🔵", name: "Alex",     mbti: "INFJ", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Speculated",   emoji: "🏠", name: "Vianney",  mbti: "INFJ", gender: "F", relationship: "Family",            subCategory: "Sister" },
    { status: "Speculated",   emoji: "🥝", name: "Beatriz",  mbti: "INFJ", gender: "F", relationship: "Romantic Interest", subCategory: "" },
    { status: "AI Confirmed", emoji: "📊", name: "Jamie",    mbti: "INTJ", gender: "F", relationship: "Coworker",          subCategory: "" },
    { status: "Confirmed",    emoji: "🍞", name: "Walter",   mbti: "INTJ", gender: "M", relationship: "Coworker",          subCategory: "" },
    { status: "Confirmed",    emoji: "🌱", name: "Me",       mbti: "INTJ", gender: "M", relationship: "Self",              subCategory: "" },
    { status: "Pending",      emoji: "👃", name: "Brennen",  mbti: "INTJ", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Speculated",   emoji: "🥖", name: "Howard",   mbti: "INTJ", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Rejected",     emoji: "⚡", name: "Jack",     mbti: "INTJ", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Pending",      emoji: "🎹", name: "Justin",   mbti: "INTJ", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Speculated",   emoji: "🐝", name: "Gabi",     mbti: "ISTP", gender: "F", relationship: "Romantic Interest", subCategory: "" },
    { status: "Speculated",   emoji: "🔰", name: "Leo",      mbti: "ISTP", gender: "M", relationship: "Friend",            subCategory: "JW Post-Covid" },
    { status: "Confirmed",    emoji: "🙄", name: "Kelly",    mbti: "ISFP", gender: "F", relationship: "Coworker",          subCategory: "" },
    { status: "Speculated",   emoji: "😁", name: "Heather",  mbti: "ISFP", gender: "F", relationship: "Friend",            subCategory: "JW Pre-Covid" },
    { status: "Speculated",   emoji: "🌻", name: "Zihurave", mbti: "ISFP", gender: "F", relationship: "Friend",            subCategory: "JW Pre-Covid" },
    { status: "Confirmed",    emoji: "🎞️", name: "Kristen",  mbti: "INFP", gender: "F", relationship: "Coworker",          subCategory: "" },
    { status: "Confirmed",    emoji: "🌸", name: "Nita",     mbti: "INFP", gender: "F", relationship: "Partner/Ex",        subCategory: "" },
    { status: "Speculated",   emoji: "⏱️", name: "Froy",     mbti: "INFP", gender: "M", relationship: "Family",            subCategory: "Cousin" },
    { status: "Speculated",   emoji: "👺", name: "Ashlynn",  mbti: "INFP", gender: "F", relationship: "Partner/Ex",        subCategory: "JW Pre-Covid" },
    { status: "Pending",      emoji: "👨‍👩‍👧‍👦", name: "Chris",   mbti: "INFP", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Pending",      emoji: "🫧", name: "Peaktra",  mbti: "INFP", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Pending",      emoji: "💂", name: "Haley",    mbti: "INTP", gender: "F", relationship: "Coworker",          subCategory: "" },
    { status: "Confirmed",    emoji: "🧙‍♂️", name: "Eric P",   mbti: "INTP", gender: "M", relationship: "Coworker",          subCategory: "" },
    { status: "Pending",      emoji: "🤸", name: "Ben",      mbti: "INTP", gender: "M", relationship: "Family",            subCategory: "Brother" },
    { status: "Speculated",   emoji: "🎮", name: "Joel",     mbti: "INTP", gender: "M", relationship: "Friend",            subCategory: "JW Pre-Covid" },
    { status: "Speculated",   emoji: "💪", name: "Alvaro",   mbti: "ESTP", gender: "M", relationship: "Friend",            subCategory: "JW Post-Covid" },
    { status: "Speculated",   emoji: "📶", name: "Alberto",  mbti: "ESFP", gender: "M", relationship: "Friend",            subCategory: "JW Post-Covid" },
    { status: "Confirmed",    emoji: "🌴", name: "Layla",    mbti: "ENFP", gender: "F", relationship: "Coworker",          subCategory: "" },
    { status: "Pending",      emoji: "♟️", name: "Sam",      mbti: "ENFP", gender: "M", relationship: "Friend",            subCategory: "LatinX" },
    { status: "Pending",      emoji: "☁️", name: "Gabe",     mbti: "ENFP", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "Speculated",   emoji: "🐶", name: "Josiah",   mbti: "ENTP", gender: "M", relationship: "Friend",            subCategory: "JW Pre-Covid" },
    { status: "Speculated",   emoji: "🚗", name: "Mario",    mbti: "ESTJ", gender: "M", relationship: "Family",            subCategory: "In-Law" },
    { status: "Pending",      emoji: "✨", name: "Elisa",    mbti: "ESFJ", gender: "F", relationship: "Coworker",          subCategory: "" },
    { status: "Speculated",   emoji: "☕", name: "Alina",    mbti: "ESFJ", gender: "F", relationship: "Friend",            subCategory: "JW Pre-Covid" },
    { status: "AI Confirmed", emoji: "💤", name: "Steven",   mbti: "ESFJ", gender: "M", relationship: "Friend",            subCategory: "JW Pre-Covid" },
    { status: "Speculated",   emoji: "🐺", name: "Blake",    mbti: "ENFJ", gender: "M", relationship: "Friend",            subCategory: "JW Post-Covid" },
    { status: "Confirmed",    emoji: "🐴", name: "Pablo",    mbti: "ENFJ", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
    { status: "AI Confirmed", emoji: "👓", name: "Miguel",   mbti: "ENTJ", gender: "M", relationship: "Friend",            subCategory: "JW Post-Covid" },
    { status: "Confirmed",    emoji: "👁️", name: "Nat",      mbti: "ENTJ", gender: "M", relationship: "Friend",            subCategory: "Rhythm & Con" },
  ];

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

  const STEREOTYPES = {
    ISTJ: ["Rigid", "Methodical", "Boring"],
    ISFJ: ["People Pleasing", "Self Sacrificing", "Nurturing"],
    INFJ: ["Philosophical", "Passionate", "Cautious"],
    INTJ: ["Quiet", "Emotionless", "Strategic"],
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

  /** @type {Array<Object>} */
  let entries = loadEntries();
  let editingId = null;

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

  const searchBox = document.getElementById("searchBox");
  const sortHeaders = document.querySelectorAll(".entry-table th.sortable");
  const entryCount = document.getElementById("entryCount");
  const entryList = document.getElementById("entryList");

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

  // ---------- init ----------
  function populateMbtiDropdown() {
    mbtiField.innerHTML =
      `<option value="">-</option>` +
      MBTI_TYPES.map(
        (t) => `<option value="${t.code}">${t.code} — ${t.name}</option>`
      ).join("");
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

  const GENDER_ORDER = ["M", "F"];
  const STATUS_ORDER = ["Confirmed", "AI Confirmed", "Pending", "Speculated", "Rejected"];
  const RELATIONSHIP_ORDER = ["Partner/Ex", "Romantic Interest", "Friend", "Coworker", "Family", "Self"];
  const SUBCATEGORY_ORDER = [
    "JW Pre-Covid", "JW Post-Covid", "Rhythm & Con", "LatinX",
    "Mother", "Sibling", "Sister", "Brother", "In-Law", "Cousin",
  ];

  function orderIndex(order, value) {
    const i = order.indexOf(value);
    return i === -1 ? Infinity : i; // blank/unrecognized values sort last
  }

  function mbtiIndex(code) {
    const i = MBTI_TYPES.findIndex((t) => t.code === code);
    return i === -1 ? Infinity : i;
  }

  function compareEntries(a, b, key) {
    switch (key) {
      case "mbti":
        return mbtiIndex(a.mbti) - mbtiIndex(b.mbti) || a.name.localeCompare(b.name);
      case "gender":
        return orderIndex(GENDER_ORDER, a.gender) - orderIndex(GENDER_ORDER, b.gender) || a.name.localeCompare(b.name);
      case "status":
        return orderIndex(STATUS_ORDER, a.status) - orderIndex(STATUS_ORDER, b.status) || a.name.localeCompare(b.name);
      case "relationship":
        return orderIndex(RELATIONSHIP_ORDER, a.relationship) - orderIndex(RELATIONSHIP_ORDER, b.relationship) || a.name.localeCompare(b.name);
      case "subCategory":
        return orderIndex(SUBCATEGORY_ORDER, a.subCategory) - orderIndex(SUBCATEGORY_ORDER, b.subCategory) || a.name.localeCompare(b.name);
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

    entryCount.textContent = `${visible.length} / ${entries.length} entries`;
    updateSortIndicators();

    if (visible.length === 0) {
      entryList.innerHTML = `<tr class="empty-row"><td colspan="8">No entries yet. Fill out the form above to add one.</td></tr>`;
      return;
    }

    entryList.innerHTML = visible
      .map((en) => {
        return `
        <tr data-id="${en.id}">
          <td class="cell-emoji">${en.emoji}</td>
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
        html += `<div class="slot filled" data-id="${en.id}" title="${titleParts.join(" — ")}">${en.emoji}</div>`;
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
          <span class="modal-member-emoji">${en.emoji}</span>
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
  });

  observationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = observationInput.value.trim();
    if (!text || !currentModalCode) return;
    if (!observations[currentModalCode]) observations[currentModalCode] = [];
    observations[currentModalCode].push(text);
    saveObservations();
    observationInput.value = "";
    modalObservations.innerHTML = renderModalObservations(currentModalCode);
  });

  modalObservations.addEventListener("click", (e) => {
    const btn = e.target.closest(".obs-delete");
    if (!btn || !currentModalCode) return;
    observations[currentModalCode].splice(Number(btn.dataset.index), 1);
    saveObservations();
    modalObservations.innerHTML = renderModalObservations(currentModalCode);
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
  populateMbtiDropdown();
  renderList();
  renderGrid();
})();
