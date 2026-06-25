import { ProductService } from '../products/products.service.js';
import { MechanicService } from '../mechanics/mechanics.service.js';
import { BikeService } from '../bikes/bikes.service.js';

/**
 * Single-call bootstrap for the issue-part page: products, mechanics, and bikes.
 * Issuance history is loaded separately via GET /transactions/groups (paginated).
 */
export async function getIssueContext() {
    const [products, mechanics, bikes] = await Promise.all([
        ProductService.getAll({}),
        MechanicService.getAll(),
        BikeService.getAll(),
    ]);
    return { products, mechanics, bikes };
}
