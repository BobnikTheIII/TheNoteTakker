# NoteTakker
*Note in peace!*

NoteTakker is a modern, AI-powered web application that transforms your audio recordings (meetings, lectures, voice memos) into accurate text transcriptions, smart summaries, and actionable tasks. Built with a decoupled architecture using a .NET Web API backend and a Next.js frontend, it leverages the power of Google's Gemini AI (other models accepted, edit in your own .env) via Microsoft's Semantic Kernel.

## Features

- **Drag & Drop Interface:** Easily upload audio files (MP3, WAV) with a modern, user-friendly UI.
- **Two-Step AI Processing:** 1. **Transcribe:** Extracts pure text from your audio.
  2. **Analyze:** Lets you provide custom prompts to tell the AI exactly how to process the transcript.
- **Smart Extraction:** Automatically generates concise summaries and extracts Action Items with assigned owners.
- **Export to .txt:** Download your full transcript and AI-generated notes locally with a single click.
- **Stateless & Secure:** No databases involved. Your data is processed in-memory and immediately discarded after use.

## Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (React Framework)
- [Tailwind CSS](https://tailwindcss.com/) (Styling)
- [Lucide React](https://lucide.dev/) (Icons)

**Backend:**
- [.NET Web API](https://dotnet.microsoft.com/) (C# Minimal APIs)
- [Microsoft Semantic Kernel](https://github.com/microsoft/semantic-kernel) (AI Orchestration)
- [Google Gemini API](https://ai.google.dev/) (model configurable via the `LLM_MODEL` env var, e.g. `gemini-3.1-flash-lite`)

## Project Structure

```
TheNoteTakker/
  NoteTakker.Api/     # .NET minimal-API backend (transcribe + generate-notes)
  notetakkerapp/      # Next.js frontend (the web UI)
  NoteTakker/         # standalone console prototype (early transcription experiment)
```

## Getting Started

### Prerequisites
- Node.js and `pnpm` (v10+ recommended)
- .NET 8.0 SDK (or newer)
- A valid Google Gemini API Key

### 1. Backend (`NoteTakker.Api`)

Create a `.env` file inside `NoteTakker.Api/`:

```bash
API_KEY=your_google_gemini_api_key
LLM_MODEL=gemini-3.1-flash-lite
```

Then run the API:

```bash
cd NoteTakker.Api
dotnet run
```

The API starts on **http://localhost:5095** (Swagger UI is available at
`/swagger` in Development). CORS is preconfigured to allow the frontend at
`http://localhost:3000`.

### 2. Frontend (`notetakkerapp`)

```bash
cd notetakkerapp
pnpm install
pnpm dev
```

Open **http://localhost:3000**. The UI calls the backend at
`http://localhost:5095`, so keep the API running.

## API

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `POST` | `/transcribe` | `multipart/form-data` with a `file` (audio) | `{ transcript }` |
| `POST` | `/generate-notes` | JSON `{ transcript, customPrompt? }` | `{ summary, actionItems: [{ task, assignee }] }` |

## Usage

1. Drag & drop (or select) an audio file and click **Transcribe** — the backend
   returns a clean transcript.
2. Review/edit the transcript, optionally add a **custom prompt** telling the AI
   how to process it, and generate notes.
3. Read the **summary** and extracted **action items**, then export everything to
   a `.txt` file.
