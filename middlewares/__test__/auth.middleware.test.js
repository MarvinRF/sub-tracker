import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterAll,
} from "@jest/globals";

// ===================================================================
//  MOCKS GLOBAIS PARA O ARQUIVO
// ===================================================================

jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: jest.fn(),
  },
}));

jest.unstable_mockModule("../../config/env.js", () => ({
  JWT_SECRET: "chave-secreta-para-testes",
}));

// ===================================================================
//  SUÍTE DE TESTE - AUTH MIDDLEWARE
// ===================================================================

describe("AuthMiddleware - authorize", () => {
  let authorize, User, jwt;

  beforeEach(async () => {
    jest.clearAllMocks();
    authorize = (await import("../auth.middleware.js")).default;
    User = (await import("../../models/user.model.js")).default;
    jwt = (await import("jsonwebtoken")).default;
  });

  it("deve autorizar usuário com token válido", async () => {
    const mockUser = { _id: "123", name: "Test User" };

    jwt.verify.mockReturnValue({ userId: "123" });
    User.findById.mockResolvedValue(mockUser);

    const req = {
      headers: { authorization: "Bearer fake-token" },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorize(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("fake-token", expect.any(String));
    expect(User.findById).toHaveBeenCalledWith("123");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("deve retornar 401 se token não for enviado", async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 401 se usuário não for encontrado", async () => {
    jwt.verify.mockReturnValue({ userId: "not-found" });
    User.findById.mockResolvedValue(null);

    const req = {
      headers: { authorization: "Bearer fake-token" },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 401 e mensagem de erro se jwt.verify lançar exceção", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Token inválido");
    });

    const req = {
      headers: { authorization: "Bearer fake-token" },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized",
      error: "Token inválido",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

afterAll(async () => {
  // Não há conexão real de DB para encerrar, mas mantemos para consistência
});
