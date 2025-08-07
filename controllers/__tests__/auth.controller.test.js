import { describe, it, expect, jest, beforeEach } from "@jest/globals";

describe("AuthController - signIn", () => {
  // 1. Declare variáveis para os módulos que serão importados dinamicamente
  let signIn, User, bcrypt, jwt;

  // 2. Use um `beforeEach` assíncrono para configurar os mocks e importar os módulos
  beforeEach(async () => {
    // Limpa mocks de testes anteriores
    jest.clearAllMocks();

    // Mock dos módulos ANTES de importá-los
    jest.unstable_mockModule("../../models/user.model.js", () => ({
      // Como você usa 'import User from ...', é um default export
      default: {
        findOne: jest.fn(),
      },
    }));

    jest.unstable_mockModule("../../config/env.js", () => ({
      JWT_SECRET: "chave-secreta-para-testes", // Um valor qualquer
      JWT_EXPIRES_IN: "1h", // Um valor qualquer
    }));

    jest.unstable_mockModule("bcryptjs", () => ({
      // 'import bcrypt from ...' também indica um default export
      default: {
        compare: jest.fn(),
      },
    }));

    jest.unstable_mockModule("jsonwebtoken", () => ({
      // 'import jwt from ...' também indica um default export
      default: {
        sign: jest.fn(),
      },
    }));

    // 3. Import os módulos dinamicamente APÓS os mocks serem registrados
    signIn = (await import("../auth.controller.js")).signIn;
    User = (await import("../../models/user.model.js")).default;
    bcrypt = (await import("bcryptjs")).default;
    jwt = (await import("jsonwebtoken")).default;
  });

  // O restante do código permanece exatamente o mesmo
  it("deve autenticar usuário e retornar token", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      password: "hashed-password",
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("fake-jwt-token");

    const req = {
      body: {
        email: "test@example.com",
        password: "plain-password",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    await signIn(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      req.body.password,
      mockUser.password
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: mockUser._id },
      expect.any(String),
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User signed in successfully",
      data: {
        token: "fake-jwt-token",
        user: mockUser,
      },
    });
  });

  it("deve retornar erro 401 se senha estiver errada", async () => {
    User.findOne.mockResolvedValue({ email: "a", password: "hash" });
    bcrypt.compare.mockResolvedValue(false);

    const req = {
      body: { email: "a@a.com", password: "wrong" },
    };

    const res = {};
    const next = jest.fn();

    await signIn(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid email or password",
        statusCode: 401,
      })
    );
  });

  it("deve retornar erro 404 se usuário não existir", async () => {
    User.findOne.mockResolvedValue(null);

    const req = { body: { email: "no@user.com", password: "123" } };
    const res = {};
    const next = jest.fn();

    await signIn(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not Found",
        statusCode: 404,
      })
    );
  });
});
