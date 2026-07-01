# BigQuery Pulse ⚡
> A premium, dark-mode real-time explorer for Google Cloud BigQuery Release Notes.

BigQuery Pulse is a lightweight, responsive web application that fetches, structures, and displays the latest release notes from Google Cloud BigQuery. Built with a Flask backend and a plain HTML, JavaScript, and Vanilla CSS frontend, it offers advanced filtering, real-time search, and a mock Tweet Composer designed to share updates on X (Twitter).

---

## 🚀 Key Features

*   **Categorized Release Stream:** Release items are extracted from feed dates and parsed into individual categorized cards (*Features*, *Changes*, *Announcements*, *Breaking Updates*, and *Known Issues*) with custom-colored badges.
*   **Offline Resilience Cache:** Implements a fallback server-side cache. If Google's Atom feed is down or times out, the application displays the last cached snapshot with a warning banner.
*   **Interactive X (Twitter) Composer:** Select any update card to instantly load its details into a beautiful mock Tweet Card. Supports inline editing, character limit warnings (280-character limit), and one-click sharing via Twitter Web Intents.
*   **Instant Client-Side Filtering:** Search keywords or switch categories on the fly with zero page reloads.
*   **Glassmorphic UI Design:** High-end dark theme incorporating smooth transitions, CSS animations, custom scrollbars, and a responsive layout.

---

## 📁 Directory Structure

```text
bigquery_releases_app/
├── app.py                  # Flask application & Atom XML parsing engine
├── requirements.txt        # Python library dependencies
├── README.md               # Project documentation
├── .gitignore              # Git ignored files and directories
├── templates/
│   └── index.html          # Web application HTML5 entry point
└── static/
    ├── css/
    │   └── style.css       # Custom styles, transitions, and layout
    └── js/
        └── main.js         # Frontend state management, AJAX fetch, and search logic
```

---

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have **Python 3.8+** and **Git** installed on your system.

### 1. Clone the repository (or navigate to the folder)
```bash
cd bigquery_releases_app
```

### 2. Set up a Virtual Environment (Recommended)
Create and activate a virtual environment to isolate the project dependencies:

*   **Windows (PowerShell):**
    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    ```
*   **macOS / Linux:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

### 3. Install Dependencies
Install the required packages using pip:
```bash
pip install -r requirements.txt
```

---

## 💻 Running the Application

1. Run the Flask development server:
   ```bash
   python app.py
   ```
2. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```

---

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.
