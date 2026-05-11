import { ProductService } from '../products/products.service.js';
import { MechanicService } from '../mechanics/mechanics.service.js';
import { BikeService } from '../bikes/bikes.service.js';
import { TransactionService } from '../transactions/transactions.service.js';

/**
 * Single-call bootstrap for the issue-part page: products, mechanics, bikes, and
 * issue transactions. Reduces 4 HTTP round-trips to 1 (faster on mobile).
 */
export async function getIssueContext() {
    const [products, mechanics, bikes, transactions] = await Promise.all([
        ProductService.getAll({}),
        MechanicService.getAll(),
        BikeService.getAll(),
        // Recent issue transactions (newest first, capped) so the page stays fast on large DBs.
        TransactionService.getAll({ type: 'issue', limit: 500 }),
    ]);
    return { products, mechanics, bikes, transactions };
}
