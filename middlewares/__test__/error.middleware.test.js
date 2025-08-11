import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  beforeAll,
  afterAll,
} from "@jest/globals";

// ===================================================================
//  SUÍTE DE TESTE - ERROR MIDDLEWARE
// ===================================================================

describe("ErrorMiddleware", () => {
  let errorMiddleware;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    errorMiddleware = (await import("../error.middleware.js")).default;
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  it("deve logar stack do erro em ambiente development", () => {
    process.env.NODE_ENV = "development";
    const err = new Error("Erro com stack");
    err.stack = "stack trace fake";
    const res = mockRes();

    errorMiddleware(err, {}, res, mockNext);

    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: "stack trace fake",
      })
    );

    // Reset para evitar efeito colateral em outros testes
    process.env.NODE_ENV = "test";
  });

  it("deve retornar 500 e 'Server Error' para erro genérico sem statusCode", () => {
    const err = new Error("Falha inesperada");
    const res = mockRes();

    errorMiddleware(err, {}, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Falha inesperada",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve retornar 404 para CastError", () => {
    const err = { name: "CastError", path: "id", message: "invalid id" };
    const res = mockRes();

    errorMiddleware(err, {}, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Resource not found. Invalid id",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para erro de chave duplicada", () => {
    const err = { code: 11000, message: "duplicate key" };
    const res = mockRes();

    errorMiddleware(err, {}, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Duplicate field value entered",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para ValidationError", () => {
    const err = {
      name: "ValidationError",
      errors: {
        field1: { message: "Campo 1 inválido" },
        field2: { message: "Campo 2 inválido" },
      },
    };
    const res = mockRes();

    errorMiddleware(err, {}, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Campo 1 inválido, Campo 2 inválido",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve chamar next se middleware lançar internamente", () => {
    const err = new Error("erro externo");
    const res = {
      status: () => {
        throw new Error("Falha no res.status");
      },
      json: jest.fn(),
    };

    errorMiddleware(err, {}, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockNext.mock.calls[0][0].message).toBe("Falha no res.status");
  });
});

afterAll(async () => {
  console.error.mockRestore();
});
