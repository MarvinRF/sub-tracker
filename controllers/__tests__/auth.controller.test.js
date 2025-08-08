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
//  Mocks são definidos uma única vez no topo para evitar conflitos
//  entre as diferentes suítes de teste (describe).
// ===================================================================

const sessionMock = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule("mongoose", () => ({
  default: {
    startSession: jest.fn().mockResolvedValue(sessionMock),
    disconnect: jest.fn(),
  },
}));

jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock COMPLETO do bcryptjs, com TODAS as funções usadas no arquivo
jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    compare: jest.fn(), // Usado no signIn
    genSalt: jest.fn(), // Usado no signUp
    hash: jest.fn(), // Usado no signUp
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
  },
}));

jest.unstable_mockModule("../../config/env.js", () => ({
  JWT_SECRET: "chave-secreta-para-testes",
  JWT_EXPIRES_IN: "1h",
}));

// ===================================================================
//  SUÍTES DE TESTE
// ===================================================================

describe("AuthController - signIn", () => {
  let signIn, User, bcrypt, jwt;

  beforeEach(async () => {
    // Limpa o histórico de chamadas e retornos dos mocks globais
    jest.clearAllMocks();

    // Apenas importa os módulos, que já foram mockados globalmente
    signIn = (await import("../auth.controller.js")).signIn;
    User = (await import("../../models/user.model.js")).default;
    bcrypt = (await import("bcryptjs")).default;
    jwt = (await import("jsonwebtoken")).default;
  });

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
      body: { email: "test@example.com", password: "plain-password" },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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
      { expiresIn: expect.any(String) }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User signed in successfully",
      data: { token: "fake-jwt-token", user: mockUser },
    });
  });

  it("deve retornar erro 401 se senha estiver errada", async () => {
    User.findOne.mockResolvedValue({ password: "hash" });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { email: "a@a.com", password: "wrong" } };
    const next = jest.fn();

    await signIn(req, {}, next);

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
    const next = jest.fn();

    await signIn(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not Found",
        statusCode: 404,
      })
    );
  });
});

//-------------------------------------------------------------------------------
describe("AuthController - signOut", () => {
  let signOut;

  beforeEach(async () => {
    jest.clearAllMocks();
    signOut = (await import("../auth.controller.js")).signOut;
  });

  it("deve retornar resposta de sucesso no sign-out", async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await signOut({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User signed out successfully",
    });
  });

  it("deve chamar next(error) em caso de exceção", async () => {
    const error = new Error("Falha");
    const res = {
      status: jest.fn(() => {
        throw error;
      }),
    };
    const next = jest.fn();
    await signOut({}, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

//-------------------------------------------------------------------------------
describe("AuthController - signUp", () => {
  let signUp, User, bcrypt, jwt;

  beforeEach(async () => {
    jest.clearAllMocks();
    signUp = (await import("../auth.controller.js")).signUp;
    User = (await import("../../models/user.model.js")).default;
    bcrypt = (await import("bcryptjs")).default;
    jwt = (await import("jsonwebtoken")).default;
  });

  it("deve criar usuário e retornar token", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue("fake-salt");
    bcrypt.hash.mockResolvedValue("hashed-password");
    jwt.sign.mockReturnValue("fake-jwt-token");
    const mockCreatedUser = { _id: "123", email: "john@example.com" };
    User.create.mockResolvedValue([mockCreatedUser]);

    const req = { body: { email: "john@example.com", password: "plain" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await signUp(req, res, next);

    expect(sessionMock.commitTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: "fake-jwt-token" }),
      })
    );
  });

  it("deve retornar erro 409 se usuário já existir", async () => {
    User.findOne.mockResolvedValue({ email: "existing@example.com" });

    const req = { body: { email: "existing@example.com" } };
    const next = jest.fn();

    await signUp(req, {}, next);

    expect(sessionMock.abortTransaction).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User already exist",
        statusCode: 409,
      })
    );
  });

  it("deve chamar next(error) em caso de erro inesperado", async () => {
    const dbError = new Error("DB error");
    User.findOne.mockRejectedValue(dbError);

    const req = { body: { email: "test@example.com" } };
    const next = jest.fn();

    await signUp(req, {}, next);

    expect(sessionMock.abortTransaction).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(dbError);
  });
});

afterAll(async () => {
  // Garante que o Jest encerre corretamente
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
});
