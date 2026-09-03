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
const exportBtn = document.querySelector(".btn-secondary");

// ==========================================
// DOCUMENTS
// ==========================================

const documents = [
  {
    id: 1,
    name: "Document1",
    content: editor.innerHTML,
  },
];

let activeDocumentId = 1;
let nextDocumentId = 2;

// ==========================================
// USER HISTORY
// ==========================================

const history = [];
const redoHistory = [];

// ==========================================
// SAVE EDITOR STATE
// ==========================================

function saveState() {
  const currentState = editor.innerHTML;

  if (
    history.length > 0 &&
    history[history.length - 1] === currentState
  ) {
    return;
  }

  history.push(currentState);

  // New edit clears redo history
  redoHistory.length = 0;

  updateHistoryUI();
}

// ==========================================
// UNDO
// ==========================================

function undo() {
  // System Undo will be added here later
  if (history.length <= 1) {
    return;
  }

  const currentState = history.pop();

  redoHistory.push(currentState);

  const previousState = history[history.length - 1];

  editor.innerHTML = previousState;

  updateActiveDocumentContent();
  updateHistoryUI();
}

// ==========================================
// REDO
// ==========================================

function redo() {
  if (redoHistory.length === 0) {
    return;
  }

  const nextState = redoHistory.pop();

  history.push(nextState);

  editor.innerHTML = nextState;

  updateActiveDocumentContent();
  updateHistoryUI();
}

// ==========================================
// HISTORY UI
// ==========================================

function updateHistoryUI() {
  const undoSteps = Math.max(history.length - 1, 0);

  historyCount.textContent = undoSteps;

  undoBtn.disabled = undoSteps === 0;
  redoBtn.disabled = redoHistory.length === 0;
}

// ==========================================
// UPDATE ACTIVE DOCUMENT
// ==========================================

function updateActiveDocumentContent() {
  const activeDocument = documents.find(
    (item) => item.id === activeDocumentId
  );

  if (activeDocument) {
    activeDocument.content = editor.innerHTML;
  }
}

// ==========================================
// RENDER DOCUMENTS
// ==========================================

function renderDocuments() {
  // Clear current sidebar
  sidebarNav.innerHTML = "";

  // Create each document
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

    // Switch document when clicked
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

  // Save current document
  updateActiveDocumentContent();

  // Find selected document
  const selectedDocument = documents.find(
    (item) => item.id === documentId
  );

  if (!selectedDocument) {
    return;
  }

  // Change active document
  activeDocumentId = documentId;

  // Load its content
  editor.innerHTML = selectedDocument.content;

  // Update title
  documentTitle.value = `${selectedDocument.name}.txt`;

  // Reset history for this document
  history.length = 0;
  redoHistory.length = 0;

  saveState();

  // Re-render sidebar
  renderDocuments();

  editor.focus();
}

// ==========================================
// ADD DOCUMENT
// ==========================================

addDocumentBtn.addEventListener("click", () => {
  // Save current document first
  updateActiveDocumentContent();

  // Create new document
  const newDocument = {
    id: nextDocumentId,
    name: `Document${nextDocumentId}`,
    content: "<p></p>",
  };

  // Add it to our document list
  documents.push(newDocument);

  // Make it active
  activeDocumentId = newDocument.id;

  // Prepare next document number
  nextDocumentId++;

  // Load the new document
  editor.innerHTML = newDocument.content;

  // Update title
  documentTitle.value = `${newDocument.name}.txt`;

  // Reset history
  history.length = 0;
  redoHistory.length = 0;

  saveState();

  // IMPORTANT:
  // Rebuild the sidebar so the new document appears
  renderDocuments();

  // Focus editor
  editor.focus();
});

// ==========================================
// DOCUMENT TITLE
// ==========================================

documentTitle.addEventListener("input", () => {
  const activeDocument = documents.find(
    (item) => item.id === activeDocumentId
  );

  if (!activeDocument) {
    return;
  }

  let newName = documentTitle.value
    .replace(/\.txt$/i, "")
    .trim();

  if (newName === "") {
    newName = `Document${activeDocument.id}`;
  }

  activeDocument.name = newName;

  renderDocuments();
});

// ==========================================
// EDITOR INPUT
// ==========================================

editor.addEventListener("input", () => {
  saveState();

  updateActiveDocumentContent();
});

// ==========================================
// UNDO BUTTON
// ==========================================

undoBtn.addEventListener("click", () => {
  undo();
});

// ==========================================
// REDO BUTTON
// ==========================================

redoBtn.addEventListener("click", () => {
  redo();
});

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener("keydown", (event) => {
  const modifier = event.ctrlKey || event.metaKey;

  if (!modifier) {
    return;
  }

  // Ctrl + Z / Cmd + Z
  if (event.code === "KeyZ") {
    event.preventDefault();

    undo();
  }

  // Ctrl + Y / Cmd + Y
  if (event.code === "KeyY") {
    event.preventDefault();

    redo();
  }
});

// ==========================================
// SAVE BUTTON
// ==========================================

saveBtn.addEventListener("click", () => {
  updateActiveDocumentContent();

  saveBtn.textContent = "Saved";

  setTimeout(() => {
    saveBtn.textContent = "Save";
  }, 1000);
});

// ==========================================
// EXPORT CURRENT DOCUMENT AS PDF
// ==========================================

exportBtn.addEventListener("click", () => {
  const activeDocument = documents.find(
    (item) => item.id === activeDocumentId
  );

  if (!activeDocument) {
    return;
  }

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${activeDocument.name}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 60px auto;
            padding: 0 40px;
            line-height: 1.6;
            color: #1e293b;
          }

          h1, h2, h3 {
            line-height: 1.3;
          }

          img {
            max-width: 100%;
          }

          blockquote {
            border-left: 4px solid #6366f1;
            padding-left: 16px;
            color: #64748b;
          }

          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
          }
        </style>
      </head>

      <body>
        ${activeDocument.content}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
});

// ==========================================
// INITIALIZE
// ==========================================

documentTitle.value = "Document1.txt";

renderDocuments();

saveState();

updateHistoryUI();