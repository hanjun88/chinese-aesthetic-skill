#!/usr/bin/env bash
# run-demo.sh — 一键跑通 需求→sheet→Cangjie IR→G1/G2/G3→DomComponentPlan 的 P0 闭环
set -euo pipefail
cd "$(dirname "$0")"

echo "════════════════════════════════════════════════"
echo "[1/3] 美学引擎 → AestheticConstraintSheet"
echo "════════════════════════════════════════════════"
node generate-sheet.js demo-input.json

echo
echo "════════════════════════════════════════════════"
echo "[2/3] 契约 A → CangjieRawDesignIR → 模拟 G1/G2/G3"
echo "════════════════════════════════════════════════"
node compile.js

echo
echo "════════════════════════════════════════════════"
echo "[3/3] 契约 B → RuntimeExecutionPlan → DomComponentPlan"
echo "════════════════════════════════════════════════"
node render.js

echo
echo "════════════════════════════════════════════════"
echo "完成。产物：sheet.json / cangjie-ir.json / validated-params.json / execution-plan.json / dom-plan.json"
echo "在浏览器打开 demo.html 查看渲染效果。"
