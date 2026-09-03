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
const appFooter = document.getElementById("app-footer");
const appHeader = document.getElementById("app-header");
const editorCard = document.getElementById("editor-card");
const finalState = document.getElementById("final-state");
const undoIndicator = document.getElementById("undo-indicator");

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

// System undo elements
const systemStatus = document.getElementById("system-status");
const mainContent = document.getElementById("main-content");
const app = document.getElementById("app");

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
    content: editor ? editor.innerHTML : "<h1>Welcome to UndoApp</h1><p>Start writing something here.</p>",
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
let systemUndoStage = 0;
const SYSTEM_UNDO_STAGES = {
  FOOTER: 1,
  SIDEBAR: 2,
  CSS: 3,
  TOOLBAR: 4,
  HEADER: 5,
  EDITOR: 6,
  DONE: 7
};

// System undo toast messages — dramatic!
const SYSTEM_UNDO_MESSAGES = {
  [SYSTEM_UNDO_STAGES.FOOTER]: {
    title: "⚠ System Undo Activated",
    message: "User history exhausted. Undoing footer...",
    type: "warning"
  },
  [SYSTEM_UNDO_STAGES.SIDEBAR]: {
    title: "⚠ System Undo",
    message: "Undoing sidebar...",
    type: "warning"
  },
  [SYSTEM_UNDO_STAGES.CSS]: {
    title: "🔴 CSS CORRUPTED",
    message: "Undoing CSS... Styles are unraveling.",
    type: "danger"
  },
  [SYSTEM_UNDO_STAGES.TOOLBAR]: {
    title: "🔴 CRITICAL",
    message: "Undoing toolbar... Editing functions disabled.",
    type: "danger"
  },
  [SYSTEM_UNDO_STAGES.HEADER]: {
    title: "🔴 CRITICAL",
    message: "Undoing header... Navigation lost.",
    type: "danger"
  },
  [SYSTEM_UNDO_STAGES.EDITOR]: {
    title: "💀 UNDO BUTTON UNSTABLE",
    message: "Undoing editor... There is nothing left.",
    type: "danger"
  },
  [SYSTEM_UNDO_STAGES.DONE]: {
    title: "💀 Website Undone",
    message: "The website has been completely undone.",
    type: "danger"
  }
};

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

  if (history.length > 1) {
    const currentState = history.pop();
    redoHistory.push(currentState);

    const previousState = history[history.length - 1];
    editor.innerHTML = previousState.html;

    editor.focus();
    setCaretOffset(editor, previousState.caret);

    updateActiveDocumentContent();
    updateHistoryUI();
    updateToolbarState();
    return;
  }

  // History exhausted — switch to system undo
  if (systemUndoStage < SYSTEM_UNDO_STAGES.DONE) {
    systemUndoStage++;
    performSystemUndo();
    updateHistoryUI();
  }
}

function shakeScreen() {
  if (app) {
    app.classList.remove("screen-shake");
    void app.offsetWidth; // force reflow
    app.classList.add("screen-shake");
    setTimeout(() => app.classList.remove("screen-shake"), 250);
  }
}

function updateSystemStatus(stage) {
  if (!systemStatus) return;
  systemStatus.classList.remove("status-ready", "status-warning", "status-danger");

  if (stage === 0) {
    systemStatus.classList.add("status-ready");
    systemStatus.innerHTML = '<span class="status-dot"></span> Ready';
  } else if (stage <= 2) {
    systemStatus.classList.add("status-warning");
    systemStatus.innerHTML = '<span class="status-dot"></span> Warning';
  } else {
    systemStatus.classList.add("status-danger");
    systemStatus.innerHTML = '<span class="status-dot"></span> Critical';
  }
}

function updateUndoIndicatorState() {
  if (!undoIndicator) return;
  undoIndicator.classList.remove("warning", "unstable");

  const historyCounter = undoIndicator.querySelector(".history-counter");
  if (historyCounter) {
    historyCounter.classList.remove("warning", "danger");
  }

  if (systemUndoStage > 0 && systemUndoStage < SYSTEM_UNDO_STAGES.DONE) {
    if (systemUndoStage >= SYSTEM_UNDO_STAGES.EDITOR) {
      undoIndicator.classList.add("unstable");
      const undoActionBtn = undoIndicator.querySelector("#undo-btn");
      if (undoActionBtn) undoActionBtn.classList.add("undo-btn-unstable");
      if (historyCounter) historyCounter.classList.add("danger");
    } else if (systemUndoStage >= SYSTEM_UNDO_STAGES.CSS) {
      undoIndicator.classList.add("warning");
      if (historyCounter) historyCounter.classList.add("warning");
    }
  } else {
    const undoActionBtn = undoIndicator.querySelector("#undo-btn");
    if (undoActionBtn) undoActionBtn.classList.remove("undo-btn-unstable");
  }
}

function performSystemUndo() {
  // Add shake to every system undo
  shakeScreen();

  // Show dramatic toast
  const msg = SYSTEM_UNDO_MESSAGES[systemUndoStage];
  if (msg) {
    showToast(msg.title, msg.message, 2500, msg.type);
  }

  // Update status badge
  updateSystemStatus(systemUndoStage);

  switch (systemUndoStage) {
    case SYSTEM_UNDO_STAGES.FOOTER:
      if (appFooter) {
        appFooter.classList.add("footer-destroying");
        setTimeout(() => {
          appFooter.style.display = "none";
        }, 400);
      }
      break;

    case SYSTEM_UNDO_STAGES.SIDEBAR:
      if (sidebar) {
        sidebar.classList.add("undo-slide-out");
        setTimeout(() => {
          sidebar.style.display = "none";
        }, 500);
      }
      break;

    case SYSTEM_UNDO_STAGES.CSS:
      // Corrupt the editor text
      if (editor) {
        editor.classList.add("text-corrupted");
      }
      // Add CSS destruction animation to the body
      document.body.classList.add("css-destroyed");
      // Remove dark mode and corrupt background
      document.body.classList.remove("dark-mode");
      setTimeout(() => {
        document.body.style.background = "linear-gradient(135deg, #fef2f2 0%, #fffbeb 50%, #f0fdf4 100%)";
      }, 400);
      break;

    case SYSTEM_UNDO_STAGES.TOOLBAR:
      // Collapse the editor card dramatically
      if (editorCard) {
        editorCard.classList.add("editor-destroying");
        setTimeout(() => {
          editorCard.style.display = "none";
        }, 700);
      }
      // Fade out undo indicator slowly
      if (undoIndicator) {
        undoIndicator.classList.add("undo-fade-out");
        setTimeout(() => {
          undoIndicator.style.display = "none";
          undoIndicator.classList.remove("undo-fade-out");
        }, 400);
      }
      break;

    case SYSTEM_UNDO_STAGES.HEADER:
      if (appHeader) {
        appHeader.classList.add("header-destroying");
        setTimeout(() => {
          appHeader.style.display = "none";
        }, 600);
      }
      break;

    case SYSTEM_UNDO_STAGES.EDITOR:
      // Last warning shake
      shakeScreen();
      setTimeout(() => shakeScreen(), 150);
      if (editor) {
        editor.innerHTML = "<p style='text-align:center; color:#ef4444; font-size:18px;'>Last function removed...</p>";
      }
      break;

    case SYSTEM_UNDO_STAGES.DONE:
      // Final dramatic entrance
      if (app) {
        app.style.display = "none";
      }
      if (finalState) {
        finalState.classList.add("visible", "dramatic-entrance");
      }
      if (historyCount) {
        historyCount.textContent = "0";
      }
      updateSystemStatus(0);
      // Final toast
      showToast("💀 Website Undone", "There is nothing left to undo. Press Ctrl+Y to redo the website.", 5000, "danger");
      break;
  }

  // Update undo indicator state after changes
  setTimeout(() => updateUndoIndicatorState(), 100);
}

function performSystemRedo() {
  // Show a toast for redo
  if (systemUndoStage === SYSTEM_UNDO_STAGES.DONE) {
    showToast("↻ System Redo", "Restoring the website...", 1500);
  }

  if (systemUndoStage >= SYSTEM_UNDO_STAGES.DONE) {
    if (finalState) {
      finalState.classList.remove("visible", "dramatic-entrance");
    }
    if (app) {
      app.style.display = "";
    }
    if (undoIndicator) {
      undoIndicator.style.display = "";
      undoIndicator.classList.remove("undo-fade-out", "warning", "unstable");
    }
    if (historyCount) {
      historyCount.textContent = String(Math.max(history.length - 1, 0));
    }
    systemUndoStage--;
  }

  if (systemUndoStage === SYSTEM_UNDO_STAGES.EDITOR) {
    // Restore editor content from history
    if (editor && history.length > 0) {
      const lastState = history[history.length - 1];
      editor.innerHTML = lastState.html;
    }
    systemUndoStage--;
  }

  if (systemUndoStage === SYSTEM_UNDO_STAGES.HEADER) {
    if (appHeader) {
      appHeader.style.display = "";
      appHeader.classList.remove("header-destroying");
    }
    systemUndoStage--;
  }

  if (systemUndoStage === SYSTEM_UNDO_STAGES.TOOLBAR) {
    if (editorCard) {
      editorCard.style.display = "";
      editorCard.classList.remove("editor-destroying");
    }
    systemUndoStage--;
  }

  if (systemUndoStage === SYSTEM_UNDO_STAGES.CSS) {
    document.body.classList.remove("css-destroyed");
    document.body.style.background = "";
    // Re-apply saved theme
    const savedTheme = localStorage.getItem("undo_app_theme") || "light";
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
    }
    if (editor) {
      editor.classList.remove("text-corrupted");
    }
    systemUndoStage--;
  }

  if (systemUndoStage === SYSTEM_UNDO_STAGES.SIDEBAR) {
    if (sidebar) {
      sidebar.style.display = "";
      sidebar.classList.remove("undo-slide-out");
    }
    systemUndoStage--;
  }

  if (systemUndoStage === SYSTEM_UNDO_STAGES.FOOTER) {
    if (appFooter) {
      appFooter.style.display = "";
      appFooter.classList.remove("footer-destroying");
    }
    systemUndoStage--;
  }

  // Update system status and undo indicator
  updateSystemStatus(systemUndoStage);
  updateUndoIndicatorState();
  updateHistoryUI();
  updateToolbarState();
}

function redo() {
  if (redoHistory.length === 0) {
    return;
  }

  const nextState = redoHistory.pop();
  history.push(nextState);

  editor.innerHTML = nextState.html;

  editor.focus();
  setCaretOffset(editor, nextState.caret);

  updateActiveDocumentContent();
  updateHistoryUI();
  updateToolbarState();
}

function updateHistoryUI() {
  const undoSteps = Math.max(history.length - 1, 0);
  const hasSystemUndo = systemUndoStage < SYSTEM_UNDO_STAGES.DONE;

  if (systemUndoStage > 0 && hasSystemUndo) {
    if (historyCount) historyCount.textContent = "SYSTEM";
    if (undoBtn) undoBtn.disabled = false;
  } else {
    if (historyCount) historyCount.textContent = undoSteps;
    if (undoBtn) undoBtn.disabled = undoSteps === 0 && !hasSystemUndo;
  }

  if (redoBtn) redoBtn.disabled = redoHistory.length === 0;
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================

let toastTimeout = null;
function showToast(title, message, duration = 3000, type = "warning") {
  if (!systemToast || !toastTitle || !toastMessage) return;

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  // Set toast type (warning or danger)
  systemToast.classList.remove("danger");
  if (type === "danger") {
    systemToast.classList.add("danger");
  }

  systemToast.classList.add("visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    systemToast.classList.remove("visible");
  }, duration);
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

  // Ctrl + Z / Cmd + Z (Undo)
  if (event.code === "KeyZ" && !event.shiftKey) {
    event.preventDefault();
    undo();
  }

  // Ctrl + Shift + Z / Ctrl + Y (Redo)
  if (
    (event.code === "KeyZ" && event.shiftKey) ||
    event.code === "KeyY"
  ) {
    event.preventDefault();
    if (systemUndoStage >= SYSTEM_UNDO_STAGES.DONE) {
      // System Redo — restore the website
      performSystemRedo();
    } else if (systemUndoStage > 0) {
      // Mid-way through system undo, redo one stage
      performSystemRedo();
    } else {
      redo();
    }
  }
});

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