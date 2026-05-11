# NoteTakker
*Note in peace!*

NoteTakker AI is a modern, AI-powered web application that transforms your audio recordings (meetings, lectures, voice memos) into accurate text transcriptions, smart summaries, and actionable tasks. Built with a decoupled architecture using a .NET Web API backend and a Next.js frontend, it leverages the power of Google's Gemini AI via Microsoft's Semantic Kernel.

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
- [Google Gemini API](https://ai.google.dev/) (Model: `gemini-3.1-flash-lite`)

## Getting Started

### Prerequisites
- Node.js and `pnpm` (v10+ recommended)
- .NET 8.0 SDK (or newer)
- A valid Google Gemini API Key

### Backend Setup (.NET)
1. Navigate to the backend directory:
   ```bash
   cd NoteTakker.Api
