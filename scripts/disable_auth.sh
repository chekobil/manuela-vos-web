#!/bin/bash
ACTION=$1
enabled="src/pages/auth"
disabled="src/pages/_auth"

if [ "$ACTION" = "enable" ]; then
  if [ ! -d $enabled ]; then
    mv $disabled $enabled
  fi
elif [ "$ACTION" = "disable" ]; then
  if [ ! -d $disabled ]; then
    mv $enabled $disabled
  fi
else
  echo "El parametro solo puede ser 'enable' o 'disable'"
fi