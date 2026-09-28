# Starts only a disposable project profile. Does not touch the user's Firefox profile.
$projectRoot = Split-Path -Parent $PSScriptRoot
$profilePath = Join-Path $projectRoot ".tmp/firefox-profile"
New-Item -ItemType Directory -Force $profilePath | Out-Null
@"
user_pref("marionette.port", 2829);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("datareporting.policy.dataSubmissionEnabled", false);
"@ | Set-Content -Encoding utf8 (Join-Path $profilePath "user.js")
$firefoxPath = Join-Path $env:ProgramFiles "Mozilla Firefox/firefox.exe"
if (!(Test-Path -LiteralPath $firefoxPath)) { throw "Firefox not found: $firefoxPath" }
$testFirefox = Start-Process -FilePath $firefoxPath -ArgumentList @(
  "-headless", "-no-remote", "-marionette", "--remote-allow-system-access",
  "-profile", ('"' + $profilePath + '"')
) -WindowStyle Hidden -PassThru
$testFirefox.Id | Set-Content (Join-Path $projectRoot ".tmp/firefox.pid")
Write-Output "Temporary Firefox PID $($testFirefox.Id). Wait for startup, then run node tests/firefox-validation.cjs."
