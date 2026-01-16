#!/bin/bash

# Script para probar qué endpoint de Jira respeta la paginación
# Necesitas pasar email y token como argumentos

EMAIL="$1"
TOKEN="$2"
JIRA_URL="https://naturgy-adn.atlassian.net"
JQL="project = 'NC' AND status != 'Closed'"

if [ -z "$EMAIL" ] || [ -z "$TOKEN" ]; then
  echo "Uso: ./test-jira-pagination.sh EMAIL TOKEN"
  exit 1
fi

echo "========================================"
echo "PROBANDO PAGINACIÓN DE JIRA"
echo "========================================"
echo ""

# Test 1: GET /search/jql con query params
echo "1️⃣  TEST 1: GET /rest/api/3/search/jql"
echo "----------------------------------------"
echo "Página 1 (startAt=0):"
RESULT1=$(curl -s -u "$EMAIL:$TOKEN" \
  "${JIRA_URL}/rest/api/3/search/jql?jql=$(echo $JQL | jq -sRr @uri)&startAt=0&maxResults=5&fields=key" \
  -H "Accept: application/json")
echo "$RESULT1" | jq '.issues[].key' 2>/dev/null || echo "ERROR"
echo ""

echo "Página 2 (startAt=5):"
RESULT2=$(curl -s -u "$EMAIL:$TOKEN" \
  "${JIRA_URL}/rest/api/3/search/jql?jql=$(echo $JQL | jq -sRr @uri)&startAt=5&maxResults=5&fields=key" \
  -H "Accept: application/json")
echo "$RESULT2" | jq '.issues[].key' 2>/dev/null || echo "ERROR"
echo ""
echo "¿Son diferentes? $(if [ "$RESULT1" != "$RESULT2" ]; then echo "✅ SÍ"; else echo "❌ NO (DUPLICADOS)"; fi)"
echo ""

# Test 2: GET /search con query params
echo "2️⃣  TEST 2: GET /rest/api/3/search"
echo "----------------------------------------"
echo "Página 1 (startAt=0):"
RESULT3=$(curl -s -u "$EMAIL:$TOKEN" \
  "${JIRA_URL}/rest/api/3/search?jql=$(echo $JQL | jq -sRr @uri)&startAt=0&maxResults=5&fields=key" \
  -H "Accept: application/json")
echo "$RESULT3" | jq '.issues[].key' 2>/dev/null || echo "ERROR"
echo ""

echo "Página 2 (startAt=5):"
RESULT4=$(curl -s -u "$EMAIL:$TOKEN" \
  "${JIRA_URL}/rest/api/3/search?jql=$(echo $JQL | jq -sRr @uri)&startAt=5&maxResults=5&fields=key" \
  -H "Accept: application/json")
echo "$RESULT4" | jq '.issues[].key' 2>/dev/null || echo "ERROR"
echo ""
echo "¿Son diferentes? $(if [ "$RESULT3" != "$RESULT4" ]; then echo "✅ SÍ"; else echo "❌ NO (DUPLICADOS)"; fi)"
echo ""

# Test 3: POST /search con JSON body
echo "3️⃣  TEST 3: POST /rest/api/3/search (JSON body)"
echo "----------------------------------------"
echo "Página 1 (startAt=0):"
RESULT5=$(curl -s -u "$EMAIL:$TOKEN" \
  -X POST "${JIRA_URL}/rest/api/3/search" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"jql\":\"$JQL\",\"startAt\":0,\"maxResults\":5,\"fields\":[\"key\"]}")
echo "$RESULT5" | jq '.issues[].key' 2>/dev/null || echo "ERROR: $(echo $RESULT5 | jq -r '.errorMessages[]? // .errors? // "Unknown"' 2>/dev/null)"
echo ""

echo "Página 2 (startAt=5):"
RESULT6=$(curl -s -u "$EMAIL:$TOKEN" \
  -X POST "${JIRA_URL}/rest/api/3/search" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"jql\":\"$JQL\",\"startAt\":5,\"maxResults\":5,\"fields\":[\"key\"]}")
echo "$RESULT6" | jq '.issues[].key' 2>/dev/null || echo "ERROR: $(echo $RESULT6 | jq -r '.errorMessages[]? // .errors? // "Unknown"' 2>/dev/null)"
echo ""
echo "¿Son diferentes? $(if [ "$RESULT5" != "$RESULT6" ]; then echo "✅ SÍ"; else echo "❌ NO (DUPLICADOS)"; fi)"
echo ""

echo "========================================"
echo "RESUMEN"
echo "========================================"
echo "Test 1 (GET /search/jql): $(if [ "$RESULT1" != "$RESULT2" ]; then echo "✅ FUNCIONA"; else echo "❌ DUPLICADOS"; fi)"
echo "Test 2 (GET /search):     $(if [ "$RESULT3" != "$RESULT4" ]; then echo "✅ FUNCIONA"; else echo "❌ DUPLICADOS"; fi)"
echo "Test 3 (POST /search):    $(if [ "$RESULT5" != "$RESULT6" ]; then echo "✅ FUNCIONA"; else echo "❌ DUPLICADOS"; fi)"
echo ""
