import "./style.css";

// ==========================================
// ELEMENTS
// ==========================================

const editor = document.getElementById("text-editor");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const historyCount = document.getElementById("history-count");
const saveBtn = document.getElementById("save-btn");
const addDocumentBtn = document.getElementById("add-document-btn");
const documentTitle = document.getElementById("document-title");
const sidebarNav = document.querySelector(".sidebar-nav");
const exportBtn = document.getElementById("export-btn") || document.querySelector(".btn-secondary");
const sidebar = document.getElementById("sidebar");
const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
const headerSidebarToggleBtn = document.getElementById("header-sidebar-toggle-btn");
const brandLink = document.getElementById("brand-link");

// Toolbar elements
const textStyleBtn = document.getElementById("text-style-btn");
const textStyleMenu = document.getElementById("text-style-menu");
const boldBtn = document.getElementById("bold-btn");
const underlineBtn = document.getElementById("underline-btn");
const alignLeftBtn = document.getElementById("align-left-btn");
const alignCenterBtn = document.getElementById("align-center-btn");
const alignRightBtn = document.getElementById("align-right-btn");
const colorBtn = document.getElementById("color-btn");
const colorMenu = document.getElementById("color-menu");
const clearFormattingBtn = document.getElementById("clear-formatting-btn");

// Action bar elements
const deleteDocBtn = document.getElementById("delete-doc-btn");
const emojiBtn = document.getElementById("emoji-btn");
const emojiMenu = document.getElementById("emoji-menu");
const linkBtn = document.getElementById("link-btn");
const downloadBtn = document.getElementById("download-btn");
const moreOptionsBtn = document.getElementById("more-options-btn");
const moreOptionsMenu = document.getElementById("more-options-menu");
const optWordCount = document.getElementById("opt-word-count");
const optSelectAll = document.getElementById("opt-select-all");
const optClearAll = document.getElementById("opt-clear-all");
const saveStatusText = document.getElementById("save-status-text");

// Toast elements
const systemToast = document.getElementById("system-toast");
const toastTitle = document.getElementById("toast-title");
const toastMessage = document.getElementById("toast-message");
const themeToggleBtn = document.getElementById("theme-toggle-btn");

// ==========================================
// DESTRUCTION SYSTEM
// ==========================================

const app = document.getElementById("app");
const footer = document.querySelector(".app-footer");
const finalState = document.getElementById("final-state");
const redoWebsiteLink = document.getElementById("redo-website");

const footerRight = document.querySelector(".footer-right");
const footerCenter = document.querySelector(".footer-center");
const footerLeft = document.querySelector(".footer-left");

let destructionStage = 0;
let destructionHistory = [];

// ==========================================
// SYSTEM UNDO PERSISTENCE
// ==========================================

const SYSTEM_UNDO_KEY = "undo_app_system_undo_v1";

function saveDestructionState() {
  try {
    localStorage.setItem(
      SYSTEM_UNDO_KEY,
      JSON.stringify({
        stage: destructionStage,
        history: destructionHistory,
      })
    );
  } catch (e) {
    console.error("Failed to save system undo state", e);
  }
}

function clearDestructionState() {
  try {
    localStorage.removeItem(SYSTEM_UNDO_KEY);
  } catch (e) {
    console.error("Failed to clear system undo state", e);
  }
}

function reapplyDestructionState() {
  try {
    const raw = localStorage.getItem(SYSTEM_UNDO_KEY);
    if (!raw) return false;

    const saved = JSON.parse(raw);
    if (typeof saved.stage !== "number" || saved.stage <= 0) return false;

    destructionStage = saved.stage;
    destructionHistory = Array.isArray(saved.history)
      ? saved.history.filter((i) => typeof i === "number")
      : Array.from({ length: saved.stage }, (_, i) => i);

    // Silently re-apply every destroyed stage (no toasts / animations).
    for (let i = 0; i < destructionStage; i++) {
      destructionStages[i].destroy();
    }

    updateSystemStatus();
    updateHistoryUI();

    return true;
  } catch (e) {
    console.error("Failed to reapply destruction state", e);
    return false;
  }
}

function hideElement(el) {
  if (!el) return;
  el.classList.add("glitch");
  setTimeout(() => {
    el.dataset.destroyed = "true";
    el.classList.add("destroyed-element");
    el.classList.remove("glitch");

    // Also apply inline styles so hiding works even after CSS is removed.
    el.style.opacity = "0";
    el.style.display = "none";
  }, 220);
}

function showElement(el) {
  if (!el) return;
  el.classList.remove("destroyed-element", "glitch");
  el.removeAttribute("data-destroyed");

  // Clear inline hiding styles.
  el.style.opacity = "";
  el.style.display = "";
}

// Removed/disabled stylesheet nodes, held so they can be restored on redo.
let savedStyleNodes = [];

function removeAllStyles() {
  const styleNodes = [
    ...document.querySelectorAll('link[rel="stylesheet"]'),
    ...document.querySelectorAll("style"),
  ];

  if (styleNodes.length === 0) {
    // Fallback guard: if nothing found, no-op.
    return;
  }

  savedStyleNodes = styleNodes;

  styleNodes.forEach((node) => {
    if (node instanceof HTMLStyleElement) {
      // Keep reference but strip contents so layout resets to raw HTML.
      node.dataset.savedHtml = node.textContent;
      node.textContent = "";
    } else if (node instanceof HTMLLinkElement) {
      node.disabled = true;
    }
  });
}

function restoreAllStyles() {
  savedStyleNodes.forEach((node) => {
    if (node instanceof HTMLStyleElement) {
      if (node.dataset.savedHtml !== undefined) {
        node.textContent = node.dataset.savedHtml;
        delete node.dataset.savedHtml;
      } else {
        // Fallback: remove any inherited browser-ish state (no-op).
      }
    } else if (node instanceof HTMLLinkElement) {
      node.disabled = false;
    }
  });

  savedStyleNodes = [];
}

const destructionStages = [
  // ═══════════════════════════════════════════════
  //  STAGE 1 — FOOTER
  // ═══════════════════════════════════════════════

  {
    name: "Footer: Privacy",
    destroy() { hideElement(footerRight?.querySelector("a:nth-child(1)")); },
    restore() { showElement(footerRight?.querySelector("a:nth-child(1)")); },
    message: "Privacy policy has been undone.",
  },
  {
    name: "Footer: Terms",
    destroy() { hideElement(footerRight?.querySelector("a:nth-child(2)")); },
    restore() { showElement(footerRight?.querySelector("a:nth-child(2)")); },
    message: "Terms of service have been undone.",
  },
  {
    name: "Footer: GitHub",
    destroy() { hideElement(footerRight?.querySelector("a:nth-child(3)")); },
    restore() { showElement(footerRight?.querySelector("a:nth-child(3)")); },
    message: "GitHub link has been undone.",
  },
  {
    name: "Footer: Status",
    destroy() { hideElement(footerCenter); },
    restore() { showElement(footerCenter); },
    message: "Footer status removed.",
  },
  {
    name: "Footer",
    destroy() {
      hideElement(footerLeft);
      setTimeout(() => hideElement(footer), 100);
    },
    restore() {
      showElement(footer);
      showElement(footerLeft);
    },
    message: "The footer has been undone.",
  },

  // ═══════════════════════════════════════════════
  //  STAGE 2 — SIDEBAR
  // ═══════════════════════════════════════════════

  {
    name: "Sidebar: Storage",
    destroy() {
      hideElement(document.querySelector(".sidebar-bottom"));
    },
    restore() {
      showElement(document.querySelector(".sidebar-bottom"));
    },
    message: "Storage indicator removed.",
  },
  {
    name: "Sidebar: Add Document",
    destroy() { hideElement(addDocumentBtn); },
    restore() { showElement(addDocumentBtn); },
    message: "Add Document removed.",
  },
  {
    name: "Sidebar: Document List",
    destroy() { hideElement(sidebarNav); },
    restore() { showElement(sidebarNav); },
    message: "Document list has been undone.",
  },
  {
    name: "Sidebar: Header",
    destroy() { hideElement(document.querySelector(".sidebar-header")); },
    restore() { showElement(document.querySelector(".sidebar-header")); },
    message: "Sidebar header removed.",
  },
  {
    name: "Sidebar",
    destroy() { hideElement(sidebar); },
    restore() {
      showElement(sidebar);
      sidebar.classList.remove("collapsed");
      headerSidebarToggleBtn.style.display = "none";
      sidebarToggleBtn.style.display = "";
    },
    message: "The sidebar has been undone.",
  },

  // ═══════════════════════════════════════════════
  //  STAGE 3 — EDITOR BOTTOM ACTION BAR
  // ═══════════════════════════════════════════════

  {
    name: "Actions: More Options",
    destroy() {
      const wrap = document.querySelector("#more-options-btn")?.closest(".action-dropdown");
      hideElement(wrap);
    },
    restore() {
      const wrap = document.querySelector("#more-options-btn")?.closest(".action-dropdown");
      showElement(wrap);
    },
    message: "More options removed.",
  },
  {
    name: "Actions: Download",
    destroy() { hideElement(downloadBtn); },
    restore() { showElement(downloadBtn); },
    message: "Download removed.",
  },
  {
    name: "Actions: Link",
    destroy() { hideElement(linkBtn); },
    restore() { showElement(linkBtn); },
    message: "Link button removed.",
  },
  {
    name: "Actions: Emoji",
    destroy() {
      const wrap = document.querySelector("#emoji-btn")?.closest(".action-dropdown");
      hideElement(wrap);
    },
    restore() {
      const wrap = document.querySelector("#emoji-btn")?.closest(".action-dropdown");
      showElement(wrap);
    },
    message: "Emoji picker removed.",
  },
  {
    name: "Actions: Delete",
    destroy() { hideElement(deleteDocBtn); },
    restore() { showElement(deleteDocBtn); },
    message: "Delete button removed.",
  },
  {
    name: "Actions: Save",
    destroy() { hideElement(saveBtn); },
    restore() { showElement(saveBtn); },
    message: "Save has been undone.",
  },

  // ═══════════════════════════════════════════════
  //  STAGE 4 — EDITOR TOOLBAR
  // ═══════════════════════════════════════════════

  {
    name: "Toolbar: Color",
    destroy() {
      const wrap = document.querySelector("#color-btn")?.closest(".toolbar-dropdown");
      hideElement(wrap);
    },
    restore() {
      const wrap = document.querySelector("#color-btn")?.closest(".toolbar-dropdown");
      showElement(wrap);
    },
    message: "Color picker removed.",
  },
  {
    name: "Toolbar: Alignment",
    destroy() {
      [alignLeftBtn, alignCenterBtn, alignRightBtn].forEach((b, i) => {
        setTimeout(() => hideElement(b), i * 60);
      });
    },
    restore() {
      [alignLeftBtn, alignCenterBtn, alignRightBtn].forEach(showElement);
    },
    message: "Alignment controls removed.",
  },
  {
    name: "Toolbar: Clear Formatting",
    destroy() { hideElement(clearFormattingBtn); },
    restore() { showElement(clearFormattingBtn); },
    message: "Clear formatting removed.",
  },
  {
    name: "Toolbar: Underline",
    destroy() { hideElement(underlineBtn); },
    restore() { showElement(underlineBtn); },
    message: "Underline removed.",
  },
  {
    name: "Toolbar: Bold",
    destroy() { hideElement(boldBtn); },
    restore() { showElement(boldBtn); },
    message: "Bold removed.",
  },
  {
    name: "Toolbar: Text Style",
    destroy() {
      const wrap = document.querySelector("#text-style-btn")?.closest(".toolbar-dropdown");
      hideElement(wrap);
    },
    restore() {
      const wrap = document.querySelector("#text-style-btn")?.closest(".toolbar-dropdown");
      showElement(wrap);
    },
    message: "Text style removed. Formatting controls gone.",
  },

  // ═══════════════════════════════════════════════
  //  STAGE 5 — EDITOR
  // ═══════════════════════════════════════════════

  {
    name: "Editor: Text Content",
    destroy() { hideElement(document.querySelector(".editor-content")); },
    restore() { showElement(document.querySelector(".editor-content")); },
    message: "Text content has been undone.",
  },
  {
    name: "Editor: Container",
    destroy() { hideElement(document.querySelector(".editor-container")); },
    restore() { showElement(document.querySelector(".editor-container")); },
    message: "Editor container removed.",
  },
  {
    name: "Editor",
    destroy() { hideElement(document.getElementById("editor-card")); },
    restore() { showElement(document.getElementById("editor-card")); },
    message: "The editor has been undone.",
  },

  // ═══════════════════════════════════════════════
  //  STAGE 6 — NAVBAR
  // ═══════════════════════════════════════════════

  {
    name: "Navbar: Export",
    destroy() { hideElement(exportBtn); },
    restore() { showElement(exportBtn); },
    message: "Export removed.",
  },
  {
    name: "Navbar: Theme Toggle",
    destroy() { hideElement(themeToggleBtn); },
    restore() { showElement(themeToggleBtn); },
    message: "Theme toggle removed.",
  },
  {
    name: "Navbar: Save Status",
    destroy() { hideElement(document.querySelector(".save-status")); },
    restore() { showElement(document.querySelector(".save-status")); },
    message: "Save status removed.",
  },
  {
    name: "Navbar: Document Title",
    destroy() {
      hideElement(document.getElementById("document-title"));
      hideElement(document.querySelector(".document-info"));
    },
    restore() {
      showElement(document.querySelector(".document-info"));
      showElement(document.getElementById("document-title"));
    },
    message: "Document title removed.",
  },
  {
    name: "Navbar: System Status",
    destroy() { hideElement(document.getElementById("system-status")); },
    restore() { showElement(document.getElementById("system-status")); },
    message: "System status removed.",
  },
  {
    name: "Navbar: Branding",
    destroy() { hideElement(brandLink); },
    restore() { showElement(brandLink); },
    message: "Texto branding removed.",
  },
  {
    name: "Header",
    destroy() {
      hideElement(document.getElementById("app-header"));
      hideElement(sidebarToggleBtn);
    },
    restore() {
      showElement(document.getElementById("app-header"));
      showElement(sidebarToggleBtn);
    },
    message: "Header has been undone.",
  },

  // ═══════════════════════════════════════════════
  //  STAGE 7 — UNDO CONTROLS
  // ═══════════════════════════════════════════════

  {
    name: "Undo: History Counter",
    destroy() { hideElement(document.querySelector(".history-counter")); },
    restore() { showElement(document.querySelector(".history-counter")); },
    message: "History counter removed.",
  },
  {
    name: "Undo: Redo Button",
    destroy() { hideElement(redoBtn); },
    restore() { showElement(redoBtn); },
    message: "Redo button removed.",
  },
  {
    name: "Undo: Undo Button",
    destroy() {
      if (undoBtn) undoBtn.classList.add("unstable-undo");
      setTimeout(() => hideElement(undoBtn), 400);
    },
    restore() {
      showElement(undoBtn);
      if (undoBtn) undoBtn.classList.remove("unstable-undo");
    },
    message: "UNDO BUTTON UNSTABLE",
  },

  // ═══════════════════════════════════════════════
  //  STAGE 8 — FINAL 404
  // ═══════════════════════════════════════════════

  {
    name: "Stylesheet",
    destroy() { removeAllStyles(); },
    restore() { restoreAllStyles(); },
    message: "The stylesheet has been undone. Raw HTML remains.",
  },
  {
    name: "Final State",
    destroy() {
      if (app) {
        app.classList.add("glitch");
        setTimeout(() => {
          app.classList.add("destroyed-element-collapsed");
          app.classList.remove("glitch");
        }, 220);
      }
      setTimeout(() => {
        if (undoBtn) undoBtn.classList.remove("unstable-undo");
        if (finalState) finalState.classList.add("visible");
      }, 300);
    },
    restore() {
      if (finalState) finalState.classList.remove("visible");
      if (app) app.classList.remove("destroyed-element-collapsed", "glitch");
    },
    message: "404 — THIS WEBSITE HAS BEEN UNDONE",
  },
];


// ==========================================
// DOCUMENTS & LOCAL STORAGE
// ==========================================

const STORAGE_KEY = "undo_app_docs_v1";

function loadSavedDocuments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.documents) && parsed.documents.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load documents", e);
  }
  return null;
}

const initialSaved = loadSavedDocuments();

const documents = initialSaved ? initialSaved.documents : [
  {
    id: 1,
    name: "Document1",
    content: editor ? editor.innerHTML : "<h1>Welcome to texto</h1><p>Start writing something here.</p>",
  },
];

let activeDocumentId = initialSaved ? initialSaved.activeDocumentId || 1 : 1;
let nextDocumentId = initialSaved ? initialSaved.nextDocumentId || 2 : 2;

function persistDocuments() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        documents,
        activeDocumentId,
        nextDocumentId,
      })
    );
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

// ==========================================
// CARET & SELECTION HELPERS
// ==========================================

function getCaretOffset(element) {
  let caretOffset = 0;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (element.contains(range.commonAncestorContainer)) {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
  }
  return caretOffset;
}

function setCaretOffset(element, offset) {
  if (offset < 0) return;
  element.focus();
  const sel = window.getSelection();
  if (!sel) return;

  let charCount = 0;
  const range = document.createRange();
  range.setStart(element, 0);
  range.collapse(true);

  const nodeStack = [element];
  let node;
  let found = false;

  while (!found && (node = nodeStack.pop())) {
    if (node.nodeType === 3) {
      const nextCharCount = charCount + node.length;
      if (offset >= charCount && offset <= nextCharCount) {
        range.setStart(node, offset - charCount);
        range.setEnd(node, offset - charCount);
        found = true;
      }
      charCount = nextCharCount;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  if (found) {
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    try {
      range.selectNodeContents(element);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}
  }
}

// ==========================================
// USER HISTORY (UNDO / REDO ENGINE)
// ==========================================

const history = [];
const redoHistory = [];
let saveStateTimeout = null;
let isTyping = false;

function captureSnapshot() {
  return {
    html: editor.innerHTML,
    caret: getCaretOffset(editor),
  };
}

function saveState() {
  const snapshot = captureSnapshot();

  if (history.length > 0) {
    const lastSnapshot = history[history.length - 1];
    if (lastSnapshot.html === snapshot.html) {
      return;
    }
  }

  history.push(snapshot);
  redoHistory.length = 0;
  updateHistoryUI();
}

function flushPendingState() {
  if (saveStateTimeout) {
    clearTimeout(saveStateTimeout);
    saveStateTimeout = null;
  }
  saveState();
  isTyping = false;
}

function undo() {
  flushPendingState();

  // Normal editor undo
  if (history.length > 1) {
    const currentState = history.pop();

    redoHistory.push(currentState);

    const previousState = history[history.length - 1];

    editor.innerHTML = previousState.html;
    editor.focus();

    setCaretOffset(
      editor,
      previousState.caret
    );

    updateActiveDocumentContent();
    updateHistoryUI();
    updateToolbarState();

    return;
  }

  // No editor history left.
  // Start destroying the website.
  destroyNextStage();
}

function redo() {
  // Restore destroyed website first
  if (destructionHistory.length > 0) {
    restorePreviousStage();
    return;
  }

  // Normal editor redo
  if (redoHistory.length === 0) {
    return;
  }

  const nextState = redoHistory.pop();

  history.push(nextState);

  editor.innerHTML = nextState.html;
  editor.focus();

  setCaretOffset(
    editor,
    nextState.caret
  );

  updateActiveDocumentContent();
  updateHistoryUI();
  updateToolbarState();
}

function updateHistoryUI() {
  const undoSteps = Math.max(history.length - 1, 0);
  const hasDestruction = destructionHistory.length > 0;
  const canDestroy = destructionStage < destructionStages.length;

  if (historyCount) {
    if (hasDestruction) {
      historyCount.textContent = destructionHistory.length;
    } else {
      historyCount.textContent = undoSteps;
    }
  }

  const historyLabel = document.querySelector(".history-counter span:first-child");
  if (historyLabel) {
    historyLabel.textContent = hasDestruction ? "System Undo" : "User History";
  }

  if (undoBtn) undoBtn.disabled = !(undoSteps > 0 || canDestroy);
  if (redoBtn) redoBtn.disabled = !(redoHistory.length > 0 || hasDestruction);
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================

let toastTimeout = null;
function showToast(title, message, duration = 3000) {
  if (!systemToast || !toastTitle || !toastMessage) return;

  toastTitle.textContent = title;
  toastMessage.textContent = message;
  systemToast.classList.add("visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    systemToast.classList.remove("visible");
  }, duration);
}


// ==========================================
// WEBSITE DESTRUCTION ENGINE
// ==========================================

function destroyNextStage() {
  if (destructionStage >= destructionStages.length) {
    return false;
  }

  const stage = destructionStages[destructionStage];

  destructionHistory.push(destructionStage);

  showToast("System Undo", stage.message);

  stage.destroy();

  destructionStage++;

  saveDestructionState();

  updateSystemStatus();
  updateHistoryUI();

  return true;
}

function restorePreviousStage() {
  if (destructionHistory.length === 0) {
    return false;
  }

  const prevStageIdx = destructionHistory.pop();
  const stage = destructionStages[prevStageIdx];

  stage.restore();

  destructionStage = prevStageIdx;

  if (destructionHistory.length === 0) {
    clearDestructionState();
  } else {
    saveDestructionState();
  }

  showToast("System Restored", `${stage.name} restored.`);

  updateSystemStatus();
  updateHistoryUI();

  return true;
}

function restoreAllWebsite() {
  while (destructionHistory.length > 0) {
    const prevStageIdx = destructionHistory.pop();
    destructionStages[prevStageIdx].restore();
  }

  destructionStage = 0;

  clearDestructionState();

  showToast("Website Restored", "All components restored.");
  updateSystemStatus();
  updateHistoryUI();

  // Dramatic reconstruction: animate major components flying back into place.
  reconstructWithAnimations();
}

let reconstructionTimeout = null;

function reconstructWithAnimations() {
  if (reconstructionTimeout) {
    clearTimeout(reconstructionTimeout);
  }

  const components = [
    // [selector, direction]
    [".app-footer", "bottom"],
    [".sidebar", "left"],
    ["#editor-toolbar", "top"],
    ["#editor-card", "center"],
    ["#app-header", "top"],
    ["#undo-indicator", "bottom"],
  ];

  const awayClasses = {
    left: "pose-left",
    right: "pose-right",
    top: "pose-top",
    bottom: "pose-bottom",
    center: "pose-center",
  };

  // Phase 1 — send everything off-screen / hidden so they can fly back in.
  components.forEach(([selector, direction]) => {
    const el = document.querySelector(selector);
    if (!el || !awayClasses[direction]) return;

    el.classList.remove("fly-in-away", "pose-left", "pose-right", "pose-top", "pose-bottom", "pose-center");
    void el.offsetWidth;
    el.classList.add(awayClasses[direction]);
    el.dataset.fly = direction;
  });

  // Phase 2 — fly each component back in, spread across the reconstruction window.
  const startDelay = 600;
  const gap = 1300; // spread over ~9s for 6 components
  components.forEach(([selector, direction], index) => {
    const el = document.querySelector(selector);
    if (!el) return;

    setTimeout(() => {
      el.classList.remove("pose-left", "pose-right", "pose-top", "pose-bottom", "pose-center");
      el.classList.add("fly-in-away");
    }, startDelay + index * gap);
  });

  reconstructionTimeout = setTimeout(() => {
    components.forEach(([selector]) => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.remove("fly-in-away", "pose-left", "pose-right", "pose-top", "pose-bottom", "pose-center");
      delete el.dataset.fly;
    });
  }, startDelay + components.length * gap + 900);
}

// ==========================================
// DESTRUCTION STATUS
// ==========================================

function updateSystemStatus() {
  const statusBadge = document.querySelector(".status-badge");
  const statusText = statusBadge?.querySelector(".status-text");

  if (!statusBadge || !statusText) return;

  statusBadge.classList.remove("status-ready", "status-warning");

  if (destructionStage === 0) {
    statusBadge.classList.add("status-ready");
    statusText.textContent = "Ready";
    return;
  }

  if (destructionStage <= 15) {
    statusBadge.classList.add("status-warning");
    statusText.textContent = "Warning";
    return;
  }

  statusBadge.classList.add("status-warning");
  statusText.textContent = "Unstable";
}

// ==========================================
// UPDATE ACTIVE DOCUMENT
// ==========================================

function updateActiveDocumentContent() {
  const activeDocument = documents.find((item) => item.id === activeDocumentId);
  if (activeDocument) {
    activeDocument.content = editor.innerHTML;
  }
}

// ==========================================
// RENDER DOCUMENTS
// ==========================================

function renderDocuments() {
  if (!sidebarNav) return;
  sidebarNav.innerHTML = "";

  documents.forEach((item) => {
    const documentItem = document.createElement("a");
    documentItem.href = "#";
    documentItem.className = "sidebar-item";

    if (item.id === activeDocumentId) {
      documentItem.classList.add("active");
    }

    documentItem.innerHTML = `
      <span class="sidebar-icon">▤</span>
      <span>${item.name}</span>
    `;

    documentItem.addEventListener("click", (event) => {
      event.preventDefault();
      switchDocument(item.id);
    });

    sidebarNav.appendChild(documentItem);
  });
}

// ==========================================
// SWITCH DOCUMENT
// ==========================================

function switchDocument(documentId) {
  if (documentId === activeDocumentId) {
    return;
  }

  updateActiveDocumentContent();

  const selectedDocument = documents.find((item) => item.id === documentId);
  if (!selectedDocument) {
    return;
  }

  activeDocumentId = documentId;
  editor.innerHTML = selectedDocument.content;

  if (documentTitle) {
    documentTitle.value = `${selectedDocument.name}.txt`;
  }

  history.length = 0;
  redoHistory.length = 0;

  saveState();
  renderDocuments();
  updateToolbarState();
  editor.focus();
  persistDocuments();
}

// ==========================================
// ADD DOCUMENT BUTTON
// ==========================================

if (addDocumentBtn) {
  addDocumentBtn.addEventListener("click", () => {
    updateActiveDocumentContent();

    const newDocument = {
      id: nextDocumentId,
      name: `Document${nextDocumentId}`,
      content: `<h1>Document${nextDocumentId}</h1><p>Start writing here...</p>`,
    };

    documents.push(newDocument);
    activeDocumentId = newDocument.id;
    nextDocumentId++;

    editor.innerHTML = newDocument.content;
    if (documentTitle) {
      documentTitle.value = `${newDocument.name}.txt`;
    }

    history.length = 0;
    redoHistory.length = 0;

    saveState();
    renderDocuments();
    updateToolbarState();
    editor.focus();
    persistDocuments();

    showToast("New Document", `Created ${newDocument.name}`);
  });
}

// ==========================================
// SIDEBAR COLLAPSE / EXPAND BUTTONS
// ==========================================

if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener("click", () => {
    if (sidebar) {
      sidebar.classList.add("collapsed");
    }
    if (headerSidebarToggleBtn) {
      headerSidebarToggleBtn.style.display = "grid";
    }
  });
}

if (headerSidebarToggleBtn) {
  headerSidebarToggleBtn.addEventListener("click", () => {
    if (sidebar) {
      sidebar.classList.remove("collapsed");
    }
    headerSidebarToggleBtn.style.display = "none";
  });
}

if (brandLink) {
  brandLink.addEventListener("click", (e) => e.preventDefault());
}

// ==========================================
// DOCUMENT TITLE INPUT
// ==========================================

if (documentTitle) {
  documentTitle.addEventListener("input", () => {
    const activeDocument = documents.find((item) => item.id === activeDocumentId);
    if (!activeDocument) return;

    let newName = documentTitle.value.replace(/\.txt$/i, "").trim();
    if (newName === "") {
      newName = `Document${activeDocument.id}`;
    }

    activeDocument.name = newName;
    renderDocuments();
    persistDocuments();
  });
}

// ==========================================
// EDITOR INPUT & REAL-TIME HISTORY CAPTURE
// ==========================================

let typingCharCount = 0;

editor.addEventListener("beforeinput", () => {
  if (!isTyping) {
    isTyping = true;
    saveState();
  }
});

editor.addEventListener("input", (e) => {
  updateActiveDocumentContent();
  clearTimeout(saveStateTimeout);

  const inputType = e.inputType || "";
  const data = e.data || "";

  // 1. Immediate save on Enter, Space, Punctuation, Delete, or Paste
  if (
    inputType === "insertParagraph" ||
    inputType === "insertLineBreak" ||
    data === " " ||
    /[.,!?;:\-–—\(\)\[\]"'/\\]/.test(data) ||
    inputType.startsWith("delete") ||
    inputType.startsWith("insertFromPaste")
  ) {
    saveState();
    persistDocuments();
    typingCharCount = 0;
    isTyping = false;
    return;
  }

  // 2. Continuous rapid typing: commit snapshot every 5 characters
  typingCharCount++;
  if (typingCharCount >= 5) {
    saveState();
    persistDocuments();
    typingCharCount = 0;
    return;
  }

  // 3. Short pause fallback debounce (250ms)
  saveStateTimeout = setTimeout(() => {
    saveState();
    persistDocuments();
    typingCharCount = 0;
    isTyping = false;
  }, 250);
});

// ==========================================
// TOOLBAR ACTIVE STATE UPDATE
// ==========================================

function updateToolbarState() {
  if (boldBtn) {
    boldBtn.classList.toggle("active", document.queryCommandState("bold"));
  }
  if (underlineBtn) {
    underlineBtn.classList.toggle("active", document.queryCommandState("underline"));
  }
  if (alignLeftBtn) {
    alignLeftBtn.classList.toggle("active", document.queryCommandState("justifyLeft"));
  }
  if (alignCenterBtn) {
    alignCenterBtn.classList.toggle("active", document.queryCommandState("justifyCenter"));
  }
  if (alignRightBtn) {
    alignRightBtn.classList.toggle("active", document.queryCommandState("justifyRight"));
  }

  const selection = window.getSelection();
  let currentBlockTag = "P";

  if (selection && selection.rangeCount > 0) {
    let node = selection.anchorNode;
    while (node && node !== editor) {
      if (["H1", "H2", "H3", "PRE", "P"].includes(node.nodeName)) {
        currentBlockTag = node.nodeName;
      }
      node = node.parentNode;
    }
  }

  if (textStyleBtn) {
    const labels = {
      P: "T",
      H1: "H1",
      H2: "H2",
      H3: "H3",
      PRE: "Code",
    };
    textStyleBtn.textContent = labels[currentBlockTag] || "T";
  }
}

document.addEventListener("selectionchange", () => {
  if (document.activeElement === editor) {
    updateToolbarState();
  }
});
editor.addEventListener("keyup", updateToolbarState);
editor.addEventListener("mouseup", updateToolbarState);

// ==========================================
// PREVENT SELECTION LOSS ON TOOLBAR & UNDO BTNS
// ==========================================

const allToolbarBtns = document.querySelectorAll(".toolbar-btn, .action-btn, .undo-action-btn");
allToolbarBtns.forEach((btn) => {
  btn.addEventListener("mousedown", (e) => {
    if (btn.tagName === "BUTTON") {
      e.preventDefault();
    }
  });
});

// ==========================================
// TEXT STYLE DROPDOWN
// ==========================================

function applyTextStyle(style) {
  saveState();
  editor.focus();
  document.execCommand("formatBlock", false, `<${style}>`);
  saveState();
  updateActiveDocumentContent();
  updateToolbarState();
}

if (textStyleBtn && textStyleMenu) {
  textStyleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAllMenus();
    textStyleMenu.classList.toggle("show");
  });

  textStyleMenu.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const style = button.dataset.style;
      applyTextStyle(style);
      textStyleMenu.classList.remove("show");
    });
  });
}

// ==========================================
// BOLD & UNDERLINE BUTTONS
// ==========================================

if (boldBtn) {
  boldBtn.addEventListener("click", () => {
    saveState();
    editor.focus();
    document.execCommand("bold");
    saveState();
    updateActiveDocumentContent();
    updateToolbarState();
  });
}

if (underlineBtn) {
  underlineBtn.addEventListener("click", () => {
    saveState();
    editor.focus();
    document.execCommand("underline");
    saveState();
    updateActiveDocumentContent();
    updateToolbarState();
  });
}

// ==========================================
// ALIGNMENT BUTTONS
// ==========================================

if (alignLeftBtn) {
  alignLeftBtn.addEventListener("click", () => {
    saveState();
    editor.focus();
    document.execCommand("justifyLeft");
    saveState();
    updateActiveDocumentContent();
    updateToolbarState();
  });
}

if (alignCenterBtn) {
  alignCenterBtn.addEventListener("click", () => {
    saveState();
    editor.focus();
    document.execCommand("justifyCenter");
    saveState();
    updateActiveDocumentContent();
    updateToolbarState();
  });
}

if (alignRightBtn) {
  alignRightBtn.addEventListener("click", () => {
    saveState();
    editor.focus();
    document.execCommand("justifyRight");
    saveState();
    updateActiveDocumentContent();
    updateToolbarState();
  });
}

// ==========================================
// COLOR BUTTON & DROPDOWN
// ==========================================

if (colorBtn && colorMenu) {
  colorBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAllMenus();
    colorMenu.classList.toggle("show");
  });

  colorMenu.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      saveState();
      editor.focus();
      const color = button.dataset.color;
      document.execCommand("foreColor", false, color);

      const colorDot = colorBtn.querySelector(".color-dot");
      if (colorDot) {
        colorDot.style.background = color;
      }

      saveState();
      updateActiveDocumentContent();
      colorMenu.classList.remove("show");
    });
  });
}

// ==========================================
// CLEAR FORMATTING
// ==========================================

if (clearFormattingBtn) {
  clearFormattingBtn.addEventListener("click", () => {
    saveState();
    editor.focus();
    document.execCommand("removeFormat");
    document.execCommand("formatBlock", false, "<p>");
    saveState();
    updateActiveDocumentContent();
    updateToolbarState();
  });
}

// ==========================================
// BOTTOM ACTION BAR BUTTONS
// ==========================================

// DELETE DOCUMENT BUTTON
if (deleteDocBtn) {
  deleteDocBtn.addEventListener("click", () => {
    if (documents.length > 1) {
      const index = documents.findIndex((doc) => doc.id === activeDocumentId);
      if (index !== -1) {
        const deletedName = documents[index].name;
        documents.splice(index, 1);
        const nextDoc = documents[Math.max(0, index - 1)];
        activeDocumentId = nextDoc.id;

        editor.innerHTML = nextDoc.content;
        if (documentTitle) documentTitle.value = `${nextDoc.name}.txt`;

        history.length = 0;
        redoHistory.length = 0;
        saveState();
        renderDocuments();
        persistDocuments();

        showToast("Document Deleted", `Deleted ${deletedName}. Switched to ${nextDoc.name}`);
      }
    } else {
      const activeDoc = documents[0];
      activeDoc.name = "Document1";
      activeDoc.content = "<h1>Document1</h1><p></p>";
      editor.innerHTML = activeDoc.content;
      if (documentTitle) documentTitle.value = "Document1.txt";

      history.length = 0;
      redoHistory.length = 0;
      saveState();
      renderDocuments();
      persistDocuments();

      showToast("Document Reset", "Content has been cleared.");
    }
    editor.focus();
  });
}

// EMOJI BUTTON & DROPDOWN
if (emojiBtn && emojiMenu) {
  emojiBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAllMenus();
    emojiMenu.classList.toggle("show");
  });

  emojiMenu.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      saveState();
      editor.focus();
      const emoji = button.textContent.trim();
      document.execCommand("insertText", false, emoji);

      saveState();
      updateActiveDocumentContent();
      emojiMenu.classList.remove("show");
    });
  });
}

// LINK BUTTON
if (linkBtn) {
  linkBtn.addEventListener("click", () => {
    editor.focus();
    const url = prompt("Enter URL:", "https://");
    if (url && url.trim() !== "" && url !== "https://") {
      saveState();
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        document.execCommand("createLink", false, url);
      } else {
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        document.execCommand("insertHTML", false, linkHtml);
      }
      saveState();
      updateActiveDocumentContent();
    }
  });
}

// DOWNLOAD BUTTON
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const textContent = editor.innerText || editor.textContent || "";
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    let fileName = documentTitle ? documentTitle.value.trim() : "Document1.txt";
    if (!fileName.endsWith(".txt")) fileName += ".txt";

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Downloaded", `Saved ${fileName} to disk`);
  });
}

// MORE OPTIONS BUTTON & DROPDOWN
if (moreOptionsBtn && moreOptionsMenu) {
  moreOptionsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAllMenus();
    moreOptionsMenu.classList.toggle("show");
  });
}

if (optWordCount) {
  optWordCount.addEventListener("click", () => {
    const text = editor.innerText || editor.textContent || "";
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = cleanText.length;
    showToast("Word Count", `${words} words, ${chars} characters`);
    if (moreOptionsMenu) moreOptionsMenu.classList.remove("show");
  });
}

if (optSelectAll) {
  optSelectAll.addEventListener("click", () => {
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    if (moreOptionsMenu) moreOptionsMenu.classList.remove("show");
  });
}

if (optClearAll) {
  optClearAll.addEventListener("click", () => {
    saveState();
    editor.focus();
    editor.innerHTML = "<p><br></p>";
    saveState();
    updateActiveDocumentContent();
    showToast("Content Cleared", "Editor is now empty.");
    if (moreOptionsMenu) moreOptionsMenu.classList.remove("show");
  });
}

// ==========================================
// CLOSE ALL MENUS
// ==========================================

function closeAllMenus() {
  if (textStyleMenu) textStyleMenu.classList.remove("show");
  if (colorMenu) colorMenu.classList.remove("show");
  if (emojiMenu) emojiMenu.classList.remove("show");
  if (moreOptionsMenu) moreOptionsMenu.classList.remove("show");
}

document.addEventListener("click", () => {
  closeAllMenus();
});

// ==========================================
// UNDO & REDO BUTTONS
// ==========================================

if (undoBtn) {
  undoBtn.addEventListener("click", () => {
    undo();
  });
}

if (redoBtn) {
  redoBtn.addEventListener("click", () => {
    redo();
  });
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener("keydown", (event) => {
  const modifier = event.ctrlKey || event.metaKey;

  if (!modifier) {
    return;
  }

  // CTRL + Z
  if (event.code === "KeyZ" && !event.shiftKey) {
    event.preventDefault();
    undo();
  }

  // CTRL + SHIFT + Z / CTRL + Y
  if (
    (event.code === "KeyZ" && event.shiftKey) ||
    event.code === "KeyY"
  ) {
    event.preventDefault();
    redo();
  }
});

// ==========================================
// REDO THE WEBSITE — UNDO THE UNDO
// ==========================================

const rebuildOverlay = document.getElementById("rebuild-overlay");
const rebuildText = document.getElementById("rebuild-text");
const rebuildProgress = document.getElementById("rebuild-progress");

const rebuildPhrases = [
  "Undoing the undo...",
  "Gathering lost bytes...",
  "Reassembling the footer...",
  "Rebuilding the sidebar...",
  "Restoring the document list...",
  "Reattaching the toolbar...",
  "Reviving the formatting...",
  "Un-folding the editor...",
  "Restoring your content...",
  "Reconstructing the header...",
  "Rebooting the system status...",
  "Ungluing the undo button...",
  "Polishing the layout...",
  "Almost there...",
  "Done. This time, maybe don't press Ctrl+Z?",
];

const REBUILD_MS = 12000;

function rebuildWebsiteSequence() {
  if (!redoWebsiteLink || !rebuildOverlay) return;

  // Hide the final state, restore the website beneath the overlay,
  // then fade the overlay out after the reconstruction finishes.
  if (finalState) finalState.classList.remove("visible");

  redoWebsiteLink.classList.add("loading");

  restoreAllWebsite();

  rebuildOverlay.classList.remove("fading");
  rebuildOverlay.hidden = false;

  let step = 0;
  const stepMs = REBUILD_MS / rebuildPhrases.length;

  const interval = setInterval(() => {
    step++;
    const progress = Math.min(step / rebuildPhrases.length, 1) * 100;

    if (rebuildProgress) rebuildProgress.style.width = `${progress}%`;

    const phraseIdx = Math.floor((step / rebuildPhrases.length) * rebuildPhrases.length);
    if (rebuildText && rebuildPhrases[phraseIdx]) {
      rebuildText.textContent = rebuildPhrases[phraseIdx];
    }

    if (step >= rebuildPhrases.length) {
      clearInterval(interval);
      finishReconstruction();
    }
  }, stepMs);
}

function finishReconstruction() {
  redoWebsiteLink.classList.remove("loading");

  // Fade the overlay out to reveal the reconstructed website.
  rebuildOverlay.classList.add("fading");

  setTimeout(() => {
    rebuildOverlay.hidden = true;
    rebuildOverlay.classList.remove("fading");
    if (rebuildProgress) rebuildProgress.style.width = "0%";

    updateSystemStatus();
    updateHistoryUI();
  }, 650);
}

if (redoWebsiteLink) {
  redoWebsiteLink.addEventListener("click", (e) => {
    e.preventDefault();
    rebuildWebsiteSequence();
  });
}

// ==========================================
// SAVE BUTTON
// ==========================================

if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    updateActiveDocumentContent();
    persistDocuments();

    saveBtn.textContent = "Saved!";
    if (saveStatusText) saveStatusText.textContent = "Saved to Cloud";

    showToast("Saved", "All changes saved successfully.");

    setTimeout(() => {
      saveBtn.textContent = "Save";
    }, 1500);
  });
}

// ==========================================
// EXPORT CURRENT DOCUMENT AS PDF
// ==========================================

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const activeDocument = documents.find(
      (item) => item.id === activeDocumentId
    );

    if (!activeDocument) {
      return;
    }

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";

    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow.document;

    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeDocument.name}</title>
          <style>
            @page {
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              margin: 0;
            }
            h1, h2, h3 {
              line-height: 1.3;
            }
            img {
              max-width: 100%;
            }
            pre {
              background: #f1f5f9;
              padding: 12px;
              border-radius: 6px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          ${activeDocument.content}
        </body>
      </html>
    `);
    printDocument.close();

    printFrame.onload = () => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();

      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    };
  });
}

// ==========================================
// INITIALIZE
// ==========================================

const initialActiveDoc = documents.find((doc) => doc.id === activeDocumentId) || documents[0];
if (initialActiveDoc) {
  editor.innerHTML = initialActiveDoc.content;
  if (documentTitle) documentTitle.value = `${initialActiveDoc.name}.txt`;
}

renderDocuments();
saveState();
updateHistoryUI();
updateToolbarState();

// Re-apply persisted SYSTEM UNDO destruction state (survives reload).
reapplyDestructionState();

// ==========================================
// DARK MODE
// ==========================================

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark-mode", isDark);

  if (themeToggleBtn) {
    themeToggleBtn.textContent = isDark ? "☀" : "☾";
    themeToggleBtn.title = isDark
      ? "Switch to light mode"
      : "Switch to dark mode";
    themeToggleBtn.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }
}

const savedTheme = localStorage.getItem("undo_app_theme") || "light";
applyTheme(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    const theme = isDark ? "dark" : "light";

    localStorage.setItem("undo_app_theme", theme);
    applyTheme(theme);
  });
}