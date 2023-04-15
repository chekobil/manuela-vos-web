#!/bin/bash
trap 'kill %1: kill %2' SIGINT

# Habilita la ruta de AUTH
bash scripts/disable_auth.sh enable
# Start process 1 in the background and get its PID
# Arranca directamente Astro, a traves de npm run el PID que obtienes no es el correcto
astro dev &
cmd1_pid=$!

# Start process 2 in the foreground
node scripts/dropboxauth.spec.js &&
#node scripts/dropboxauth.test.js

# Check if process 2 exited successfully
# $? is the exit signal for process 2
if [ $? -eq 0 ]; then
  echo "kill process 1: ${cmd1_pid}"
  # Kill process 1 if process 2 was successful
  kill $cmd1_pid
  # use pkill instead, if cmd1 creates child processess
  #pkill -P $cmd1_pid
  # This will send a SIGTERM signal to all processes that have cmd1's PID as their parent process.
else
    # kill process 1 anyway
    echo "process %2 exists with error"
    kill $cmd1_pid
fi
# Deshabilita la ruta de AUTH
bash scripts/disable_auth.sh disable