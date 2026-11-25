# AI Study Buddy Assistant

A study website with a **Node.js + Express backend** that uses the **Google Gemini API** (`@google/genai`) for every AI feature.
It runs in a normal browser. It does not depend on Claude or on any other AI service.

**Features:** AI Doubt Solver (also explains topics and summarizes notes), file questions (PDF, Word `.docx`, PowerPoint `.pptx`, TXT, JPG/PNG images), Notes Generator, Quiz Generator, Study Timetable, Progress Tracking, voice input and read-aloud, copy buttons on code, dark/light theme.

> Your chats, quiz scores, timetable and progress are saved **in your own browser** (no accounts, no database).

---

## Which files are which (handy for screenshots)

| Part | Files | What they do |
|---|---|---|
| **Frontend** (what you see) | `frontend/index.html`, `frontend/css/styles.css`, `frontend/js/app.js` | Page layout, design, buttons, reading PDF/Word/PowerPoint files in the browser |
| **Backend** (the server) | `server.js` | Starts the Express server, serves the website, protects against too many requests |
| | `backend/routes/ai.js` | The three API routes: `/api/chat`, `/api/json`, `/api/title` |
| | `backend/gemini.js` | **All Gemini calls** using the official `@google/genai` SDK |
| | `backend/prompts.js`, `backend/utils.js` | The instructions given to Gemini, and input checks |
| **Settings** | `.env.example`, `package.json`, `.gitignore`, `vercel.json`, `api/index.js` | Configuration. `api/index.js` + `vercel.json` are only for Vercel |

## Run it on Windows 11

1. **Install Node.js:** download the **LTS** version from https://nodejs.org and install it (keep all defaults). Restart your computer if asked.
2. **Unzip** the project, for example to `C:\ai-study-buddy`.
3. **Open a terminal in that folder:** open the folder in File Explorer, click the address bar, type `cmd` and press Enter.
4. Install the packages (needs internet, takes about a minute):
   ```
   npm install
   ```
5. **Add your Gemini API key:**
   - Get a free key at https://aistudio.google.com/apikey (sign in with Google, click **Create API key**).
   - Create your settings file by running: `copy .env.example .env`
   - Open `.env` in Notepad and paste the key after `GEMINI_API_KEY=` (no spaces, no quotes). Save.
6. Start the server:
   ```
   npm start
   ```
7. Open **http://localhost:3000** in Chrome or Edge.

**Check that the key works:** open http://localhost:3000/api/health. You should see `"geminiKeyFound":true`.
**Run the offline self-test (no key needed):** `npm test`

To stop the server press `Ctrl + C`. After changing `.env`, stop and start it again.

## Put it on GitHub

Your key must **never** be uploaded. The file `.gitignore` already blocks `.env`.

With GitHub Desktop (easiest): install it from https://desktop.github.com, choose **File > Add local repository**, pick the project folder, click **Create repository** if asked, then **Publish repository**. Make sure `.env` is *not* listed in the changed files.

With commands:
```
git init
git add .
git commit -m "AI Study Buddy"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/ai-study-buddy.git
git push -u origin main
```
(Create the empty repository on github.com first.)

## Deploy on Vercel

1. Go to https://vercel.com, sign in with GitHub, click **Add New > Project** and import your repository.
2. **Framework Preset:** choose **Other**. Leave the build settings as they are (`vercel.json` already sets the output folder to `frontend`).
3. Open **Environment Variables** and add:
   - `GEMINI_API_KEY` = your key
   - `GEMINI_MODEL` = `gemini-2.5-flash`
4. Click **Deploy**. When it finishes, open the link and check `/api/health` on your new address.

If you change the variables later, redeploy for them to apply.

## Good to know

- **Anyone with your website link can use your Gemini quota.** The server limits each visitor to 40 AI requests a minute, but keep the link private if you are worried, and never share your key.
- Files are read **in the browser** (PDF, Word, PowerPoint text; images are shrunk to JPEG), then only the text/image is sent to your server and on to Gemini. Old `.ppt` and `.doc` files can't be read: re-save them as `.pptx` / `.docx`.
- Limits: images 5 MB, PowerPoint 20 MB, other files 10 MB, up to 5 files per message. Vercel accepts about 4.5 MB per request, so very large documents may be refused.
- The page loads some libraries and fonts from the internet (cdnjs, Google Fonts), so you need to be online.
- Voice input uses the browser's speech recognition (works in Chrome and Edge). Read-aloud uses the voices installed on your device.
- The free Gemini plan has rate limits. If you see "free limit was reached", wait a minute.

## If something goes wrong

| Message | What to do |
|---|---|
| `GEMINI_API_KEY is missing` | Check the `.env` file name and that the key is pasted after `=`; restart `npm start` |
| `Gemini rejected the API key` | Create a new key at aistudio.google.com/apikey |
| `Can't reach the server` | The server isn't running: run `npm start` and use http://localhost:3000 |
| `npm is not recognized` | Install Node.js (step 1) and open a new terminal |
