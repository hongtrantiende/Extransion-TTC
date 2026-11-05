param(
  [string]$ip = '192.168.5.23',
  [int]$wsPort = 1123,
  [string]$tag = 'https://sangtacviet.com',
  [string]$key = 'naruto',
  [int]$timeoutSec = 40
)
# Gui {"tag":<bookSourceUrl>,"key":<...>} toi WebSocket /bookSourceDebug tren may, log den _wslog.txt (UTF-8).
# key: URL tuyet doi->Info | chua '::'->Explore | '++URL'->Toc | '--URL'->Content | con lai->Search.
# Doc _wslog.txt bang Read tool (console Windows hien mojibake).
$ErrorActionPreference = 'Stop'
$enc = New-Object System.Text.UTF8Encoding($false)
$logf = Join-Path (Get-Location).Path '_wslog.txt'
[System.IO.File]::WriteAllText($logf, '', $enc)
function Log($m) { [System.IO.File]::AppendAllText($logf, $m + "`r`n", $enc) }
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource
$cts.CancelAfter($timeoutSec * 1000)
$tok = $cts.Token
$ws.ConnectAsync([Uri]"ws://$ip`:$wsPort/bookSourceDebug", $tok).Wait()
$payload = '{"tag":"' + ($tag -replace '"','') + '","key":"' + ($key -replace '"','') + '"}'
$b = [Text.Encoding]::UTF8.GetBytes($payload)
$ws.SendAsync([System.ArraySegment[byte]]::new($b), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $tok).Wait()
Log ('SENT: ' + $payload)
$buf = New-Object byte[] 65536
try {
  while ($ws.State -eq 'Open') {
    $rseg = [System.ArraySegment[byte]]::new($buf)
    $res = $ws.ReceiveAsync($rseg, $tok).Result
    if ($res.MessageType -eq 'Close') { Log '--- CLOSE ---'; break }
    Log ([Text.Encoding]::UTF8.GetString($buf, 0, $res.Count))
  }
} catch { Log ('END: ' + $_.Exception.Message) }
try { $ws.Dispose() } catch {}
Write-Host ("logged -> " + $logf)
