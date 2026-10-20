# CropBot: farming assistant for Uttarakhand

Farmers choose their district (all 13 districts of Uttarakhand), altitude, water source and crop, then ask:

- **What should I sow?** CropBot answers for that district, altitude band and current season.
- **My crop is failing.** CropBot gives the likely causes, field checks, immediate steps, and when to go to the KVK.

Answers come in English or Hindi.

```
NewKrishiWork/
├── frontend/              Static site (HTML/CSS/JS, no build step)
│   ├── index.html
│   ├── styles.css
│   ├── app.js             Chat logic: profile form, streaming, safe Markdown rendering
│   └── config.js          Backend URL (local vs production)
└── backend/               Node API (deploys to Vercel as serverless functions)
    ├── api/chat.js        POST /api/chat: validates input, streams the reply
    ├── api/health.js      GET  /api/health
    ├── lib/prompt.js      System prompt: the answer formats and rules  <-- tune this
    ├── lib/districts.js   District reference notes (verify these!)
    ├── lib/llm.js         Picks the AI provider from the key that is set
    ├── lib/providers/     groq.js, anthropic.js: the only code that calls an AI API
    ├── lib/cors.js        Allows the frontend's origin to call the API
    └── server.js          Local dev server (same handlers as Vercel)
```

## Run locally

Requires Node.js 20.12 or newer.

**1. Backend** (terminal 1)

```bash
cd backend
npm install
cp .env.example .env        # then paste your key into .env
npm start                   # http://localhost:3001
```

**2. Frontend** (terminal 2)

```bash
cd frontend
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173. The dot in the chat header turns orange if the frontend can't reach the backend.

## Deploy to Vercel (two projects)

1. **Backend:** import the repo in Vercel and set **Root Directory = `backend`**. Add these environment variables:
   - `GROQ_API_KEY` (or `ANTHROPIC_API_KEY`): your key
   - `ALLOWED_ORIGINS`: your frontend URL, e.g. `https://cropbot.vercel.app`
2. **Frontend:** import the same repo again with **Root Directory = `frontend`**, framework "Other", and no build command.
3. Put the backend URL in `frontend/config.js` (`PRODUCTION_API_URL`) and redeploy the frontend.

## AI provider

The backend picks the provider from whichever key is in `backend/.env`:

| Key | Provider | Default model |
|---|---|---|
| `GROQ_API_KEY=gsk_...` | Groq | `openai/gpt-oss-120b` |
| `ANTHROPIC_API_KEY=sk-ant-...` | Anthropic (Claude) | `claude-opus-5-5` |

If both are set, Groq wins. Override the model with `CROPBOT_MODEL`. Each provider lives in `backend/lib/providers/`; to add Gemini or OpenAI, add a file there with the same `streamReply({ system, messages, onText })` function and one line in `backend/lib/llm.js`.

## Before you call it "done"

- **Verify `lib/districts.js`.** The district notes are general orientation written without a source check. Compare them with your district KVK / state agriculture department material and correct them. The model's advice is only as good as this context.
- **Evaluate the answers.** Write 20-30 realistic farmer questions across plains, mid hills and high hills. Have an agronomist or KVK scientist rate CropBot's answers (correct / partly / wrong / unsafe). Record the results; that is your project's evidence.
- **Protect your API key and credits.** The key stays on the server and is never sent to the browser. But anyone who finds the public URL can still use up your credits. Add rate limiting (for example Vercel Firewall or Upstash) before sharing widely.
- **Not yet built:** live weather, soil test input, and image upload of diseased leaves. These are the natural next steps.
