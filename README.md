# Undo the Website

> **What if Ctrl+Z didn't know when to stop?**

An intentionally useless web editor where Undo goes beyond undoing your work — it starts undoing the **website itself**.

Built for the **TinkerHub Useless Projects** hackathon.

---

## Basic Details

### Team Name

**4Bit**

### Team Members

* **Arjun S Pai**
* **Ahmed Nasim**

### Project Description

A web-based rich text editor with a normal Undo/Redo system.

But once there is nothing left to undo, pressing **Ctrl+Z** activates **System Undo** — progressively removing the website itself until nothing remains.

---

## The Problem (that doesn't exist)

Modern software has one serious problem:

> **Undo stops when you run out of things to undo.**

Why should it?

What if we could undo the toolbar?

The sidebar?

The CSS?

The entire website?

We decided this absolutely needed to be solved.

---

## The Solution (that nobody asked for)

**Undo the Website** takes Ctrl+Z way too seriously.

After all user actions have been undone, the website begins undoing **itself** — one tiny component at a time.

```text
USER HISTORY EXHAUSTED

        ↓

SYSTEM UNDO ACTIVATED — 40 STAGES

        ↓

Footer: GitHub → Terms → Privacy → Status → Version → Entire footer
        ↓
Sidebar: Add Document → Storage → Doc List → Header → Entire sidebar
        ↓
CSS: Text corruption → ACTUAL STYLESHEET REMOVED (raw HTML!)
        ↓
Actions: More → Download → Link → Emoji → Delete → Save
        ↓
Toolbar: Clear → Color → Align → Underline → Bold → Style → Entire toolbar
        ↓
Editor: Content cleared → Editor card collapses with 3D perspective
        ↓
Header: Export → Theme → Status → Title → Brand → Entire header
        ↓
Indicator: Redo → Undo → Shortcuts → Counter → Entire indicator
        ↓
404 — WEBSITE UNDONE — Big Red Shaking REDO Button Appears
```

Please stop pressing Ctrl+Z.

---

## Technical Details

### Technologies / Components Used

**Languages**

* HTML
* CSS
* JavaScript

**Framework / Build Tool**

* Vite

**Libraries**

* Vanilla JavaScript

**Tools**

* VS Code
* Git
* GitHub
* Vercel / Netlify

### Architecture

The project uses a lightweight client-side architecture:

```text
User Interaction
       ↓
   Editor State
       ↓
 History Stack
       ↓
  Undo / Redo
       ↓
History Exhausted?
   ↙           ↘
 No             Yes
 ↓               ↓
Normal Undo   System Undo (40 stages)
                 ↓
     Individual Element Destruction
     (fade-out, slide, 3D collapse, CSS removal)
                 ↓
        404 — Big Red Shaking REDO Button
                 ↓
        Grouped Redo (8 shuffled groups)
                 ↓
        Website Rebuilt (random order)
```

---

## Implemented Features

### Rich Text Editor

The editor currently supports:

* Editable document area
* Headings
* Normal text
* Code formatting
* Bold
* Underline
* Text alignment
* Text color
* Clear formatting
* Emoji insertion
* Link insertion
* Word count
* Select all
* Clear content

### Document Management

* Create multiple documents
* Switch between documents
* Rename documents
* Delete documents
* Automatically persist documents using `localStorage`
* Restore documents after page refresh

### Undo / Redo System

A custom history system has been implemented for the editor.

Features include:

* Undo button
* Redo button
* `Ctrl + Z`
* `Ctrl + Y`
* `Ctrl + Shift + Z`
* User history counter
* Caret position restoration
* History snapshots based on editor state
* Redo history reset after new changes
* History handling for formatting operations

The system also captures typing intelligently instead of creating a history entry for every individual character.

### System Undo / Website Destruction

The core feature of the project — when user history is exhausted, Ctrl+Z starts removing website components one by one across **40 granular stages**.

#### Destruction Order (40 stages)

```text
FOOTER (6 stages):  GitHub → Terms → Privacy → Status → Version → Entire footer
SIDEBAR (5 stages): Add Doc → Storage → Doc List → Header → Entire sidebar
CSS (2 stages):     Text corruption → Stylesheet REMOVED (raw HTML)
ACTIONS (6 stages): More → Download → Link → Emoji → Delete → Save
TOOLBAR (7 stages): Clear → Color → Align → Underline → Bold → Style → Entire toolbar
EDITOR (2 stages):  Content cleared → Editor card 3D collapse
HEADER (6 stages):  Export → Theme → Status → Title → Brand → Entire header
INDICATOR (5 stages): Redo → Undo → Shortcuts → Counter → Entire indicator
FINAL (1 stage):    404 page with big red shaking REDO button
```

#### Redo / Website Rebuild

After complete destruction, a **big red shaking REDO button** appears on the 404 page. Clicking it (or Ctrl+Y) restores the website in **8 randomized groups**:

```text
Group 1: App Frame (Header + Footer + Sidebar)
Group 2: Header Internals (Brand + Title + Status + Buttons)
Group 3: Sidebar Internals (Docs + Add Button + Storage)
Group 4: Editor + Toolbar (Card + all formatting buttons)
Group 5: Action Bar (Save + Delete + Emoji + Link + Download + More)
Group 6: Content + CSS (Editor content + Stylesheet restored)
Group 7: Undo Indicator (Indicator + Counter + Shortcuts + Buttons)
Group 8: Footer Details (Version + Status + Privacy + Terms + GitHub)
```

Groups are **shuffled randomly** each time, so the rebuild order is different every session.

#### Animations

* **Destruction**: Fade-out, slide-out, 3D perspective collapse, CSS filter corruption, screen shake
* **Restore**: Fade-in with bounce, slide-in, 3D perspective reverse, green pulse, stylesheet re-insertion
* **Toast notifications**: Dramatic warnings (yellow) during undo, danger (red) for critical stages, green for restores
* **Dark mode**: All animations and colors adapt to the current theme

### Editor Actions

* Save document state
* Download document as `.txt`
* Export document through the browser print/PDF workflow
* Delete/reset documents
* Add emojis
* Insert links
* Word counting
* Clear editor content

### Sidebar

* Document list
* Active document indicator
* Add Document
* Sidebar collapse
* Sidebar restore
* Responsive sidebar behavior

### Dropdown Menus

Implemented interactive menus for:

* Text styles
* Text colors
* Emoji selection
* More options

Menus automatically close when clicking outside them.

### UI Feedback

The application includes:

* Save status
* System status indicator
* Toast notifications
* Undo/Redo state indicators
* Disabled Undo/Redo buttons when unavailable
* Button active states
* Hover interactions
* Screen shake/glitch animation foundations

### Dark Mode

A dark mode theme has now been implemented.

Features include:

* Light/Dark theme toggle
* Theme preference saved in `localStorage`
* Theme restored automatically after refresh
* Dark header
* Dark sidebar
* Dark editor
* Dark toolbar and menus
* Dark footer
* Dark Undo/Redo indicator
* Theme-aware buttons and controls
* White UndoApp branding in dark mode
* Smooth theme transition

---

## Current Development Status

### Phase 1 — Project Setup

* [x] Vite project setup
* [x] Vanilla JavaScript setup
* [x] Git repository initialized
* [x] `.gitignore` configured
* [x] Basic project structure

### Phase 2 — Editor UI

* [x] Header / navigation
* [x] UndoApp branding
* [x] System status indicator
* [x] Document title
* [x] Export button
* [x] Documents sidebar
* [x] Add Document button
* [x] Rich text editing area
* [x] Formatting toolbar
* [x] Bottom editor action bar
* [x] Save button
* [x] Footer
* [x] Floating Undo / Redo controls
* [x] User history counter
* [x] System toast container
* [x] Final 404 state

### Phase 3 — Editor Functionality

* [x] Rich text formatting
* [x] Text styles
* [x] Text colors
* [x] Text alignment
* [x] Emoji insertion
* [x] Link insertion
* [x] Document creation
* [x] Document switching
* [x] Document renaming
* [x] Document deletion
* [x] LocalStorage persistence
* [x] Save functionality
* [x] TXT download
* [x] PDF export workflow
* [x] Word count
* [x] Clear content
* [x] Select all

### Phase 4 — Undo / Redo

* [x] Custom history stack
* [x] Undo
* [x] Redo
* [x] Keyboard shortcuts
* [x] Caret restoration
* [x] History counter
* [x] Typing history optimization
* [x] Formatting history
* [x] Redo history management

### Phase 5 — UI / UX

* [x] Responsive layout
* [x] Sidebar collapse/restore
* [x] Dropdown interactions
* [x] Toast notifications
* [x] Active toolbar states
* [x] Hover states
* [x] Dark mode
* [x] Persistent theme preference
* [x] Theme-aware UI components

### Phase 6 — System Undo / Website Destruction

* [x] 40-stage granular destruction sequence
* [x] Individual element removal with fade-out animations
* [x] CSS stylesheet actually removed (raw unstyled HTML)
* [x] Screen shake on every undo step
* [x] Dramatic toast notifications for each stage
* [x] System status badge updates (Ready → Warning → Critical)
* [x] Undo indicator warning/unstable states
* [x] 404 page with big red shaking redo button
* [x] Grouped redo system (8 groups, shuffled random order)
* [x] Restore animations (fade-in, slide-in, 3D perspective reverse)
* [x] Green pulse on each redo step
* [x] Dark mode support for all destruction/restore animations
* [x] Full redo capability (Ctrl+Y or redo button)

### Current Focus

**System Undo / Website Destruction — COMPLETE**

The core concept of the project is fully implemented:

> **When user history reaches zero, Ctrl+Z stops undoing the document and starts undoing the website itself — one component at a time across 40 stages.**

After complete destruction, a big red shaking REDO button appears. Clicking it restores the website in **randomized groups** — each rebuild order is different.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/ASP-31/useless_project_temp.git
```

Navigate into the project:

```bash
cd useless_project_temp
```

Install dependencies:

```bash
npm install
```

---

## Run

Start the development server:

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

---

## Project Documentation

### Screenshots

#### 1. Editor

![Editor](screenshots/editor.png)

*The normal editor before the website realizes what is about to happen.*

#### 2. Dark Mode

![Dark Mode](screenshots/dark-mode.png)

*The same editor after embracing the darkness.*

#### 3. System Undo

![System Undo](screenshots/system-undo.png)

*The moment Ctrl+Z stops undoing user actions and starts undoing the application.*

#### 4. Final State

![Website Undone](screenshots/website-undone.png)

*The inevitable result: the website has successfully undone itself.*

---

## Workflow

![Workflow](screenshots/workflow.png)

*The application transitions from normal user history to system-level destruction once the undo history is exhausted.*

---

## Project Demo

### Video

[Add demo video link here]

*The demo shows document editing, formatting, multiple documents, normal Undo/Redo, Dark Mode, and eventually the System Undo sequence.*

### Additional Demos

* Live Demo: [Add deployed URL]
* GitHub Repository: https://github.com/ASP-31/useless_project_temp

---

## Team Contributions

### Arjun S Pai

* Project development
* UI / UX development
* [Add specific contributions]

### Ahmed Nasim

* Project setup and development
* Undo/Redo history system
* Editor functionality
* Document management
* LocalStorage persistence
* System Undo logic
* UI and destruction sequence
* Dark Mode implementation
* Testing and deployment

---

## Why?

Because apparently,

**Ctrl+Z wasn't powerful enough.**

---

Made with questionable decisions at **TinkerHub Useless Projects**.

![TinkerHub](https://img.shields.io/badge/TinkerHub-Useless%20Projects-000000)

![Useless Projects](https://img.shields.io/badge/UselessProjects--26-26-000000)
