#!/usr/bin/env bash
# Starts a tiny local web server and opens the game (Mac / Linux).
cd "$(dirname "$0")"
PORT=8000
echo "Claw Catch is running at http://localhost:$PORT  (press Ctrl+C to stop)"
( sleep 1; (xdg-open "http://localhost:$PORT" || open "http://localhost:$PORT") >/dev/null 2>&1 ) &
python3 -m http.server $PORT 2>/dev/null || python -m http.server $PORT
