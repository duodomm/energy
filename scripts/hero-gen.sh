#!/bin/bash
# R11-восстановление: генерация 10 hero-вариантов (v01–v10) для витрины /hero-variants
# 1344x768 = точный формат главной 7:4; затем PIL-постобработка до 1400x800 JPEG.
set -u
cd /home/z/my-project
mkdir -p public/hero-variants download/hero-variants
LOG=scripts/hero-gen.log
: > "$LOG"

declare -A PROMPTS
PROMPTS[v01]="Solar panel array at sunset, warm golden hour light, orange sky over field, professional landscape photography, realistic, high quality, no people, no text"
PROMPTS[v02]="Aerial top-down drone view of house roof fully covered with solar panels, clean geometry, bright daylight, realistic photography, high quality, no people, no text"
PROMPTS[v03]="Cozy wooden log house (brus timber construction) with solar panels on metal roof, Russian countryside, green lawn, summer day, realistic photography, high quality, no people, no text"
PROMPTS[v04]="Modern Scandinavian cottage with rooftop solar panels, architectural visualization render, clean minimal aesthetics, bright daylight, high quality, no people, no text"
PROMPTS[v05]="Modern family house with rooftop solar panels and home battery energy storage unit on wall, architectural render, bright daylight, high quality, no people, no text"
PROMPTS[v06]="Two-story family house with solar panels on both roof slopes, suburban street, blue sky with light clouds, realistic photography, high quality, no people, no text"
PROMPTS[v07]="Wide panorama of countryside estate with house and ground-mounted solar array, golden fields, big sky, golden hour, high quality photography, no people, no text"
PROMPTS[v08]="Front facade of modern one-story house with solar panels on roof, straight-on architectural photo, clear sky, high quality, no people, no text"
PROMPTS[v09]="Aerial drone photo of rural property with house and ground-mounted solar panel array, bird's eye view, fields and forest around, high quality, no people, no text"
PROMPTS[v10]="Eco house with green living roof and solar panels, sustainable wooden architecture, garden around, soft morning light, high quality photography, no people, no text"

ORDER="v01 v02 v03 v04 v05 v06 v07 v08 v09 v10"

for v in $ORDER; do
  out="public/hero-variants/${v}_raw.png"
  if [ -s "$out" ]; then echo "SKIP $v (уже есть)" >> "$LOG"; continue; fi
  echo "GEN $v ..." >> "$LOG"
  for attempt in 1 2 3; do
    timeout 120 z-ai image -p "${PROMPTS[$v]}" -o "$out" -s 1344x768 >> "$LOG" 2>&1
    if [ -s "$out" ]; then echo "OK $v (попытка $attempt)" >> "$LOG"; break; fi
    echo "RETRY $v (попытка $attempt не удалась)" >> "$LOG"; sleep 3
  done
  [ -s "$out" ] || echo "FAIL $v" >> "$LOG"
done
echo "DONE" >> "$LOG"
