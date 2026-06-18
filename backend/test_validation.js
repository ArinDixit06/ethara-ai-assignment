const { z } = require('zod');

const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  quantity: z.coerce.number().int().min(0, 'Quantity must be greater than or equal to 0'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional().nullable(),
});

function test(payload) {
  const result = stockAdjustmentSchema.safeParse(payload);
  if (!result.success) {
    const errorBody = {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors
    };
    const json = JSON.stringify(errorBody);
    console.log(`Payload: ${JSON.stringify(payload)} => Length: ${json.length} => ${json}`);
  } else {
    console.log(`Payload: ${JSON.stringify(payload)} => Success`);
  }
}

// Test various validation failures
test({ productId: 'abc', type: 'REMOVE', quantity: 5 }); // missing reason
test({ productId: 'abc', type: 'REMOVE', quantity: 5, reason: undefined }); // undefined reason
test({ productId: 'abc', type: 'REMOVE', quantity: 5, reason: null }); // null reason
