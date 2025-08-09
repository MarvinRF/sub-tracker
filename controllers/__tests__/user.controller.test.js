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
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

// ===================================================================
//  SUITES DE TESTE
// ===================================================================

describe("UserController - getUsers", () => {
  let getUsers, User;

  beforeEach(async () => {
    jest.clearAllMocks();
    getUsers = (await import("../user.controller.js")).getUsers;
    User = (await import("../../models/user.model.js")).default;
  });

  it("deve retornar lista de usuários", async () => {
    const mockUsers = [{ _id: "1", name: "John" }];
    User.find.mockResolvedValue(mockUsers);

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUsers({}, res, jest.fn());

    expect(User.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      sucess: true,
      data: mockUsers,
    });
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("DB error");
    User.find.mockRejectedValue(error);

    const next = jest.fn();
    await getUsers({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("UserController - getUser", () => {
  let getUser, User;

  beforeEach(async () => {
    jest.clearAllMocks();
    getUser = (await import("../user.controller.js")).getUser;
    User = (await import("../../models/user.model.js")).default;
  });

  it("deve retornar usuário por ID sem password", async () => {
    const mockUser = { _id: "123", name: "John" };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const req = { params: { id: "123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUser(req, res, jest.fn());

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      sucess: true,
      data: mockUser,
    });
  });

  it("deve retornar erro 404 se usuário não existir", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = { params: { id: "not-found" } };
    const next = jest.fn();
    await getUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      })
    );
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("DB error");
    User.findById.mockImplementation(() => {
      throw error;
    });

    const next = jest.fn();
    await getUser({ params: { id: "123" } }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("UserController - createUser", () => {
  let createUser, User;

  beforeEach(async () => {
    jest.clearAllMocks();
    createUser = (await import("../user.controller.js")).createUser;
    User = (await import("../../models/user.model.js")).default;
  });

  it("deve criar usuário e retornar sem a senha", async () => {
    User.findOne.mockResolvedValue(null);

    const created = {
      toObject: jest.fn().mockReturnValue({
        _id: "1",
        name: "John",
        email: "john@example.com",
        password: "hashed",
      }),
    };
    User.create.mockResolvedValue(created);

    const req = {
      body: { name: "John", email: "john@example.com", password: "plain" },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await createUser(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
    expect(User.create).toHaveBeenCalledWith({
      name: "John",
      email: "john@example.com",
      password: "plain",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { _id: "1", name: "John", email: "john@example.com" },
    });
  });

  it("deve retornar erro 400 se email já existir", async () => {
    User.findOne.mockResolvedValue({ email: "existing@example.com" });

    const req = { body: { email: "existing@example.com" } };
    const next = jest.fn();
    await createUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Email is already in use",
        statusCode: 400,
      })
    );
  });

  it("deve chamar next(error) em caso de falha inesperada", async () => {
    const dbError = new Error("DB error");
    User.findOne.mockRejectedValue(dbError);

    const req = { body: { email: "x@x.com" } };
    const next = jest.fn();
    await createUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});

describe("UserController - updateUser", () => {
  let updateUser, User;

  beforeEach(async () => {
    jest.clearAllMocks();
    updateUser = (await import("../user.controller.js")).updateUser;
    User = (await import("../../models/user.model.js")).default;
  });

  it("deve atualizar usuário e retornar sem password", async () => {
    const updatedUser = { _id: "123", name: "Updated" };
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const req = { params: { id: "123" }, body: { name: "Updated" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateUser(req, res, jest.fn());

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      { name: "Updated" },
      expect.objectContaining({
        new: true,
        runValidators: true,
        context: "query",
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedUser });
  });

  it("deve remover password do update mesmo se enviado", async () => {
    const updatedUser = { _id: "123", name: "John" };
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const req = { params: { id: "123" }, body: { password: "hack" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateUser(req, res, jest.fn());

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      {},
      expect.any(Object)
    );
  });

  it("deve retornar erro 404 se usuário não encontrado", async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = { params: { id: "not-found" }, body: {} };
    const next = jest.fn();
    await updateUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      })
    );
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("DB error");
    User.findByIdAndUpdate.mockImplementation(() => {
      throw error;
    });

    const next = jest.fn();
    await updateUser({ params: { id: "123" }, body: {} }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("UserController - deleteUser", () => {
  let deleteUser, User;

  beforeEach(async () => {
    jest.clearAllMocks();
    deleteUser = (await import("../user.controller.js")).deleteUser;
    User = (await import("../../models/user.model.js")).default;
  });

  it("deve deletar usuário e retornar mensagem", async () => {
    User.findByIdAndDelete.mockResolvedValue({ _id: "123" });

    const req = { params: { id: "123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await deleteUser(req, res, jest.fn());

    expect(User.findByIdAndDelete).toHaveBeenCalledWith("123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User deleted successfully",
    });
  });

  it("deve retornar erro 404 se usuário não encontrado", async () => {
    User.findByIdAndDelete.mockResolvedValue(null);

    const req = { params: { id: "not-found" } };
    const next = jest.fn();
    await deleteUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      })
    );
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("DB error");
    User.findByIdAndDelete.mockRejectedValue(error);

    const next = jest.fn();
    await deleteUser({ params: { id: "123" } }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

afterAll(async () => {
  // Garante que o Jest encerre corretamente
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
});
