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

// Granular element references for system undo
const footerGithub = document.getElementById("footer-github");
const footerTerms = document.getElementById("footer-terms");
const footerPrivacy = document.getElementById("footer-privacy");
const footerCenter = document.getElementById("footer-center");
const footerLeft = document.getElementById("footer-left");
const sidebarHeader = document.getElementById("sidebar-header");
const sidebarNavEl = document.getElementById("sidebar-nav");
const sidebarBottom = document.getElementById("sidebar-bottom");
const addDocumentBtnEl = document.getElementById("add-document-btn");
const editorToolbar = document.getElementById("editor-toolbar");
const editorActions = document.getElementById("editor-actions");
const undoShortcuts = document.getElementById("undo-shortcuts");
const historyCounterEl = document.getElementById("history-counter");
const bigRedoBtn = document.getElementById("big-redo-btn");

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

const SYSTEM_UNDO_STAGES = {
  // Footer
  FOOTER_GITHUB: 1,
  FOOTER_TERMS: 2,
  FOOTER_PRIVACY: 3,
  FOOTER_CENTER: 4,
  FOOTER_LEFT: 5,
  FOOTER: 6,
  // Sidebar
  SIDEBAR_ADD_BTN: 7,
  SIDEBAR_STORAGE: 8,
  SIDEBAR_DOCS: 9,
  SIDEBAR_HEADER: 10,
  SIDEBAR: 11,
  // CSS
  CSS_TEXT: 12,
  CSS_FILTER: 13,
  // Editor Card — actions bar
  ACTIONS_MORE: 14,
  ACTIONS_DOWNLOAD: 15,
  ACTIONS_LINK: 16,
  ACTIONS_EMOJI: 17,
  ACTIONS_DELETE: 18,
  ACTIONS_SAVE: 19,
  // Editor Card — toolbar
  TOOLBAR_CLEAR: 20,
  TOOLBAR_COLOR: 21,
  TOOLBAR_ALIGN: 22,
  TOOLBAR_UNDERLINE: 23,
  TOOLBAR_BOLD: 24,
  TOOLBAR_STYLE: 25,
  TOOLBAR: 26,
  // Editor content
  EDITOR_CLEAR: 27,
  EDITOR_CARD: 28,
  // Header
  HEADER_EXPORT: 29,
  HEADER_THEME: 30,
  HEADER_STATUS: 31,
  HEADER_TITLE: 32,
  HEADER_BRAND: 33,
  HEADER: 34,
  // Undo indicator
  INDICATOR_REDO: 35,
  INDICATOR_UNDO: 36,
  INDICATOR_SHORTCUTS: 37,
  INDICATOR_COUNT: 38,
  INDICATOR: 39,
  // Final
  DONE: 40
};

const LAST_STAGE = SYSTEM_UNDO_STAGES.DONE;

const history = [];
const redoHistory = [];
let saveStateTimeout = null;
let isTyping = false;
let systemUndoStage = 0;
const systemRedoStack = []; // Stores {stage, action} for each removed element

// Redo fun-state
let restoredStageCount = 0; // How many stages restored so far
let redoTotalStages = 0; // Total stages to restore (calculated on reset)
let redoCombo = 0; // Combo count for rapid clicking
let lastRedoTime = 0; // Timestamp of last redo click
let milestoneFired = new Set(); // Which milestone % already celebrated
let redoQueue = []; // Flat ordered list of {phase, stage} to restore, in dependency order
let redoQueueIndex = 0; // Next stage to restore
let redoCurrentPhase = null; // Phase currently being restored (for toasts)

// Redo phases — theming + ordering only. Each redo CLICK restores exactly ONE
// component, so the site visibly gets reassembled piece by piece. Phases run in
// a random order, but the stages *within* a phase stay in dependency order so
// containers always restore before what lives inside them.
const REDO_PHASES = [
  {
    name: "Foundation",
    emoji: "🧱",
    flavor: "Rebuilding the frame...",
    stages: [SYSTEM_UNDO_STAGES.HEADER, SYSTEM_UNDO_STAGES.FOOTER, SYSTEM_UNDO_STAGES.SIDEBAR],
  },
  {
    name: "Identity",
    emoji: "🏷️",
    flavor: "Restoring the brand...",
    stages: [SYSTEM_UNDO_STAGES.HEADER_BRAND, SYSTEM_UNDO_STAGES.HEADER_TITLE, SYSTEM_UNDO_STAGES.HEADER_STATUS],
  },
  {
    name: "Controls",
    emoji: "🎛️",
    flavor: "Wiring up the buttons...",
    stages: [SYSTEM_UNDO_STAGES.HEADER_THEME, SYSTEM_UNDO_STAGES.HEADER_EXPORT],
  },
  {
    name: "File Cabinet",
    emoji: "📁",
    flavor: "Reopening your documents...",
    stages: [SYSTEM_UNDO_STAGES.SIDEBAR_HEADER, SYSTEM_UNDO_STAGES.SIDEBAR_DOCS, SYSTEM_UNDO_STAGES.SIDEBAR_ADD_BTN, SYSTEM_UNDO_STAGES.SIDEBAR_STORAGE],
  },
  {
    name: "Workspace",
    emoji: "🖥️",
    flavor: "Restoring the editor card...",
    stages: [SYSTEM_UNDO_STAGES.EDITOR_CARD],
  },
  {
    name: "Formatting",
    emoji: "✒️",
    flavor: "Reassembling the toolbar...",
    stages: [SYSTEM_UNDO_STAGES.TOOLBAR, SYSTEM_UNDO_STAGES.TOOLBAR_STYLE, SYSTEM_UNDO_STAGES.TOOLBAR_BOLD, SYSTEM_UNDO_STAGES.TOOLBAR_UNDERLINE, SYSTEM_UNDO_STAGES.TOOLBAR_ALIGN, SYSTEM_UNDO_STAGES.TOOLBAR_COLOR, SYSTEM_UNDO_STAGES.TOOLBAR_CLEAR],
  },
  {
    name: "Actions",
    emoji: "⚡",
    flavor: "Restoring quick actions...",
    stages: [SYSTEM_UNDO_STAGES.ACTIONS_SAVE, SYSTEM_UNDO_STAGES.ACTIONS_DELETE, SYSTEM_UNDO_STAGES.ACTIONS_EMOJI, SYSTEM_UNDO_STAGES.ACTIONS_LINK, SYSTEM_UNDO_STAGES.ACTIONS_DOWNLOAD, SYSTEM_UNDO_STAGES.ACTIONS_MORE],
  },
  {
    name: "Content",
    emoji: "📝",
    flavor: "Recovering your words...",
    stages: [SYSTEM_UNDO_STAGES.EDITOR_CLEAR],
  },
  {
    name: "Stylesheet",
    emoji: "🎨",
    flavor: "Rebuilding the stylesheet...",
    stages: [SYSTEM_UNDO_STAGES.CSS_FILTER, SYSTEM_UNDO_STAGES.CSS_TEXT],
  },
  {
    name: "Undo System",
    emoji: "⏪",
    flavor: "Restoring undo infrastructure...",
    stages: [SYSTEM_UNDO_STAGES.INDICATOR, SYSTEM_UNDO_STAGES.INDICATOR_COUNT, SYSTEM_UNDO_STAGES.INDICATOR_SHORTCUTS, SYSTEM_UNDO_STAGES.INDICATOR_UNDO, SYSTEM_UNDO_STAGES.INDICATOR_REDO],
  },
  {
    name: "Fine Print",
    emoji: "🔍",
    flavor: "Restoring the fine print...",
    stages: [SYSTEM_UNDO_STAGES.FOOTER_LEFT, SYSTEM_UNDO_STAGES.FOOTER_CENTER, SYSTEM_UNDO_STAGES.FOOTER_PRIVACY, SYSTEM_UNDO_STAGES.FOOTER_TERMS, SYSTEM_UNDO_STAGES.FOOTER_GITHUB],
  },
];

// Final phase — the site is fully back, wipe the "4 0 4" screen
const REDO_FINAL_PHASE = {
  name: "Rebirth",
  emoji: "✨",
  flavor: "The website lives again...",
  stages: [SYSTEM_UNDO_STAGES.DONE],
};

// Purely cosmetic flavor text for each component being restored
const RESTORE_FLAVOR = {
  [SYSTEM_UNDO_STAGES.HEADER]: "Header reassembled. Navigation is legal again.",
  [SYSTEM_UNDO_STAGES.FOOTER]: "Footer slid back into place.",
  [SYSTEM_UNDO_STAGES.SIDEBAR]: "Sidebar regained its confidence.",
  [SYSTEM_UNDO_STAGES.HEADER_BRAND]: "The UndoApp brand is back on the shelf.",
  [SYSTEM_UNDO_STAGES.HEADER_TITLE]: "Document title re-inked.",
  [SYSTEM_UNDO_STAGES.HEADER_STATUS]: "System status: pretending to be chill.",
  [SYSTEM_UNDO_STAGES.HEADER_THEME]: "Theme toggle rebooted. Eyes saved.",
  [SYSTEM_UNDO_STAGES.HEADER_EXPORT]: "Export gave print a second chance.",
  [SYSTEM_UNDO_STAGES.SIDEBAR_HEADER]: "Folder label reattached.",
  [SYSTEM_UNDO_STAGES.SIDEBAR_DOCS]: "Your documents stopped hiding.",
  [SYSTEM_UNDO_STAGES.SIDEBAR_ADD_BTN]: "The Add button remembers how to multiply docs.",
  [SYSTEM_UNDO_STAGES.SIDEBAR_STORAGE]: "Storage meter regained its sense of scale.",
  [SYSTEM_UNDO_STAGES.EDITOR_CARD]: "The editor card rolled back upright.",
  [SYSTEM_UNDO_STAGES.TOOLBAR]: "Toolbar stitched back together.",
  [SYSTEM_UNDO_STAGES.TOOLBAR_STYLE]: "Text-style dropdown unbroke its hinges.",
  [SYSTEM_UNDO_STAGES.TOOLBAR_BOLD]: "Bold is confident once more.",
  [SYSTEM_UNDO_STAGES.TOOLBAR_UNDERLINE]: "Underline stopped wavering.",
  [SYSTEM_UNDO_STAGES.TOOLBAR_ALIGN]: "Alignment controls sobered up.",
  [SYSTEM_UNDO_STAGES.TOOLBAR_COLOR]: "The color palette returned from vacation.",
  [SYSTEM_UNDO_STAGES.TOOLBAR_CLEAR]: "Clear Formatting ready to erase responsibly.",
  [SYSTEM_UNDO_STAGES.ACTIONS_SAVE]: "Save is clutching its backup again.",
  [SYSTEM_UNDO_STAGES.ACTIONS_DELETE]: "Delete reintegrated into society.",
  [SYSTEM_UNDO_STAGES.ACTIONS_EMOJI]: "Emoji picker crawled back from the void.",
  [SYSTEM_UNDO_STAGES.ACTIONS_LINK]: "The link button found its anchor.",
  [SYSTEM_UNDO_STAGES.ACTIONS_DOWNLOAD]: "Download got its download groove back.",
  [SYSTEM_UNDO_STAGES.ACTIONS_MORE]: "The 'more' options revealed themselves.",
  [SYSTEM_UNDO_STAGES.EDITOR_CLEAR]: "Your words materialized out of thin air.",
  [SYSTEM_UNDO_STAGES.CSS_FILTER]: "Stylesheets re-injected. Crayons sharpened.",
  [SYSTEM_UNDO_STAGES.CSS_TEXT]: "Text styles un-corrupted. Letters behave again.",
  [SYSTEM_UNDO_STAGES.INDICATOR]: "The undo system stands back up.",
  [SYSTEM_UNDO_STAGES.INDICATOR_COUNT]: "History counter is counting again.",
  [SYSTEM_UNDO_STAGES.INDICATOR_SHORTCUTS]: "Ctrl+Z and Ctrl+Y reconciled.",
  [SYSTEM_UNDO_STAGES.INDICATOR_UNDO]: "Undo button cooled down.",
  [SYSTEM_UNDO_STAGES.INDICATOR_REDO]: "Redo button ready for round two.",
  [SYSTEM_UNDO_STAGES.FOOTER_LEFT]: "Version stamp re-chiseled.",
  [SYSTEM_UNDO_STAGES.FOOTER_CENTER]: "System status returned to operational.",
  [SYSTEM_UNDO_STAGES.FOOTER_PRIVACY]: "Privacy got a second coat of legal.",
  [SYSTEM_UNDO_STAGES.FOOTER_TERMS]: "Terms accepted their terms.",
  [SYSTEM_UNDO_STAGES.FOOTER_GITHUB]: "GitHub link lives again. Fork it, sim.",
  [SYSTEM_UNDO_STAGES.DONE]: "Everything restored. The website is whole.",
};

// Random glitch interruptions to make the rebuild feel alive
const GLITCH_EVENTS = [
  { message: "⚡ Static surge — re-routing...", duration: 70 },
  { message: "⚠ Memory fragment recompiled", duration: 60 },
  { message: "⌛ Syncing parallel timeline...", duration: 90 },
  { message: "🌀 Reversing entropy... hold on", duration: 80 },
  { message: "🔧 Patching a 404-shaped hole...", duration: 70 },
  { message: "🛠️ Realigning DOM gravity...", duration: 75 },
  { message: "📡 Signal lost... reacquired.", duration: 60 },
];

// Milestones worth celebrating
const REDO_MILESTONES = [
  { at: 0.25, title: "1/4 Rebuilt!", msg: "25% of the website has crawled out of the void.", emoji: "🎉" },
  { at: 0.5, title: "Halfway there!", msg: "50% restored. The website can almost stand.", emoji: "🎊" },
  { at: 0.75, title: "3/4 Rebuilt!", msg: "75% assembled. The buttons are getting restless.", emoji: "🥳" },
  { at: 1, title: "Website Reborn!", msg: "100% restored. UndoApp lives to be undone again.", emoji: "🌍" },
];

// System undo toast messages — dramatic!
const SYSTEM_UNDO_MESSAGES = {
  // Footer
  [SYSTEM_UNDO_STAGES.FOOTER_GITHUB]: { title: "⚠ System Undo Activated", message: "User history exhausted. Undoing GitHub link...", type: "warning" },
  [SYSTEM_UNDO_STAGES.FOOTER_TERMS]: { title: "⚠ System Undo", message: "Undoing Terms link...", type: "warning" },
  [SYSTEM_UNDO_STAGES.FOOTER_PRIVACY]: { title: "⚠ System Undo", message: "Undoing Privacy link...", type: "warning" },
  [SYSTEM_UNDO_STAGES.FOOTER_CENTER]: { title: "⚠ System Undo", message: "Undoing system status...", type: "warning" },
  [SYSTEM_UNDO_STAGES.FOOTER_LEFT]: { title: "⚠ System Undo", message: "Undoing version info...", type: "warning" },
  [SYSTEM_UNDO_STAGES.FOOTER]: { title: "⚠ System Undo", message: "Undoing entire footer...", type: "warning" },
  // Sidebar
  [SYSTEM_UNDO_STAGES.SIDEBAR_ADD_BTN]: { title: "⚠ System Undo", message: "Undoing Add Document button...", type: "warning" },
  [SYSTEM_UNDO_STAGES.SIDEBAR_STORAGE]: { title: "⚠ System Undo", message: "Undoing storage indicator...", type: "warning" },
  [SYSTEM_UNDO_STAGES.SIDEBAR_DOCS]: { title: "⚠ System Undo", message: "Undoing document list...", type: "warning" },
  [SYSTEM_UNDO_STAGES.SIDEBAR_HEADER]: { title: "⚠ System Undo", message: "Undoing sidebar header...", type: "warning" },
  [SYSTEM_UNDO_STAGES.SIDEBAR]: { title: "⚠ System Undo", message: "Undoing entire sidebar...", type: "warning" },
  // CSS
  [SYSTEM_UNDO_STAGES.CSS_TEXT]: { title: "🔴 CSS CORRUPTED", message: "Undoing text styles... Letters are scrambling.", type: "danger" },
  [SYSTEM_UNDO_STAGES.CSS_FILTER]: { title: "🔴 CSS CORRUPTED", message: "Undoing CSS filters... Styles unraveling.", type: "danger" },
  // Actions bar
  [SYSTEM_UNDO_STAGES.ACTIONS_MORE]: { title: "🔴 CRITICAL", message: "Undoing More Options...", type: "danger" },
  [SYSTEM_UNDO_STAGES.ACTIONS_DOWNLOAD]: { title: "🔴 CRITICAL", message: "Undoing Download...", type: "danger" },
  [SYSTEM_UNDO_STAGES.ACTIONS_LINK]: { title: "🔴 CRITICAL", message: "Undoing Link button...", type: "danger" },
  [SYSTEM_UNDO_STAGES.ACTIONS_EMOJI]: { title: "🔴 CRITICAL", message: "Undoing Emoji picker...", type: "danger" },
  [SYSTEM_UNDO_STAGES.ACTIONS_DELETE]: { title: "🔴 CRITICAL", message: "Undoing Delete button...", type: "danger" },
  [SYSTEM_UNDO_STAGES.ACTIONS_SAVE]: { title: "🔴 CRITICAL", message: "Undoing Save function...", type: "danger" },
  // Toolbar
  [SYSTEM_UNDO_STAGES.TOOLBAR_CLEAR]: { title: "🔴 CRITICAL", message: "Undoing Clear Formatting...", type: "danger" },
  [SYSTEM_UNDO_STAGES.TOOLBAR_COLOR]: { title: "🔴 CRITICAL", message: "Undoing Color picker...", type: "danger" },
  [SYSTEM_UNDO_STAGES.TOOLBAR_ALIGN]: { title: "🔴 CRITICAL", message: "Undoing Alignment controls...", type: "danger" },
  [SYSTEM_UNDO_STAGES.TOOLBAR_UNDERLINE]: { title: "🔴 CRITICAL", message: "Undoing Underline...", type: "danger" },
  [SYSTEM_UNDO_STAGES.TOOLBAR_BOLD]: { title: "🔴 CRITICAL", message: "Undoing Bold...", type: "danger" },
  [SYSTEM_UNDO_STAGES.TOOLBAR_STYLE]: { title: "🔴 CRITICAL", message: "Undoing Text Style...", type: "danger" },
  [SYSTEM_UNDO_STAGES.TOOLBAR]: { title: "🔴 CRITICAL", message: "Undoing entire toolbar...", type: "danger" },
  // Editor
  [SYSTEM_UNDO_STAGES.EDITOR_CLEAR]: { title: "💀 EDITOR FAILING", message: "Undoing editor content...", type: "danger" },
  [SYSTEM_UNDO_STAGES.EDITOR_CARD]: { title: "💀 EDITOR GONE", message: "Undoing editor card...", type: "danger" },
  // Header
  [SYSTEM_UNDO_STAGES.HEADER_EXPORT]: { title: "💀 NAVIGATION LOST", message: "Undoing Export button...", type: "danger" },
  [SYSTEM_UNDO_STAGES.HEADER_THEME]: { title: "💀 NAVIGATION LOST", message: "Undoing Theme toggle...", type: "danger" },
  [SYSTEM_UNDO_STAGES.HEADER_STATUS]: { title: "💀 NAVIGATION LOST", message: "Undoing System Status...", type: "danger" },
  [SYSTEM_UNDO_STAGES.HEADER_TITLE]: { title: "💀 NAVIGATION LOST", message: "Undoing Document Title...", type: "danger" },
  [SYSTEM_UNDO_STAGES.HEADER_BRAND]: { title: "💀 IDENTITY LOST", message: "Undoing UndoApp brand...", type: "danger" },
  [SYSTEM_UNDO_STAGES.HEADER]: { title: "💀 IDENTITY LOST", message: "Undoing entire header...", type: "danger" },
  // Undo indicator
  [SYSTEM_UNDO_STAGES.INDICATOR_REDO]: { title: "💀 UNDO BUTTON UNSTABLE", message: "Undoing Redo button...", type: "danger" },
  [SYSTEM_UNDO_STAGES.INDICATOR_UNDO]: { title: "💀 UNDO BUTTON UNSTABLE", message: "Undoing Undo button...", type: "danger" },
  [SYSTEM_UNDO_STAGES.INDICATOR_SHORTCUTS]: { title: "💀 UNDO BUTTON UNSTABLE", message: "Undoing keyboard shortcuts display...", type: "danger" },
  [SYSTEM_UNDO_STAGES.INDICATOR_COUNT]: { title: "💀 UNDO BUTTON UNSTABLE", message: "Undoing history counter...", type: "danger" },
  [SYSTEM_UNDO_STAGES.INDICATOR]: { title: "💀 UNDO SYSTEM GONE", message: "Undoing undo indicator...", type: "danger" },
  // Final
  [SYSTEM_UNDO_STAGES.DONE]: { title: "💀 Website Undone", message: "There is nothing left to undo.", type: "danger" }
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
  if (systemUndoStage < LAST_STAGE) {
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
  systemStatus.classList.remove("status-ready", "status-warning", "status-danger", "status-restoring");

  if (stage === 0) {
    systemStatus.classList.add("status-ready");
    systemStatus.innerHTML = '<span class="status-dot"></span> Ready';
  } else if (stage <= SYSTEM_UNDO_STAGES.FOOTER) {
    systemStatus.classList.add("status-warning");
    systemStatus.innerHTML = '<span class="status-dot"></span> Warning';
  } else {
    systemStatus.classList.add("status-danger");
    systemStatus.innerHTML = '<span class="status-dot"></span> Critical';
  }
}

function updateSystemStatusRestore(stage) {
  if (!systemStatus) return;
  systemStatus.classList.remove("status-ready", "status-warning", "status-danger");
  systemStatus.classList.add("status-restoring");
  systemStatus.innerHTML = '<span class="status-dot"></span> Restoring';

  // After animation settles, transition to the correct state
  setTimeout(() => {
    updateSystemStatus(stage);
  }, 600);
}

// Redo-aware status: reflects how much of the site is still broken, so the
// badge meaningfully stays "Critical" while it's being rebuilt and only turns
// "Ready" once everything is back. Remaining is derived from the live redo
// stack, so it stays accurate even if the redo only covers a partial undo.
function updateRedoStatus() {
  if (!systemStatus) return;

  const remaining = systemRedoStack.length;
  const total = redoTotalStages > 0 ? redoTotalStages : (remaining + restoredStageCount);
  systemStatus.classList.remove("status-ready", "status-warning", "status-danger", "status-restoring");

  let label = "Critical";
  let cls = "status-danger";
  if (remaining === 0) {
    label = "Ready";
    cls = "status-ready";
  } else if (total > 0 && remaining <= Math.ceil(total * 0.15)) {
    // Under 15% left broken — almost there, downgrade to warning
    label = "Warning";
    cls = "status-warning";
  }
  systemStatus.classList.add(cls);
  systemStatus.innerHTML = `<span class="status-dot"></span> ${label}`;
}

function updateUndoIndicatorState() {
  if (!undoIndicator) return;
  undoIndicator.classList.remove("warning", "unstable");

  if (historyCounterEl) {
    historyCounterEl.classList.remove("warning", "danger");
  }

  if (systemUndoStage > 0 && systemUndoStage <= LAST_STAGE) {
    if (systemUndoStage >= SYSTEM_UNDO_STAGES.INDICATOR_REDO) {
      undoIndicator.classList.add("unstable");
      const undoActionBtn = undoIndicator.querySelector("#undo-btn");
      if (undoActionBtn) undoActionBtn.classList.add("undo-btn-unstable");
      if (historyCounterEl) historyCounterEl.classList.add("danger");
    } else if (systemUndoStage >= SYSTEM_UNDO_STAGES.CSS_TEXT) {
      undoIndicator.classList.add("warning");
      if (historyCounterEl) historyCounterEl.classList.add("warning");
    }
  } else {
    const undoActionBtn = undoIndicator.querySelector("#undo-btn");
    if (undoActionBtn) undoActionBtn.classList.remove("undo-btn-unstable");
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fadeOutElement(el, className = "item-fade-out", delay = 300) {
  if (!el) return;
  el.classList.add(className);
  setTimeout(() => {
    el.style.display = "none";
    el.classList.remove(className);
  }, delay);
}

// Redo brings parts back in the WRONG position — each restored component is
// dropped into a random region of the page instead of its real home. The result
// is a scrambled mess, and the only proper way to set it right is to wipe
// localStorage. The app must stay in DOM (undo/redo refs still work), so we
// move elements between region containers but never nest a region inside itself.
function scrambleIntoWrongSpot(el) {
  if (!el || !el.parentNode || !document.body) return;

  // The page's "scrap bucket" regions a component can get dropped into.
  const workspace = document.querySelector(".workspace");
  const regions = [
    appHeader,
    sidebar,
    workspace,
    appFooter
  ].filter(Boolean);

  // Never scramble a structural region container itself — only its contents.
  if (regions.includes(el)) return;

  // Exclude targets that would nest the element inside itself or its relatives.
  const targets = regions.filter(t =>
    t !== el && !t.contains(el) && !(el.contains(t))
  );
  if (targets.length === 0) return;

  // Prefer a target that actually relocates the element somewhere new.
  const away = targets.filter(t => t !== el.parentNode);
  const pool = away.length ? away : targets;
  const target = pool[Math.floor(Math.random() * pool.length)];
  target.appendChild(el);
}

function fadeInElement(el, className = "item-fade-in", delay = 400) {
  if (!el) return;
  el.style.display = "";
  el.classList.remove("item-fade-out");
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), delay);
  // Restored components land in a random wrong spot until local storage is cleared.
  scrambleIntoWrongSpot(el);
}

function performSystemUndo() {
  // Add shake to every system undo
  shakeScreen();

  // Show dramatic toast
  const msg = SYSTEM_UNDO_MESSAGES[systemUndoStage];
  if (msg) {
    showToast(msg.title, msg.message, 2000, msg.type);
  }

  // Update status badge
  updateSystemStatus(systemUndoStage);

  const S = SYSTEM_UNDO_STAGES;

  switch (systemUndoStage) {
    // ===== FOOTER =====
    case S.FOOTER_GITHUB:
      systemRedoStack.push({ stage: S.FOOTER_GITHUB, action: () => fadeInElement(footerGithub, "item-fade-in") });
      fadeOutElement(footerGithub);
      break;

    case S.FOOTER_TERMS:
      systemRedoStack.push({ stage: S.FOOTER_TERMS, action: () => fadeInElement(footerTerms, "item-fade-in") });
      fadeOutElement(footerTerms);
      break;

    case S.FOOTER_PRIVACY:
      systemRedoStack.push({ stage: S.FOOTER_PRIVACY, action: () => fadeInElement(footerPrivacy, "item-fade-in") });
      fadeOutElement(footerPrivacy);
      break;

    case S.FOOTER_CENTER:
      systemRedoStack.push({ stage: S.FOOTER_CENTER, action: () => fadeInElement(footerCenter, "item-fade-in") });
      fadeOutElement(footerCenter);
      break;

    case S.FOOTER_LEFT:
      systemRedoStack.push({ stage: S.FOOTER_LEFT, action: () => fadeInElement(footerLeft, "item-fade-in") });
      fadeOutElement(footerLeft);
      break;

    case S.FOOTER:
      if (appFooter) {
        systemRedoStack.push({
          stage: S.FOOTER,
          action: () => {
            appFooter.style.display = "";
            appFooter.classList.remove("footer-destroying");
            appFooter.classList.add("footer-restoring");
            setTimeout(() => appFooter.classList.remove("footer-restoring"), 550);
          }
        });
        appFooter.classList.add("footer-destroying");
        setTimeout(() => { appFooter.style.display = "none"; }, 400);
      }
      break;

    // ===== SIDEBAR =====
    case S.SIDEBAR_ADD_BTN:
      systemRedoStack.push({ stage: S.SIDEBAR_ADD_BTN, action: () => fadeInElement(addDocumentBtnEl, "item-fade-in") });
      fadeOutElement(addDocumentBtnEl);
      break;

    case S.SIDEBAR_STORAGE:
      systemRedoStack.push({ stage: S.SIDEBAR_STORAGE, action: () => fadeInElement(sidebarBottom, "item-fade-in") });
      fadeOutElement(sidebarBottom);
      break;

    case S.SIDEBAR_DOCS:
      systemRedoStack.push({ stage: S.SIDEBAR_DOCS, action: () => fadeInElement(sidebarNavEl, "item-fade-in") });
      fadeOutElement(sidebarNavEl);
      break;

    case S.SIDEBAR_HEADER:
      systemRedoStack.push({ stage: S.SIDEBAR_HEADER, action: () => fadeInElement(sidebarHeader, "item-fade-in") });
      fadeOutElement(sidebarHeader);
      break;

    case S.SIDEBAR:
      if (sidebar) {
        systemRedoStack.push({
          stage: S.SIDEBAR,
          action: () => {
            sidebar.style.display = "";
            sidebar.classList.remove("undo-slide-out");
            sidebar.classList.add("sidebar-restoring");
            setTimeout(() => sidebar.classList.remove("sidebar-restoring"), 550);
          }
        });
        sidebar.classList.add("undo-slide-out");
        setTimeout(() => { sidebar.style.display = "none"; }, 500);
      }
      break;

    // ===== CSS =====
    case S.CSS_TEXT: {
      // Save state for redo
      const wasDark = document.body.classList.contains("dark-mode");
      const prevBg = document.body.style.background;
      const stylesheetLink = document.querySelector('link[href*="style.css"]');
      const stylesheetHref = stylesheetLink ? stylesheetLink.getAttribute("href") : null;

      systemRedoStack.push({
        stage: S.CSS_TEXT,
        action: () => {
          // Re-add the stylesheet
          if (stylesheetHref && !document.querySelector('link[href*="style.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = stylesheetHref;
            document.head.appendChild(link);
            // Wait for stylesheet to load then restore state
            link.onload = () => {
              document.body.style.background = prevBg || "";
              if (wasDark) document.body.classList.add("dark-mode");
              document.body.classList.remove("css-destroyed");
              if (editor) {
                editor.classList.remove("text-corrupted");
                editor.classList.add("text-uncorrupting");
                setTimeout(() => editor.classList.remove("text-uncorrupting"), 550);
              }
            };
          }
        }
      });

      // Corrupt the text first
      if (editor) editor.classList.add("text-corrupted");
      // Remove dark mode
      document.body.classList.remove("dark-mode");
      // Set glitchy background inline
      setTimeout(() => {
        const isDark = localStorage.getItem("undo_app_theme") === "dark";
        document.body.style.background = isDark
          ? "linear-gradient(135deg, #1a0000 0%, #1a1000 50%, #001a00 100%)"
          : "linear-gradient(135deg, #fef2f2 0%, #fffbeb 50%, #f0fdf4 100%)";
      }, 400);
      break;
    }

    case S.CSS_FILTER: {
      // Remove ALL stylesheets — both <link> tags and Vite-injected <style> tags
      // Save them for redo restoration
      const allStyleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const allStyleTags = Array.from(document.querySelectorAll('style'));

      // Save original positions and content
      const savedLinks = allStyleLinks.map(el => ({
        href: el.getAttribute("href"),
        parent: el.parentNode,
        next: el.nextSibling
      }));
      const savedStyleTags = allStyleTags.map(el => ({
        content: el.textContent,
        parent: el.parentNode,
        next: el.nextSibling
      }));

      systemRedoStack.push({
        stage: S.CSS_FILTER,
        action: () => {
          // Re-insert all <link> stylesheets
          savedLinks.forEach(saved => {
            if (!document.querySelector(`link[href="${saved.href}"]`)) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = saved.href;
              if (saved.next && saved.parent) {
                saved.parent.insertBefore(link, saved.next);
              } else if (saved.parent) {
                saved.parent.appendChild(link);
              }
            }
          });
          // Re-insert all <style> tags
          savedStyleTags.forEach(saved => {
            const style = document.createElement("style");
            style.textContent = saved.content;
            if (saved.next && saved.parent) {
              saved.parent.insertBefore(style, saved.next);
            } else if (saved.parent) {
              saved.parent.appendChild(style);
            }
          });
          // Remove css-destroyed class and play restore animation
          document.body.classList.remove("css-destroyed");
          document.body.classList.add("css-restoring");
          setTimeout(() => document.body.classList.remove("css-restoring"), 850);
        }
      });

      // Remove all stylesheets — page becomes completely unstyled
      allStyleLinks.forEach(el => el.remove());
      allStyleTags.forEach(el => el.remove());
      break;
    }

    // ===== ACTIONS BAR =====
    case S.ACTIONS_MORE:
      systemRedoStack.push({ stage: S.ACTIONS_MORE, action: () => {
        const dd = moreOptionsBtn ? moreOptionsBtn.closest(".action-dropdown") : null;
        fadeInElement(dd || moreOptionsBtn, "item-fade-in");
      }});
      { const ddMore = moreOptionsBtn ? moreOptionsBtn.closest(".action-dropdown") : null;
        fadeOutElement(ddMore || moreOptionsBtn); }
      break;

    case S.ACTIONS_DOWNLOAD:
      systemRedoStack.push({ stage: S.ACTIONS_DOWNLOAD, action: () => fadeInElement(downloadBtn, "item-fade-in") });
      fadeOutElement(downloadBtn);
      break;

    case S.ACTIONS_LINK:
      systemRedoStack.push({ stage: S.ACTIONS_LINK, action: () => fadeInElement(linkBtn, "item-fade-in") });
      fadeOutElement(linkBtn);
      break;

    case S.ACTIONS_EMOJI: {
      const ddEmoji = emojiBtn ? emojiBtn.closest(".action-dropdown") : null;
      systemRedoStack.push({ stage: S.ACTIONS_EMOJI, action: () => fadeInElement(ddEmoji || emojiBtn, "item-fade-in") });
      fadeOutElement(ddEmoji || emojiBtn);
      break;
    }

    case S.ACTIONS_DELETE:
      systemRedoStack.push({ stage: S.ACTIONS_DELETE, action: () => fadeInElement(deleteDocBtn, "item-fade-in") });
      fadeOutElement(deleteDocBtn);
      break;

    case S.ACTIONS_SAVE:
      systemRedoStack.push({ stage: S.ACTIONS_SAVE, action: () => fadeInElement(saveBtn, "item-fade-in") });
      fadeOutElement(saveBtn);
      break;

    // ===== TOOLBAR =====
    case S.TOOLBAR_CLEAR:
      systemRedoStack.push({ stage: S.TOOLBAR_CLEAR, action: () => fadeInElement(clearFormattingBtn, "item-fade-in") });
      fadeOutElement(clearFormattingBtn);
      break;

    case S.TOOLBAR_COLOR: {
      const ddColor = colorBtn ? colorBtn.closest(".toolbar-dropdown") : null;
      systemRedoStack.push({ stage: S.TOOLBAR_COLOR, action: () => fadeInElement(ddColor || colorBtn, "item-fade-in") });
      fadeOutElement(ddColor || colorBtn);
      break;
    }

    case S.TOOLBAR_ALIGN: {
      const alignBtns = [alignLeftBtn, alignCenterBtn, alignRightBtn];
      const prevAlignDisplay = alignBtns.map(b => b ? b.style.display : "");
      systemRedoStack.push({ stage: S.TOOLBAR_ALIGN, action: () => {
        alignBtns.forEach((b, i) => { if (b) { b.style.display = prevAlignDisplay[i]; b.classList.add("item-fade-in"); setTimeout(() => b.classList.remove("item-fade-in"), 400); } });
      }});
      alignBtns.forEach(b => fadeOutElement(b));
      break;
    }

    case S.TOOLBAR_UNDERLINE:
      systemRedoStack.push({ stage: S.TOOLBAR_UNDERLINE, action: () => fadeInElement(underlineBtn, "item-fade-in") });
      fadeOutElement(underlineBtn);
      break;

    case S.TOOLBAR_BOLD:
      systemRedoStack.push({ stage: S.TOOLBAR_BOLD, action: () => fadeInElement(boldBtn, "item-fade-in") });
      fadeOutElement(boldBtn);
      break;

    case S.TOOLBAR_STYLE: {
      const ddStyle = textStyleBtn ? textStyleBtn.closest(".toolbar-dropdown") : null;
      systemRedoStack.push({ stage: S.TOOLBAR_STYLE, action: () => fadeInElement(ddStyle || textStyleBtn, "item-fade-in") });
      fadeOutElement(ddStyle || textStyleBtn);
      break;
    }

    case S.TOOLBAR:
      if (editorToolbar) {
        systemRedoStack.push({
          stage: S.TOOLBAR,
          action: () => {
            editorToolbar.style.display = "";
            editorToolbar.classList.remove("toolbar-collapsing");
            editorToolbar.classList.add("toolbar-restoring");
            setTimeout(() => editorToolbar.classList.remove("toolbar-restoring"), 500);
          }
        });
        editorToolbar.classList.add("toolbar-collapsing");
        setTimeout(() => { editorToolbar.style.display = "none"; }, 600);
      }
      break;

    // ===== EDITOR =====
    case S.EDITOR_CLEAR: {
      const prevHtml = editor ? editor.innerHTML : "";
      systemRedoStack.push({
        stage: S.EDITOR_CLEAR,
        action: () => {
          if (editor) {
            editor.innerHTML = prevHtml;
            editor.classList.add("editor-content-restoring");
            setTimeout(() => editor.classList.remove("editor-content-restoring"), 450);
          }
        }
      });
      if (editor) {
        editor.innerHTML = "";
      }
      break;
    }

    case S.EDITOR_CARD:
      if (editorCard) {
        systemRedoStack.push({
          stage: S.EDITOR_CARD,
          action: () => {
            editorCard.style.display = "";
            editorCard.classList.remove("editor-destroying");
            editorCard.classList.add("editor-restoring");
            setTimeout(() => editorCard.classList.remove("editor-restoring"), 650);
          }
        });
        editorCard.classList.add("editor-destroying");
        setTimeout(() => { editorCard.style.display = "none"; }, 700);
      }
      break;

    // ===== HEADER =====
    case S.HEADER_EXPORT:
      systemRedoStack.push({ stage: S.HEADER_EXPORT, action: () => fadeInElement(exportBtn, "item-fade-in") });
      fadeOutElement(exportBtn);
      break;

    case S.HEADER_THEME:
      systemRedoStack.push({ stage: S.HEADER_THEME, action: () => fadeInElement(themeToggleBtn, "item-fade-in") });
      fadeOutElement(themeToggleBtn);
      break;

    case S.HEADER_STATUS:
      systemRedoStack.push({ stage: S.HEADER_STATUS, action: () => fadeInElement(systemStatus, "item-fade-in") });
      fadeOutElement(systemStatus);
      break;

    case S.HEADER_TITLE: {
      const docInfo = documentTitle ? documentTitle.closest(".document-info") : null;
      systemRedoStack.push({ stage: S.HEADER_TITLE, action: () => fadeInElement(docInfo || documentTitle, "item-fade-in") });
      fadeOutElement(docInfo || documentTitle);
      break;
    }

    case S.HEADER_BRAND: {
      const brand = brandLink ? brandLink.closest(".brand") : null;
      systemRedoStack.push({ stage: S.HEADER_BRAND, action: () => fadeInElement(brand || brandLink, "item-fade-in") });
      fadeOutElement(brand || brandLink);
      break;
    }

    case S.HEADER:
      if (appHeader) {
        systemRedoStack.push({
          stage: S.HEADER,
          action: () => {
            appHeader.style.display = "";
            appHeader.classList.remove("header-destroying");
            appHeader.classList.add("header-restoring");
            setTimeout(() => appHeader.classList.remove("header-restoring"), 550);
          }
        });
        appHeader.classList.add("header-destroying");
        setTimeout(() => { appHeader.style.display = "none"; }, 600);
      }
      break;

    // ===== UNDO INDICATOR =====
    case S.INDICATOR_REDO:
      systemRedoStack.push({ stage: S.INDICATOR_REDO, action: () => fadeInElement(redoBtn, "item-fade-in") });
      fadeOutElement(redoBtn);
      break;

    case S.INDICATOR_UNDO:
      systemRedoStack.push({ stage: S.INDICATOR_UNDO, action: () => fadeInElement(undoBtn, "item-fade-in") });
      fadeOutElement(undoBtn);
      break;

    case S.INDICATOR_SHORTCUTS:
      systemRedoStack.push({ stage: S.INDICATOR_SHORTCUTS, action: () => fadeInElement(undoShortcuts, "item-fade-in") });
      fadeOutElement(undoShortcuts);
      break;

    case S.INDICATOR_COUNT:
      systemRedoStack.push({ stage: S.INDICATOR_COUNT, action: () => fadeInElement(historyCounterEl, "item-fade-in") });
      fadeOutElement(historyCounterEl);
      break;

    case S.INDICATOR:
      if (undoIndicator) {
        systemRedoStack.push({
          stage: S.INDICATOR,
          action: () => {
            undoIndicator.style.display = "";
            undoIndicator.classList.remove("undo-fade-out", "warning", "unstable");
            undoIndicator.classList.add("indicator-restoring");
            setTimeout(() => undoIndicator.classList.remove("indicator-restoring"), 450);
          }
        });
        undoIndicator.classList.add("undo-fade-out");
        setTimeout(() => {
          undoIndicator.style.display = "none";
          undoIndicator.classList.remove("undo-fade-out");
        }, 400);
      }
      break;

    // ===== FINAL =====
    case S.DONE:
      systemRedoStack.push({
        stage: S.DONE,
        action: () => {
          if (finalState) {
            finalState.classList.add("dramatic-exit");
            setTimeout(() => finalState.classList.remove("visible", "dramatic-entrance", "dramatic-exit"), 600);
          }
          setTimeout(() => {
            if (app) {
              app.style.display = "";
              app.style.opacity = "0";
              app.style.transition = "opacity 500ms ease";
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  app.style.opacity = "1";
                  setTimeout(() => { app.style.opacity = ""; app.style.transition = ""; }, 550);
                });
              });
            }
          }, 300);
          if (undoIndicator) {
            setTimeout(() => {
              undoIndicator.style.display = "";
              undoIndicator.classList.remove("undo-fade-out", "warning", "unstable");
              undoIndicator.classList.add("indicator-restoring");
              setTimeout(() => undoIndicator.classList.remove("indicator-restoring"), 450);
            }, 400);
          }
          if (historyCount) historyCount.textContent = String(Math.max(history.length - 1, 0));
        }
      });
      if (app) app.style.display = "none";
      if (finalState) finalState.classList.add("visible", "dramatic-entrance");
      if (historyCount) historyCount.textContent = "0";
      // Fully destroyed — show Critical, not Ready
      systemStatus.classList.remove("status-ready", "status-warning", "status-restoring");
      systemStatus.classList.add("status-danger");
      systemStatus.innerHTML = '<span class="status-dot"></span> Critical';

      // Build a random-order restore queue, one component per redo click
      buildRedoQueue();
      restoredStageCount = 0;
      redoTotalStages = systemRedoStack.length;
      redoCombo = 0;
      lastRedoTime = 0;
      redoCurrentPhase = null;
      milestoneFired = new Set();
      const progFill = document.getElementById("toast-progress-fill");
      if (progFill) progFill.style.width = "0%";

      showToast("💀 Website Undone", "Click the button or press Ctrl+Y to redo the website.", 5000, "danger");
      break;
  }

  // Update undo indicator state after changes
  setTimeout(() => updateUndoIndicatorState(), 100);
}

function fireConfetti() {
  const burst = document.getElementById("confetti-burst");
  if (!burst) return;
  burst.innerHTML = "";
  const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#10b981", "#a855f7"];
  for (let i = 0; i < 42; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${(Math.random() * 0.25).toFixed(2)}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    burst.appendChild(piece);
  }
  burst.classList.add("firing");
  setTimeout(() => burst.classList.remove("firing"), 1400);
}

function triggerGlitchEvent() {
  // Only a sometimes-event so it never drowns out the restore UI
  if (Math.random() > 0.3) return;
  const event = GLITCH_EVENTS[Math.floor(Math.random() * GLITCH_EVENTS.length)];
  if (!app) return;
  app.classList.add("screen-glitch");
  // Use a short, low-key toast that won't fight the phase/main toast
  showToast("🔧 Rebuild Gremlin", event.message, 1100, "warning");
  setTimeout(() => app.classList.remove("screen-glitch"), event.duration + 100);
}

function restoreSingleStage(stage) {
  const idx = systemRedoStack.findIndex(e => e.stage === stage);
  if (idx === -1) return null;
  const entry = systemRedoStack.splice(idx, 1)[0];
  systemUndoStage = entry.stage - 1;
  entry.action();
  restoredStageCount++;
  return entry;
}

function buildRedoQueue() {
  // Build a flat, ordered list of one component per redo click. Phases are
  // shuffled into a random order, but stages within a phase keep dependency
  // order (containers before their children).
  const shuffled = shuffleArray([...REDO_PHASES.map(p => ({ ...p, stages: [...p.stages] }))]);
  redoQueue = [];
  for (const phase of shuffled) {
    for (const stage of phase.stages) {
      redoQueue.push({ phase, stage });
    }
  }
  redoQueueIndex = 0;
}

// Show the app in its current (broken) state and hide the 404 overlay, so the
// user watches the skeleton get reassembled one component per click instead of
// the whole site popping in only at the very end.
function revealBrokenSite() {
  if (app) {
    app.style.display = "";
    app.style.opacity = "1";
  }
  if (finalState) {
    finalState.classList.remove("visible", "dramatic-entrance", "dramatic-exit");
  }
}

// Restore the final "Rebirth" (DONE) stage. This is the last component — after
// it, every stage is back, so the status badge correctly flips to Ready and the
// 100% milestone fires.
function performFinalRestore() {
  const idx = systemRedoStack.findIndex(e => e.stage === SYSTEM_UNDO_STAGES.DONE);
  if (idx === -1) return;
  const entry = systemRedoStack.splice(idx, 1)[0];
  systemUndoStage = entry.stage - 1;
  entry.action();
  restoredStageCount++;

  // Pulse the screen green for the finish
  if (app) {
    app.classList.remove("restore-pulse");
    void app.offsetWidth;
    app.classList.add("restore-pulse");
    setTimeout(() => app.classList.remove("restore-pulse"), 650);
  }

  setTimeout(() => {
    const flavor = RESTORE_FLAVOR[SYSTEM_UNDO_STAGES.DONE];
    if (flavor) {
      showToast(`↻ ${REDO_FINAL_PHASE.emoji} ${REDO_FINAL_PHASE.name}`, flavor, 4000, "restore");
    }
    updateRedoStatus();
    updateUndoIndicatorState();
    updateHistoryUI();
    updateToolbarState();
    checkRedoMilestones();
  }, 60);
}

function performSystemRedo() {
  if (systemRedoStack.length === 0) return;

  // Always make sure the app is visible (in whatever broken state it's in) and
  // the 404 overlay is gone — so every one of the ~40 single-component clicks
  // is visible on screen, progressively rebuilding the site.
  revealBrokenSite();

  const queueExhausted = redoQueue.length === 0 || redoQueueIndex >= redoQueue.length;
  const donePending = systemRedoStack.some(e => e.stage === SYSTEM_UNDO_STAGES.DONE);

  // ----- Final phase: once every normal component is back, restore the site's
  // rebirth (DONE) WITHOUT resetting the session, so the progress/status
  // tracking survives to show "Ready" at the very end. -----
  if (queueExhausted && donePending) {
    performFinalRestore();
    return;
  }

  // ----- Lazy-init / validate the redo queue -----
  // Rebuild the queue if it's empty (e.g. redo clicked mid-undo, before the
  // full 404 collapse) or if it no longer matches the pending stack.
  if (queueExhausted) {
    buildRedoQueue();
    restoredStageCount = 0;
    redoTotalStages = systemRedoStack.length;
    milestoneFired = new Set();
    redoCurrentPhase = null;
    redoCombo = 0;
    lastRedoTime = 0;
  }

  // ----- Combo detection: fast clicking restores an extra component -----
  const now = Date.now();
  if (lastRedoTime > 0 && now - lastRedoTime < 900) {
    redoCombo++;
  } else {
    redoCombo = 0;
  }
  lastRedoTime = now;
  const comboBonus = Math.min(2, Math.floor(redoCombo / 4)); // every 4 fast clicks = +1 extra component

  // ----- Pick the next components to restore -----
  const toRestore = [];
  // Primary: next stage in the queue (skipping any already gone from the stack)
  while (toRestore.length === 0 && redoQueueIndex < redoQueue.length) {
    const item = redoQueue[redoQueueIndex];
    redoQueueIndex++;
    if (systemRedoStack.some(e => e.stage === item.stage)) toRestore.push(item);
  }
  // Combo: pull extra pending components
  for (let c = 0; c < comboBonus && redoQueueIndex < redoQueue.length; c++) {
    const item = redoQueue[redoQueueIndex];
    redoQueueIndex++;
    if (systemRedoStack.some(e => e.stage === item.stage)) toRestore.push(item);
  }
  if (toRestore.length === 0) return;

  // Pulse the screen softly on every component
  if (app) {
    app.classList.remove("restore-pulse");
    void app.offsetWidth;
    app.classList.add("restore-pulse");
    setTimeout(() => app.classList.remove("restore-pulse"), 650);
  }

  // Track the phase being worked on for a themed header when it starts
  const phase = toRestore[0].phase;
  if (redoCurrentPhase !== phase || redoCurrentPhase === null) {
    redoCurrentPhase = phase;
    showToast(`↻ ${phase.emoji} ${phase.name}`, phase.flavor, 1800, "restore");
  }

  // Maybe trigger a glitch moment on the genuinely CPU-heavy restores only
  const isGlitchy = toRestore.some(i =>
    i.stage === SYSTEM_UNDO_STAGES.CSS_FILTER
    || i.stage === SYSTEM_UNDO_STAGES.CSS_TEXT
    || i.stage === SYSTEM_UNDO_STAGES.EDITOR_CARD
  );
  if (isGlitchy) triggerGlitchEvent();

  // Restore each selected component (with a tiny stagger so a combo feels alive)
  let delay = 0;
  const step = Math.min(40, Math.max(12, 140 / toRestore.length));
  toRestore.forEach((item) => {
    setTimeout(() => {
      restoreSingleStage(item.stage);
    }, delay);
    delay += step;
  });

  // Finalize UI after the stagger + show per-component flavor
  setTimeout(() => {
    const last = toRestore[toRestore.length - 1];
    const flavor = RESTORE_FLAVOR[last.stage];
    if (flavor) {
      showToast(
        toRestore.length > 1
          ? `↻ Restored ${toRestore.length} parts`
          : `↻ ${phase.emoji} ${phase.name}`,
        flavor,
        2000,
        "restore"
      );
    }
    if (redoTotalStages > 0) {
      const pct = Math.min(100, Math.round((restoredStageCount / redoTotalStages) * 100));
      const bar = document.getElementById("toast-progress-fill");
      if (bar) bar.style.width = `${pct}%`;
    }
    updateRedoStatus();
    updateUndoIndicatorState();
    updateHistoryUI();
    updateToolbarState();
    checkRedoMilestones();
  }, delay);
}

function checkRedoMilestones() {
  if (redoTotalStages === 0) return;
  const pct = restoredStageCount / redoTotalStages;
  const bar = document.getElementById("toast-progress-fill");
  if (bar) bar.style.width = `${Math.min(100, Math.round(pct * 100))}%`;

  for (const m of REDO_MILESTONES) {
    if (pct >= m.at && !milestoneFired.has(m.at)) {
      milestoneFired.add(m.at);
      if (m.at >= 1) {
        // Final celebration
        fireConfetti();
        showToast(`${m.emoji} ${m.title}`, `${m.msg} ${restoredStageCount}/${redoTotalStages} components back.`, 4000, "restore");
      } else {
        fireConfetti();
        showToast(`${m.emoji} ${m.title}`, `${m.msg} ${restoredStageCount}/${redoTotalStages} components back.`, 3000, "restore");
      }
      break;
    }
  }
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
  const hasSystemUndo = systemUndoStage > 0 && systemUndoStage <= LAST_STAGE;

  if (hasSystemUndo) {
    // Show remaining system steps
    const remaining = LAST_STAGE - systemUndoStage;
    if (historyCount) historyCount.textContent = remaining > 0 ? remaining : "0";
    if (undoBtn) undoBtn.disabled = false;
  } else {
    if (historyCount) historyCount.textContent = undoSteps;
    if (undoBtn) undoBtn.disabled = undoSteps === 0;
  }

  // During system undo, redo button should always be available
  if (systemRedoStack.length > 0) {
    if (redoBtn) redoBtn.disabled = false;
  } else {
    if (redoBtn) redoBtn.disabled = redoHistory.length === 0;
  }
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================

let toastTimeout = null;
function showToast(title, message, duration = 3000, type = "warning") {
  if (!systemToast || !toastTitle || !toastMessage) return;

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  // Set toast type (warning, danger, or restore)
  systemToast.classList.remove("danger", "restore");
  if (type === "danger") {
    systemToast.classList.add("danger");
  } else if (type === "restore") {
    systemToast.classList.add("restore");
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
    if (systemRedoStack.length > 0) {
      performSystemRedo();
    } else {
      redo();
    }
  });
}

// Big Red Redo Button on final state
if (bigRedoBtn) {
  bigRedoBtn.addEventListener("click", () => {
    if (systemRedoStack.length > 0) {
      performSystemRedo();
    }
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
    if (systemRedoStack.length > 0) {
      // System Redo — restore the website from the stack
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