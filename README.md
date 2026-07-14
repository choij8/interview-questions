# STAR Bank — Behavioural Interview Question Tracker

A lightweight, single-page tracker for building and rehearsing behavioural interview
answers using the STAR method (Situation, Task, Action, Result). No build step, no
backend — pure HTML/CSS/JS, data saved to your browser's local storage.

## Features

- **Add / edit / delete** behavioural questions
- Structured **STAR fields** per question, plus optional delivery notes
- **Completeness indicator** on each card (S/T/A/R segments) so you can see at a glance
  which answers still need work
- **Search** across questions and STAR content
- **Category filter chips** (Leadership, Conflict, Failure, Teamwork, etc. — categories
  are freeform, just type your own)
- **Sort** by recently updated, incomplete-first, or A–Z
- **Practice mode** — flashcard-style random question with a reveal toggle, good for
  rehearsing out loud before saying the answer
- **Export / Import** as JSON, so you can back up your bank or move it between devices
- Seeded with two example records based on real-sounding project work, so the app isn't
  empty on first load — edit or delete them right away

## Running locally

No build step needed. Just open `index.html` in a browser, or serve the folder:

```bash
cd star-tracker
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this folder to a new GitHub repository.
2. In the repo settings, go to **Pages**.
3. Under **Source**, select the branch (usually `main`) and root folder (`/`).
4. Save — your tracker will be live at `https://<username>.github.io/<repo-name>/`.

## Data & privacy

All data is stored in your browser's `localStorage` under the key
`star_bank_questions_v1` — nothing is sent anywhere. This means:

- Data is per-browser, per-device. Use **Export** regularly to back up, and **Import**
  to bring your bank to another device or browser.
- Clearing your browser's site data for this page will erase your questions unless
  you've exported a backup first.

## File structure

```
star-tracker/
├── index.html      # App structure & modals
├── style.css        # Styling (dark, data-console aesthetic)
├── script.js         # State, CRUD logic, storage, practice mode
└── README.md
```

## Customising

- **Categories** are freeform text with autocomplete suggestions pulled from your
  existing questions — no fixed list to edit.
- To change the accent colour or fonts, edit the `:root` variables at the top of
  `style.css`.
- To change or remove the seeded example questions, edit the `seedData()` function in
  `script.js`.
