using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Text.Json;
using DotNetEnv;
  
Env.Load();

Console.WriteLine("Uruchamiam Generator Notatek AI...");

string apiKey = Env.GetString("GOOGLE_API_KEY");
string modelId = "gemini-3.1-flash-lite";

if (string.IsNullOrWhiteSpace(apiKey))
{
    Console.WriteLine("BŁĄD: Nie znaleziono klucza API! Upewnij się, że masz plik .env ze zmienną GOOGLE_API_KEY.");
    return;
}

var builder = Kernel.CreateBuilder();
builder.AddGoogleAIGeminiChatCompletion(modelId: modelId, apiKey: apiKey);
Kernel kernel = builder.Build();

// Pobieramy usługę czatu z wbudowanego kontenera DI
var chatService = kernel.GetRequiredService<IChatCompletionService>();
var chatHistory = new ChatHistory();

// Upewnij się, że masz ten plik w folderze!
string audioFilePath = "transkrypcja.mp3"; 

Console.WriteLine($"Wczytuję plik: {audioFilePath}...");
byte[] audioBytes = await File.ReadAllBytesAsync(audioFilePath);

// Tworzymy paczkę (multimodal message) składającą się z tekstu (promptu) i pliku audio
var messageContent = new ChatMessageContentItemCollection
{
    new TextContent("Przeanalizuj to nagranie ze spotkania. Zwróć obiekt JSON zawierający dwa pola: 'Summary' (krótkie streszczenie) oraz 'ActionItems' (lista zadań do wykonania i do kogo należą)."),
    new AudioContent(audioBytes, "audio/mp3") 
};

chatHistory.AddUserMessage(messageContent);

Console.WriteLine("Wysyłam nagranie do Gemini...");

try
{
    var response = await chatService.GetChatMessageContentAsync(chatHistory);
    
    // Zabezpieczenie przed pustą odpowiedzią od AI
    string rawText = response.Content ?? string.Empty;

    string cleanJson = rawText.Replace("```json", "").Replace("```", "").Trim();

    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    
    // Zwróć uwagę na znak zapytania po MeetingNotes
    MeetingNotes? notes = JsonSerializer.Deserialize<MeetingNotes>(cleanJson, options);

    // Sprawdzamy, czy deserializacja się powiodła
    if (notes != null)
    {
        Console.WriteLine("\n=== ZDESERIALIZOWANE OBIEKTY C# ===");
        Console.WriteLine($"💡 STRESZCZENIE:\n{notes.Summary ?? "Brak streszczenia"}\n");
        Console.WriteLine("📌 LISTA ZADAŃ:");
        
        foreach (var item in notes.ActionItems)
        {
            // Jeśli AI nie przypisze osoby, wypisze "Nieprzypisane"
            string assignee = string.IsNullOrWhiteSpace(item.Assignee) ? "Nieprzypisane" : item.Assignee;
            Console.WriteLine($" - [ ] {assignee}: {item.Task}");
        }
        Console.WriteLine("===================================");
    }
    else
    {
        Console.WriteLine("Nie udało się odczytać notatek z odpowiedzi AI.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"\nBłąd podczas analizy: {ex.Message}");
}
public class MeetingNotes
{
    public string? Summary { get; set; }
    public List<ActionItem> ActionItems { get; set; } = new();
}

public class ActionItem
{
    public string? Task { get; set; }
    public string? Assignee { get; set; }
}
