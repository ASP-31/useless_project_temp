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

After all user actions have been undone, the website begins undoing **itself**.

```text
USER HISTORY EXHAUSTED

        ↓

SYSTEM UNDO ACTIVATED

        ↓

Undoing footer...

        ↓

Undoing sidebar...

        ↓

Undoing bottom action bar...

        ↓

Undoing toolbar...

        ↓

Undoing editor...

        ↓

Undoing header...

        ↓

UNDO BUTTON UNSTABLE

        ↓

Undoing CSS...

        ↓

404 — THIS WEBSITE HAS BEEN UNDONE
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
Normal Undo   System Undo
                 ↓
          Website Destruction
                 ↓
                404
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
* White `texto` branding in dark mode
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
* [x] `texto` branding
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

### Current Focus

**System Undo / Website Destruction**

The normal editor functionality and Undo/Redo foundation are now in place, and the core concept of the project has been implemented:

> **When user history reaches zero, Ctrl+Z stops undoing the document and starts undoing the website itself.**

Once System Undo is activated, each press of Ctrl+Z removes a single component of the interface until the website is fully undone. The complete, ordered sequence is documented in the [System Undo — The Destruction Sequence](#system-undo--the-destruction-sequence) section below.

The destruction state is also now **persistent** — it survives a page reload (see [Persistence](#persistence)).

---

## System Undo — The Destruction Sequence

This is the core idea of the project and is now fully implemented.

It starts as a normal rich text editor. The gimmick: once the normal editor undo history reaches zero, **Ctrl+Z starts undoing the website itself**.

```text
NORMAL UNDO
    ↓
History reaches 0
    ↓
SYSTEM UNDO ACTIVATED
    ↓
Website components are destroyed, one Ctrl+Z at a time
    ↓
UNDO BUTTON UNSTABLE
    ↓
404 — THIS WEBSITE HAS BEEN UNDONE
```

From this point on, each press of **Ctrl+Z** (or click of the Undo button) removes a single component of the interface. **Ctrl+Y / Ctrl+Shift+Z** (or the Redo button) restores the most recently destroyed component, and the "Undo the Undo" reconstruction flow rebuilds the entire website.

### Destruction Order

The destruction happens in a deterministic, granular sequence — one element or component per undo.

1. **Footer is destroyed**

   * Privacy
   * Terms
   * GitHub link
   * Status
   * Footer container

2. **Sidebar components are destroyed**

   * Storage indicator
   * Add Document
   * Document list
   * Sidebar header
   * Sidebar container

3. **Bottom action bar is destroyed**

   * More Options
   * Download
   * Link
   * Emoji
   * Delete
   * Save

4. **Editor toolbar components are destroyed**

   * Color
   * Alignment
   * Clear formatting
   * Underline
   * Bold
   * Text style

5. **Editor is destroyed**

   * Text content
   * Editor container
   * Editor card

6. **Navbar / header is destroyed component-by-component**

   * Export
   * Theme toggle
   * Save status
   * Document title
   * System status
   * Branding
   * Header

7. **Remaining undo controls are destroyed**

   * History counter
   * Redo button
   * Undo button — **"UNDO BUTTON UNSTABLE"**

8. **The stylesheet is removed**

   With the undo button gone, the final remaining tool of resistance — the CSS — is undone. The page drops to raw, unstyled HTML.

9. **Final 404 / "WEBSITE UNDONE" state**

The last stage collapses the page into the final **404 — THIS WEBSITE HAS BEEN UNDONE** state. From there, the website can only be reconstructed through the application's "Undo the Undo" mechanism, which rebuilds every component over a dramatic 12-second loading sequence.

### Persistence

The destruction state has been made **persistent using `localStorage`**. This is a major completed feature because reloading the page no longer restores the website:

* Reloading after destroying the footer keeps the footer destroyed.
* Reloading after destroying the sidebar keeps the sidebar destroyed.
* Reaching the final 404 state, then reloading, keeps the website in that undone state.
* The website can only be brought back via the application's undo/redo reconstruction mechanism.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/ASP-31/useless_project_temp.git
```

Navigate into the project:

```bash
cd useless_project_temp/undo-the-website
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

## Build

Create a production build:

```bash
npm run build
```

---

## Project Documentation

### Screenshots

> Screenshots are not added to the repository yet. The sections below are reserved placeholders for the final submission.

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

*Workflow diagram pending — add `screenshots/workflow.png` before final submission.*

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
