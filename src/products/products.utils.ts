import { Product } from './interfaces/product-interface';
export class ProductsUtils {
public static applyPagination(results: Product[], page?: string, limit?: string) {
    if (page && limit) {
        const pageOrDefault = parseInt(page, 10);
        const limitOrDefault = parseInt(limit, 10);
        results = results.slice((pageOrDefault - 1) * limitOrDefault, pageOrDefault * limitOrDefault);
    }
    return results;
}
}