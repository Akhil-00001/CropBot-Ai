# CropBot: farming assistant for Uttarakhand

Farmers choose their district (all 13 districts of Uttarakhand), altitude, water source and crop, then ask:

- **What should I sow?** CropBot answers for that district, altitude band and current season.
- **My crop is failing.** CropBot gives the likely causes, field checks, immediate steps, and when to go to the KVK.

Answers come in English or Hindi.

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
