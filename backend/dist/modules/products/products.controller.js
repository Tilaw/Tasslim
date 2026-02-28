"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const products_service_js_1 = require("./products.service.js");
class ProductController {
    static getAll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield products_service_js_1.ProductService.getAll(req.query);
                res.json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield products_service_js_1.ProductService.getById(req.params.id);
                if (!result)
                    return res.status(404).json({ success: false, error: 'Product not found' });
                res.json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static create(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield products_service_js_1.ProductService.create(req.body);
                res.status(201).json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static update(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield products_service_js_1.ProductService.update(req.params.id, req.body);
                res.json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static delete(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield products_service_js_1.ProductService.delete(req.params.id);
                res.json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.ProductController = ProductController;
