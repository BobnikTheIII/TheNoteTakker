using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Text.Json;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);
Env.Load();
string apiKey = Environment.GetEnvironmentVariable("API_KEY") ?? "";
string llmModel = Environment.GetEnvironmentVariable("LLM_MODEL") ?? "";

if (string.IsNullOrWhiteSpace(apiKey)) throw new Exception("Brak klucza API!");
if (string.IsNullOrWhiteSpace(llmModel)) throw new Exception("Brak modelu LLM!");

builder.Services.AddKernel();
builder.Services.AddGoogleAIGeminiChatCompletion(llmModel, apiKey);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapPost("/transcribe", async (IFormFile file, Kernel kernel) =>
{
    if (file == null || file.Length == 0) return Results.BadRequest("Brak pliku.");

    var chatService = kernel.GetRequiredService<IChatCompletionService>();
    using var ms = new MemoryStream();
    await file.CopyToAsync(ms);
    byte[] audioBytes = ms.ToArray();

    var history = new ChatHistory();
    
    #pragma warning disable SKEXP0001
    var content = new ChatMessageContentItemCollection
    {
        new TextContent("Wykonaj dokładną transkrypcję tego nagrania. Nie dodawaj od siebie żadnych komentarzy, zwróć wyłącznie to, co zostało powiedziane."),
        new AudioContent(audioBytes, file.ContentType ?? "audio/mp3")
    };
    #pragma warning restore SKEXP0001

    history.AddUserMessage(content);

    try
    {
        var response = await chatService.GetChatMessageContentAsync(history);
        return Results.Ok(new { Transcript = response.Content?.Trim() });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Błąd AI: {ex.Message}");
    }
}).DisableAntiforgery();

app.MapPost("/generate-notes", async ([FromBody] NotesRequest request, Kernel kernel) =>
{
    if (string.IsNullOrWhiteSpace(request.Transcript)) 
        return Results.BadRequest("Brak transkrypcji do analizy.");

    var chatService = kernel.GetRequiredService<IChatCompletionService>();
    
    string userInstruction = string.IsNullOrWhiteSpace(request.CustomPrompt) 
        ? "Przygotuj zwięzłe podsumowanie tego tekstu oraz wypisz najważniejsze zadania do zrobienia." 
        : request.CustomPrompt;

    string fullPrompt = $@"
        Oto transkrypcja:
        {request.Transcript}

        Instrukcja od użytkownika:
        {userInstruction}

        Zwróć odpowiedź WYŁĄCZNIE w formacie JSON z dwoma polami: 'Summary' (Twoja odpowiedź na instrukcję użytkownika) oraz 'ActionItems' (lista zadań, o ile jakieś wynikają z tekstu. Każde zadanie to 'Task' i 'Assignee').
    ";

    try
    {
        var response = await chatService.GetChatMessageContentAsync(fullPrompt);
        string cleanJson = response.Content!.Replace("```json", "").Replace("```", "").Trim();
        
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var notes = JsonSerializer.Deserialize<MeetingNotes>(cleanJson, options);

        return Results.Ok(notes);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Błąd AI: {ex.Message}");
    }
});

app.Run();

public record ActionItem(string Task, string Assignee);
public record MeetingNotes(string Summary, List<ActionItem> ActionItems);
public record NotesRequest(string Transcript, string? CustomPrompt);