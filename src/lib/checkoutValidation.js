import { getProductById } from "./products";

// CampusConnect - Sprint 5
// Subtask: Form validation and error handling
// Author: Omar

// Validate cart items before placing an order.
export async function validateCart(items) {
  const errors = [];

  // Prevent checkout with an empty cart.
  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: false,
      errors: ["Your shopping cart is empty."],
    };
  }

  for (const item of items) {
    // Validate product information.
    if (!item?.id) {
      errors.push("Invalid product in the shopping cart.");
      continue;
    }

    const name = item.name || "Product";

    // Validate the selected quantity.
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      errors.push(`${name}: Invalid quantity.`);
      continue;
    }

    try {
      // Retrieve current product information from Supabase.
      const product = await getProductById(item.id);

      // Check whether the product is still available.
      if (!product) {
        errors.push(`${name} is no longer available.`);
        continue;
      }

      // Check available stock.
      if (product.stock < item.quantity) {
        errors.push(
          `${name}: Only ${product.stock} item(s) available.`
        );
      }

      // Check whether the product price has changed.
      if (Number(product.price) !== Number(item.price)) {
        errors.push(
          `${name}: The price has changed. Please remove and add the product again.`
        );
      }
    } catch (error) {
      // Handle database and connection errors.
      errors.push(
        `Unable to verify ${name}. Please try again.`
      );
    }
  }

  // Return the validation result and error messages.
  return {
    valid: errors.length === 0,
    errors,
  };
}