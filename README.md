# external-dannyshihnet-status-check
External status check for dannyshih.net services

## Setup
The script expects `slack-token.txt` in the same directory.

## Monitor (only notify on errors)
```
node external-dannyshihnet-status-check/app.js
```

## Report daily status
```
node external-dannyshihnet-status-check/app.js always-notify
```
