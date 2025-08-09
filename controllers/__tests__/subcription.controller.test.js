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

jest.unstable_mockModule("mongoose", () => ({
  default: {
    disconnect: jest.fn(),
  },
}));

const subscriptionMockModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../../models/subscription.model.js", () => ({
  default: subscriptionMockModel,
}));

const workflowClientMock = {
  trigger: jest.fn(),
};

jest.unstable_mockModule("../../config/upstash.js", () => ({
  workflowClient: workflowClientMock,
}));

jest.unstable_mockModule("../../config/env.js", () => ({
  SERVER_URL: "http://localhost",
}));

// ===================================================================
//  SUITES DE TESTE
// ===================================================================

describe("SubscriptionController - createSubscription", () => {
  let createSubscription, Subscription, workflowClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ createSubscription } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
    ({ workflowClient } = await import("../../config/upstash.js"));
  });

  it("deve criar assinatura e acionar workflow", async () => {
    const mockSub = { id: "sub1", name: "Test" };
    Subscription.create.mockResolvedValue(mockSub);
    workflowClient.trigger.mockResolvedValue({ workflowRunId: "wf123" });

    const req = { body: { name: "Test" }, user: { _id: "user1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await createSubscription(req, res, jest.fn());

    expect(Subscription.create).toHaveBeenCalledWith({
      name: "Test",
      user: "user1",
    });
    expect(workflowClient.trigger).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { subscription: mockSub, workflowRunId: "wf123" },
    });
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("DB fail");
    Subscription.create.mockRejectedValue(error);

    const next = jest.fn();
    await createSubscription({ body: {}, user: { _id: "u1" } }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("SubscriptionController - getSubscriptions", () => {
  let getSubscriptions, Subscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ getSubscriptions } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
  });

  it("deve retornar lista se usuário for o dono", async () => {
    const mockList = [{ id: 1 }];
    Subscription.find.mockResolvedValue(mockList);

    const req = { user: { id: "u1" }, params: { id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getSubscriptions(req, res, jest.fn());

    expect(Subscription.find).toHaveBeenCalledWith({ user: "u1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockList });
  });

  it("deve retornar erro 401 se não for o dono", async () => {
    const req = { user: { id: "u1" }, params: { id: "u2" } };
    const next = jest.fn();
    await getSubscriptions(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});

describe("SubscriptionController - getSubscriptionById", () => {
  let getSubscriptionById, Subscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ getSubscriptionById } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
  });

  it("deve retornar assinatura se existir e for do usuário", async () => {
    const mockSub = { _id: "sub1", user: "user1", toString: () => "user1" };
    Subscription.findById.mockResolvedValue(mockSub);

    mockSub.user = { toString: () => "user1" };

    const req = { params: { id: "sub1" }, user: { _id: "user1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getSubscriptionById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockSub });
  });

  it("deve retornar 404 se assinatura não existir", async () => {
    Subscription.findById.mockResolvedValue(null);

    const req = { params: { id: "subx" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getSubscriptionById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deve retornar 403 se assinatura não for do usuário", async () => {
    const mockSub = { user: { toString: () => "other" } };
    Subscription.findById.mockResolvedValue(mockSub);

    const req = { params: { id: "sub1" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getSubscriptionById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("fail");
    Subscription.findById.mockRejectedValue(error);

    const next = jest.fn();
    await getSubscriptionById({ params: { id: "x" }, user: {} }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("SubscriptionController - updateSubscription", () => {
  let updateSubscription, Subscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ updateSubscription } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
  });

  it("deve atualizar assinatura se for do usuário", async () => {
    const save = jest.fn();
    const mockSub = { user: { toString: () => "u1" }, save };
    Subscription.findById.mockResolvedValue(mockSub);

    const req = {
      params: { id: "s1" },
      body: { plan: "new" },
      user: { _id: "u1" },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateSubscription(req, res, jest.fn());

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 404 se assinatura não existir", async () => {
    Subscription.findById.mockResolvedValue(null);

    const req = { params: { id: "s1" }, body: {}, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateSubscription(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deve retornar 403 se não for do usuário", async () => {
    const mockSub = { user: { toString: () => "other" } };
    Subscription.findById.mockResolvedValue(mockSub);

    const req = { params: { id: "s1" }, body: {}, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateSubscription(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("fail");
    Subscription.findById.mockRejectedValue(error);

    const next = jest.fn();
    await updateSubscription({ params: {}, body: {}, user: {} }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("SubscriptionController - deleteSubscription", () => {
  let deleteSubscription, Subscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ deleteSubscription } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
  });

  it("deve deletar assinatura se for do usuário", async () => {
    const deleteOne = jest.fn();
    const mockSub = { user: { toString: () => "u1" }, deleteOne };
    Subscription.findById.mockResolvedValue(mockSub);

    const req = { params: { id: "s1" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await deleteSubscription(req, res, jest.fn());

    expect(deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 404 se assinatura não existir", async () => {
    Subscription.findById.mockResolvedValue(null);

    const req = { params: { id: "x" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await deleteSubscription(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deve retornar 403 se não for do usuário", async () => {
    const mockSub = { user: { toString: () => "other" } };
    Subscription.findById.mockResolvedValue(mockSub);

    const req = { params: { id: "s1" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await deleteSubscription(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("fail");
    Subscription.findById.mockRejectedValue(error);

    const next = jest.fn();
    await deleteSubscription({ params: {}, user: {} }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("SubscriptionController - getUserSubscriptions", () => {
  let getUserSubscriptions, Subscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ getUserSubscriptions } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
  });

  it("deve retornar lista se id for do usuário", async () => {
    const mockList = [{ id: "1" }];
    Subscription.find.mockResolvedValue(mockList);

    const req = { params: { id: "u1" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUserSubscriptions(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 403 se id não for do usuário", async () => {
    const req = { params: { id: "u2" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUserSubscriptions(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("fail");
    Subscription.find.mockRejectedValue(error);

    const next = jest.fn();
    await getUserSubscriptions(
      { params: { id: "u1" }, user: { _id: "u1" } },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("SubscriptionController - cancelSubscription", () => {
  let cancelSubscription, Subscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ cancelSubscription } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
  });

  it("deve cancelar assinatura se for do usuário", async () => {
    const save = jest.fn();
    const mockSub = { user: { toString: () => "u1" }, save };
    Subscription.findById.mockResolvedValue(mockSub);

    const req = { params: { id: "s1" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await cancelSubscription(req, res, jest.fn());

    expect(mockSub.status).toBe("canceled");
    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 404 se assinatura não existir", async () => {
    Subscription.findById.mockResolvedValue(null);

    const req = { params: { id: "s1" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await cancelSubscription(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deve retornar 403 se não for do usuário", async () => {
    const mockSub = { user: { toString: () => "other" } };
    Subscription.findById.mockResolvedValue(mockSub);

    const req = { params: { id: "s1" }, user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await cancelSubscription(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("fail");
    Subscription.findById.mockRejectedValue(error);

    const next = jest.fn();
    await cancelSubscription({ params: {}, user: {} }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("SubscriptionController - getUpcomingRenewals", () => {
  let getUpcomingRenewals, Subscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ getUpcomingRenewals } = await import("../subscription.controller.js"));
    Subscription = (await import("../../models/subscription.model.js")).default;
  });

  it("deve retornar assinaturas com renovação nos próximos 7 dias", async () => {
    const mockList = [{ id: "s1" }];
    Subscription.find.mockResolvedValue(mockList);

    const req = { user: { _id: "u1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUpcomingRenewals(req, res, jest.fn());

    expect(Subscription.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve chamar next(error) em caso de falha", async () => {
    const error = new Error("fail");
    Subscription.find.mockRejectedValue(error);

    const next = jest.fn();
    await getUpcomingRenewals({ user: { _id: "u1" } }, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

afterAll(async () => {
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
});
