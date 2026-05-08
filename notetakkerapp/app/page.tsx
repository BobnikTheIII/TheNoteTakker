"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileAudio, Loader2, CheckSquare, FileText, AlertCircle, Download, Sparkles } from "lucide-react";

interface ActionItem {
  task: string;
  assignee: string;
}

interface MeetingNotes {
  summary: string;
  actionItems: ActionItem[];
}

type AppStep = "idle" | "transcribing" | "review_transcript" | "generating_notes" | "success" | "error";

export default function Home() {
  const [step, setStep] = useState<AppStep>("idle");
  const [file, setFile] = useState<File | null>(null);
  
  const [transcript, setTranscript] = useState<string>("");
  const [notes, setNotes] = useState<MeetingNotes | null>(null);
  
  const [customPrompt, setCustomPrompt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranscribe = async () => {
    if (!file) return;
    setStep("transcribing");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5095/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setStep("review_transcript"); 
    } catch (error: any) {
      console.error(error);
      setErrorMessage(`Błąd: ${error.message}`);
      setStep("error");
    }
  };

  const handleGenerateNotes = async () => {
    setStep("generating_notes");
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5095/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, customPrompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const data: MeetingNotes = await response.json();
      setNotes(data);
      setStep("success");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(`Błąd: ${error.message}`);
      setStep("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setTranscript("");
    setNotes(null);
    setCustomPrompt("");
    setStep("idle");
  };

  const handleDownloadTxt = () => {
    if (!transcript) return;
    
    let content = `--- TRANSKRYPCJA NAGRANIA ---\n\n${transcript}\n\n`;
    
    if (notes) {
      content += `--- PODSUMOWANIE AI ---\n\n${notes.summary}\n\n`;
      content += `--- ZADANIA DO WYKONANIA ---\n\n`;
      if (notes.actionItems.length === 0) {
        content += "Brak przypisanych zadań.\n";
      } else {
        notes.actionItems.forEach(item => {
          const assignee = item.assignee ? item.assignee : "Nieprzypisane";
          content += `- [ ] ${assignee}: ${item.task}\n`;
        });
      }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Notatki_AI_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="text-center mt-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Note<span className="text-green-600">Takker</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Note in peace!
          </p>
        </header>

        {(step === "idle" || step === "error") && (
          <div className="max-w-2xl mx-auto">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 
                ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"}`}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.length) setFile(e.target.files[0]); }} accept="audio/*" className="hidden" />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className={`p-4 rounded-full ${file ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                  {file ? <FileAudio size={40} /> : <UploadCloud size={40} />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{file ? file.name : "Upuść plik audio tutaj"}</h3>
                  <p className="text-slate-500 text-sm">{file ? "Gotowe do ekstrakcji tekstu." : "lub kliknij, aby wybrać (MP3, WAV)"}</p>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} /> <p>{errorMessage}</p>
              </div>
            )}

            {file && (
              <div className="mt-8 text-center">
                <button onClick={handleTranscribe} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium text-lg shadow-lg">
                  Rozpocznij Transkrypcję
                </button>
              </div>
            )}
          </div>
        )}

        {(step === "review_transcript" || step === "success") && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Transkrypcja</h2>
              <div className="flex gap-4">
                <button onClick={handleDownloadTxt} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-sm font-medium">
                  <Download size={16} /> Pobierz .txt
                </button>
                <button onClick={handleReset} className="text-sm text-blue-600 hover:underline px-4 py-2">
                  Zacznij od nowa
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg">
                {transcript}
              </p>
            </div>

            {step === "review_transcript" && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mt-8">
                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles size={20} className="text-blue-600"/> Co mam zrobić z tym tekstem?
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  Wpisz poniżej swoje polecenie (np. "Wypisz tylko listę zakupów" lub "Przetłumacz na angielski"). Jeśli zostawisz to pole puste, AI wygeneruje domyślne streszczenie i listę zadań.
                </p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Twoja instrukcja dla AI..."
                  className="w-full p-4 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24 mb-4"
                />
                <div className="flex justify-end">
                  <button onClick={handleGenerateNotes} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow transition-colors flex items-center gap-2">
                    <Sparkles size={16} /> Generuj Notatki
                  </button>
                </div>
              </div>
            )}
            
            {step === "success" && notes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={16}/> Wynik od AI
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {notes.summary}
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckSquare size={16}/> Wykryte Zadania
                  </h3>
                  <ul className="space-y-3">
                    {notes.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{item.task}</p>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded mt-1 inline-block">
                            {item.assignee || "Nieprzypisane"}
                          </span>
                        </div>
                      </li>
                    ))}
                    {notes.actionItems.length === 0 && <p className="text-slate-500 text-sm italic">Brak zadań.</p>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {(step === "transcribing" || step === "generating_notes") && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {step === "transcribing" ? "Słucham nagrania..." : "Generuję notatki..."}
            </h3>
            <p className="text-slate-500 text-sm">
              {step === "transcribing" ? "Wyciągam tekst z pliku audio. Proszę czekać." : "Sztuczna inteligencja analizuje Twój tekst..."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}