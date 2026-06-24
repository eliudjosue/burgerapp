-- Reordena sort_order para que los 3 productos destacados de la Home
-- (los primeros 3 por sort_order, is_active=true) sean una mezcla variada:
-- 1 hamburguesa + los 2 combos, en lugar de las 3 hamburguesas.
-- Idempotente: siempre fija los mismos valores, seguro de re-ejecutar.

UPDATE products SET sort_order = 1 WHERE id = 'b1000000-0000-0000-0000-000000000001'; -- Hamburguesa Clásica
UPDATE products SET sort_order = 2 WHERE id = 'b1000000-0000-0000-0000-000000000008'; -- Combo Familiar
UPDATE products SET sort_order = 3 WHERE id = 'b1000000-0000-0000-0000-000000000009'; -- Combo Vegetariano

-- El resto de los productos quedan después en sort_order, no importa el
-- orden relativo entre ellos para este propósito (solo afecta cuáles 3
-- aparecen como destacados en Home, no el orden del catálogo completo).
UPDATE products SET sort_order = 4 WHERE id = 'b1000000-0000-0000-0000-000000000002'; -- Hamburguesa Doble
UPDATE products SET sort_order = 5 WHERE id = 'b1000000-0000-0000-0000-000000000003'; -- Hamburguesa Veggie
UPDATE products SET sort_order = 6 WHERE id = 'b1000000-0000-0000-0000-000000000004'; -- Papas Fritas
UPDATE products SET sort_order = 7 WHERE id = 'b1000000-0000-0000-0000-000000000005'; -- Papas al Ajo
UPDATE products SET sort_order = 8 WHERE id = 'b1000000-0000-0000-0000-000000000006'; -- Agua Mineral
UPDATE products SET sort_order = 9 WHERE id = 'b1000000-0000-0000-0000-000000000007'; -- Coca Cola