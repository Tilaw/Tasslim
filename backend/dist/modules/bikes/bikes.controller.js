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
exports.BikeController = void 0;
const bikes_service_js_1 = require("./bikes.service.js");
class BikeController {
    static getAll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bikes = yield bikes_service_js_1.BikeService.getAll();
                res.json({ success: true, data: bikes });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bike = yield bikes_service_js_1.BikeService.getById(req.params.id);
                if (!bike) {
                    return res.status(404).json({ success: false, error: 'Bike not found' });
                }
                res.json({ success: true, data: bike });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static create(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bike = yield bikes_service_js_1.BikeService.create(req.body);
                res.status(201).json({ success: true, data: bike });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static update(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bike = yield bikes_service_js_1.BikeService.update(req.params.id, req.body);
                res.json({ success: true, data: bike });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static delete(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield bikes_service_js_1.BikeService.delete(req.params.id);
                res.json({ success: true, message: 'Bike deleted successfully' });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.BikeController = BikeController;
