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
exports.MechanicController = void 0;
const mechanics_service_js_1 = require("./mechanics.service.js");
class MechanicController {
    static getAll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanics = yield mechanics_service_js_1.MechanicService.getAll();
                res.json({ success: true, data: mechanics });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanic = yield mechanics_service_js_1.MechanicService.getById(req.params.id);
                if (!mechanic) {
                    return res.status(404).json({ success: false, error: 'Mechanic not found' });
                }
                res.json({ success: true, data: mechanic });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static create(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanic = yield mechanics_service_js_1.MechanicService.create(req.body);
                res.status(201).json({ success: true, data: mechanic });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static update(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanic = yield mechanics_service_js_1.MechanicService.update(req.params.id, req.body);
                res.json({ success: true, data: mechanic });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static delete(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mechanics_service_js_1.MechanicService.delete(req.params.id);
                res.json({ success: true, message: 'Mechanic deleted successfully' });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.MechanicController = MechanicController;
