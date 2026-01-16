#!/bin/bash

# Script para optimizar Prisma eliminando binarios innecesarios
# Lambda solo necesita el binario de Linux (rhel-openssl)

set -e

echo "=========================================="
echo "Optimizando Prisma para Lambda"
echo "=========================================="

# Tamaño inicial
INITIAL_SIZE=$(du -sh node_modules | awk '{print $1}')
echo "Tamaño inicial de node_modules: $INITIAL_SIZE"

echo ""
echo "Eliminando binarios innecesarios..."

# Eliminar binarios de Windows
echo "  - Binarios de Windows..."
find node_modules -name "*windows*" -type f -size +1M -delete 2>/dev/null || true
find node_modules -name "*.exe" -delete 2>/dev/null || true
find node_modules -name "*.dll" -delete 2>/dev/null || true

# Eliminar binarios de macOS (darwin)
echo "  - Binarios de macOS..."
find node_modules -name "*darwin*" -type f -size +1M -delete 2>/dev/null || true
find node_modules -name "*.dylib*" -delete 2>/dev/null || true

# Eliminar binarios de Linux que NO sean rhel-openssl
echo "  - Binarios de Linux innecesarios..."
find node_modules -name "*debian*" -type f -size +1M -delete 2>/dev/null || true
find node_modules -name "*linux-arm*" -type f -size +1M -delete 2>/dev/null || true
find node_modules -name "*linux-musl*" -type f -size +1M -delete 2>/dev/null || true

# Eliminar caché de Prisma
echo "  - Caché de Prisma..."
rm -rf node_modules/@prisma/engines/node_modules/.cache 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Eliminar schema-engine (solo necesario para migraciones)
echo "  - Schema engines..."
find node_modules -name "schema-engine-*" ! -name "*rhel*" -delete 2>/dev/null || true

# Eliminar archivos de documentación y ejemplos
echo "  - Documentación y ejemplos..."
find node_modules -name "*.md" -delete 2>/dev/null || true
find node_modules -name "*.markdown" -delete 2>/dev/null || true
find node_modules -name "example*" -type f -delete 2>/dev/null || true
find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "*.test.js" -delete 2>/dev/null || true
find node_modules -name "*.spec.js" -delete 2>/dev/null || true

# Tamaño final
FINAL_SIZE=$(du -sh node_modules | awk '{print $1}')

echo ""
echo "=========================================="
echo "✅ Optimización completada"
echo "=========================================="
echo "Tamaño inicial: $INITIAL_SIZE"
echo "Tamaño final:   $FINAL_SIZE"
echo ""
echo "Binarios de Prisma restantes:"
find node_modules -name "libquery_engine*" -o -name "query_engine*" 2>/dev/null || true
echo ""
