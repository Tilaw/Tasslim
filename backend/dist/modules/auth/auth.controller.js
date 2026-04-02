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
exports.AuthController = void 0;
const auth_service_js_1 = require("./auth.service.js");
class AuthController {
    static login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                const result = yield auth_service_js_1.AuthService.login(email, password);
                res.json({ success: true, data: result });
            }
            catch (error) {
                res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: error.message },
                });
            }
        });
    }
    static refresh(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                const result = yield auth_service_js_1.AuthService.refresh(refreshToken);
                res.json({ success: true, data: result });
            }
            catch (error) {
                res.status(401).json({
                    success: false,
                    error: { code: 'INVALID_TOKEN', message: error.message || 'Invalid or expired refresh token' },
                });
            }
        });
    }
    static register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield auth_service_js_1.AuthService.register(req.body);
                res.status(201).json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getAll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield auth_service_js_1.AuthService.getAll();
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
                const id = req.params.id;
                const deleted = yield auth_service_js_1.AuthService.delete(id);
                if (!deleted) {
                    return res.status(404).json({
                        success: false,
                        error: { code: 'NOT_FOUND', message: 'User not found or already removed' },
                    });
                }
                res.json({ success: true });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static update(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const actor = req.user;
                const result = yield auth_service_js_1.AuthService.updateUser(id, req.body, actor);
                res.json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.AuthController = AuthController;
