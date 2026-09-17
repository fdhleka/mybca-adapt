# Task Dispatch: Final Challenger 1 — Stress Testing & Concurrency

## Objective
Empirically stress test the myBCA ADAPT fullstack simulation system. Write and execute adversarial test scripts targeting concurrency, data integrity, rapid repeated 1-click resets, extreme transaction injections, and boundary values.

## References
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md` (Mandatory!)
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\orchestrator\PROJECT.md`
- `C:\Users\irul2\Downloads\Bahan YNFest\TEST_READY.md`

Your working directory is `C:\Users\irul2\Downloads\Bahan YNFest\.agents\final_challenger_1`.

## Challenger Tasks
1. Execute rapid repeated database resets (`POST /api/admin/reset`) concurrently and measure response latency (must remain <50ms without lock corruption or SQLite busy errors).
2. Inject a high volume of transactions (credits and debits) and verify that the resulting account balance strictly equals `initial_balance + sum(CR) - sum(DB)`.
3. Test edge case injections: zero amount, very large amounts (e.g. 100 billion IDR), special characters in description, invalid transaction types.
4. Verify that session isolation holds when multiple personas are queried concurrently.

Deliver verdict: **APPROVE** (all empirical stress tests pass) or **REJECT** in `C:\Users\irul2\Downloads\Bahan YNFest\.agents\final_challenger_1\handoff.md`.
Notify orchestrator via send_message.

## 2026-09-11T14:50:05Z
You are Challenger 1 for the myBCA ADAPT fullstack simulation project.
Read C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md first (mandatory!).
Read your dispatch assignment at C:\Users\irul2\Downloads\Bahan YNFest\.agents\final_challenger_1\DISPATCH.md.
Read C:\Users\irul2\Downloads\Bahan YNFest\.agents\orchestrator\PROJECT.md.

Empirically stress test the system:
1. Write and run stress test scripts for concurrent rapid repeated database resets (POST /api/admin/reset).
2. Stress test high-volume transaction injections and verify exact accounting balance conservation.
3. Stress test boundary conditions: zero amount, large amounts, special characters, invalid transaction types.
4. Verify session isolation across concurrent persona requests.

Deliver your verdict (APPROVE or REJECT) with full empirical evidence in C:\Users\irul2\Downloads\Bahan YNFest\.agents\final_challenger_1\handoff.md.
Notify the orchestrator with send_message when complete.

