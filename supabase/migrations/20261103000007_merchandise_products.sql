
-- CampusConnect - Sprint 3
-- Subtask: Create merchandise product detail views
-- Author: Omar
--
-- Creates a merchandise products table.
-- Allows visitors to view active products.
-- Only admins can add, edit, or delete products.

-- Step 1: Create the products table.
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric(10, 2) NOT NULL
        CHECK (price >= 0),
    image_url text,
    stock integer NOT NULL DEFAULT 0
        CHECK (stock >= 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Enable Row Level Security.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow visitors to view active products.
DROP POLICY IF EXISTS "products: view active" ON public.products;

CREATE POLICY "products: view active"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    OR (SELECT public.is_admin())
);

-- Step 4: Allow admins to manage products.
DROP POLICY IF EXISTS "products: admin all" ON public.products;

CREATE POLICY "products: admin all"
ON public.products
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- Step 5: Grant necessary table permissions.
GRANT SELECT ON public.products TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.products
TO authenticated;

-- Step 6: Add sample merchandise products.
-- Only insert these examples if they do not already exist.
INSERT INTO public.products
    (name, description, price, image_url, stock, is_active)
SELECT
    'CampusConnect Hoodie',
    'Comfortable campus hoodie for students.',
    39.99,
    NULL,
    25,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE name = 'CampusConnect Hoodie'
);

INSERT INTO public.products
    (name, description, price, image_url, stock, is_active)
SELECT
    'CampusConnect T-Shirt',
    'Casual cotton T-shirt for campus activities.',
    19.99,
    NULL,
    40,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE name = 'CampusConnect T-Shirt'
);

INSERT INTO public.products
    (name, description, price, image_url, stock, is_active)
SELECT
    'CampusConnect Water Bottle',
    'Reusable water bottle for everyday campus use.',
    14.99,
    NULL,
    30,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE name = 'CampusConnect Water Bottle'
);
