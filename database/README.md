# Database scripts

SQL scripts for the Supabase schema. Execute them **in order** via the
Supabase dashboard → SQL Editor. Mark each row after running it.

## Execution order

| # | File | Contents | Executed |
|---|---|---|---|
| 1 | `001_helpers.sql` | `set_updated_at()` trigger + `generate_order_number()` | ✓ |
| 2 | `002_schema.sql` | All 9 tables in dependency order | ✓ |
| 3 | `003_rls.sql` | `get_staff_role()` helper + RLS enable + all policies | ✓ |
| 4 | `004_tracking_function.sql` | `get_order_for_tracking()` RPC + GRANT | ✓ |
| 5 | `005_seed_data.sql` | Initial catalog data (4 categories, 9 products, 6 combo_items) | ☐ |
| 6 | `006_update_site_settings.sql` | Placeholder content for the single `site_settings` row | ☐ |
| 7 | `007_dashboard_metrics.sql` | `get_dashboard_metrics()` RPC for admin dashboard | ☐ |
| 8 | `008_storage_setup.sql` | `product-images` bucket + Storage RLS policies | ☐ |

## Idempotency

| Script | Safe to re-run? |
|---|---|
| `001_helpers.sql` | ✓ — uses `CREATE OR REPLACE FUNCTION` |
| `002_schema.sql` | ✓ — uses `CREATE TABLE IF NOT EXISTS` |
| `003_rls.sql` | Partial — functions yes; policies NO (`CREATE POLICY` has no `IF NOT EXISTS`). Re-running fails with "policy already exists". Drop the specific policy first if you need to recreate it. |
| `004_tracking_function.sql` | ✓ — uses `CREATE OR REPLACE FUNCTION` |
| `005_seed_data.sql` | ✓ — skips if products table is not empty |
| `006_update_site_settings.sql` | ✓ — UPDATE on id = 1 is always safe to re-run |

## RLS summary

| Table | anon (public) | authenticated (staff) |
|---|---|---|
| `categories` | SELECT — active only | Full CRUD |
| `products` | SELECT — active only | Full CRUD |
| `combo_items` | SELECT — only if both combo and component product are active | Full CRUD |
| `delivery_zones` | SELECT — active only | Full CRUD |
| `site_settings` | SELECT | UPDATE — admin only |
| `orders` | INSERT | SELECT + UPDATE |
| `order_items` | INSERT | SELECT |
| `payment_transactions` | INSERT | SELECT + UPDATE |
| `staff` | — | SELECT own row; admin: full CRUD |

**Public order tracking** → `get_order_for_tracking(order_number, phone)` RPC only.
No direct SELECT on `orders` for `anon`.

The `service_role` key (used by Edge Functions / MP webhook) bypasses RLS entirely.

## Pending — Phase 2

Fine-grained per-role policies (kitchen / cashier / admin) are deferred.
Currently all active staff share the same database access level.
Before production, add role-specific policies or filtered views to enforce that:
- kitchen cannot read payment data or totals
- cashier cannot access reports
- only admin can manage products, categories, and zones
(business.md §2.5)
