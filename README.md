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

A simple web-based editor with a normal Undo/Redo system.

But once there is nothing left to undo, pressing **Ctrl+Z** activates **System Undo** — progressively removing the website itself until nothing remains.

## The Problem (that doesn't exist)

Modern software has one serious problem:

> **Undo stops when you run out of things to undo.**

Why should it?

What if we could undo the toolbar?

The sidebar?

The CSS?

The entire website?

We decided this absolutely needed to be solved.

## The Solution (that nobody asked for)

**Undo the Website** takes Ctrl+Z way too seriously.

After all user actions have been undone, the website begins undoing **itself**:

```text
USER HISTORY EXHAUSTED

        ↓

SYSTEM UNDO ACTIVATED

        ↓

Undoing footer...

        ↓

Undoing sidebar...

        ↓

Undoing CSS...

        ↓

Undoing toolbar...

        ↓

Undoing header...

        ↓

Undoing editor...

        ↓

UNDO BUTTON UNSTABLE

        ↓

404 — THIS WEBSITE HAS BEEN UNDONE
```

Please stop pressing Ctrl+Z.

---

## Technical Details

### Technologies/Components Used

**Languages**

* HTML
* CSS
* JavaScript

**Framework / Build Tool**

* Vite

**Libraries**

* Vanilla JavaScript
* GSAP *(if required for animations)*

**Tools**

* VS Code
* Git
* GitHub
* Vercel / Netlify

### Architecture

The project intentionally uses a simple architecture:

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

   ↙          ↘

 No           Yes

 ↓             ↓

Normal Undo   System Undo

                 ↓

          Website Destruction

                 ↓

                404
```

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

### Current Focus

**Normal Undo/Redo implementation**

The UI foundation is currently in place. The next step is to implement and test the normal editor history before adding the System Undo destruction sequence.

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

#### 2. System Undo

![System Undo](screenshots/system-undo.png)

*The moment Ctrl+Z stops undoing user actions and starts undoing the application.*

#### 3. Final State

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

*The demo shows normal editing, regular Undo/Redo, followed by the System Undo sequence that progressively destroys the website.*

### Additional Demos

* Live Demo: [Add deployed URL]
* GitHub Repository: https://github.com/ASP-31/useless_project_temp

---

## Team Contributions

### Arjun S Pai

* [Add specific contributions]

### Ahmed Nasim

* Project setup and development
* Undo/Redo history system
* System Undo logic
* UI and destruction sequence
* Testing and deployment

---

## Why?

Because apparently,

**Ctrl+Z wasn't powerful enough.**

---

Made with questionable decisions at **TinkerHub Useless Projects**.

![TinkerHub](https://img.shields.io/badge/TinkerHub-Useless%20Projects-000000)

![Useless Projects](https://img.shields.io/badge/UselessProjects--26-26-000000)
