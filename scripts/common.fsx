// Common references and utilities shared across all Bitbeat scripts.
// Load this at the top of any script with: #load "../common.fsx"

#r "nuget: FSharp.Data, 6.4.0"           // HTTP, JSON, CSV
#r "nuget: Spectre.Console, 0.49.1"       // Rich terminal output

open System
open System.Net.Http

// ── HTTP ───────
let getAsync (url: string) =
    async {
        use client = new HttpClient(Timeout = TimeSpan.FromSeconds 5)
        try
            let! response = client.GetAsync(url) |> Async.AwaitTask
            return Ok response
        with ex ->
            return Error ex.Message
    }


type Service = { Name: string; Url: string }

let services = [
    { Name = "gateway";    Url = "http://localhost:3000" }
    { Name = "auth";       Url = "http://localhost:3001" }
    { Name = "songs";      Url = "http://localhost:3002" }
    { Name = "streaming";  Url = "http://localhost:3003" }
    { Name = "playlists";  Url = "http://localhost:3004" }
]

let serviceUrl name =
    services
    |> List.tryFind (fun s -> s.Name = name)
    |> Option.map (fun s -> s.Url)

// ── Printing ──────────────────────────────────────────────────────────────────

let ok   msg = printfn "[OK]   %s" msg
let fail msg = printfn "[FAIL] %s" msg
let info msg = printfn "[INFO] %s" msg
