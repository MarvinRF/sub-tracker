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

const sessionMock = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

// CORREÇÃO: Mock para o cliente Upstash para evitar erro de token
jest.unstable_mockModule("../../config/upstash.js", () => ({
  workflowClient: {},
}));

jest.unstable_mockModule("mongoose", () => ({
  default: {
    startSession: jest.fn().mockResolvedValue(sessionMock),
    disconnect: jest.fn(),
  },
}));

jest.unstable_mockModule("../../models/subscription.model.js", () => ({
  default: {
    findById: jest.fn(), // Simplificado, pois é redefinido no beforeEach
  },
}));

jest.unstable_mockModule("../../utils/send-email.js", () => ({
  sendReminderEmail: jest.fn(),
}));

// CORREÇÃO: Mock correto para o dayjs
jest.unstable_mockModule("dayjs", () => ({
  __esModule: true,
  default: jest.requireActual("dayjs"),
}));

// A LINHA QUE MOCKAVA @upstash/workflow/express FOI REMOVIDA DAQUI

// ===================================================================
//  SUITES DE TESTE
// ===================================================================

describe("subscription.controller - sendReminders", () => {
  let sendReminders;
  let Subscription;
  let sendReminderEmail;
  let dayjs;

  const contextMock = {
    requestPayload: { subscriptionId: "sub123" },
    run: jest.fn(),
    sleepUntil: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // SUGESTÃO APLICADA: 'context.run' agora é mockado para todos os testes.
    contextMock.run.mockImplementation(async (_label, fn) => fn());

    const controllerModule = await import("../workflow.controller.js");
    sendReminders = controllerModule.sendReminders;
    Subscription = (await import("../../models/subscription.model.js")).default;
    sendReminderEmail = (await import("../../utils/send-email.js"))
      .sendReminderEmail;
    dayjs = (await import("dayjs")).default;

    // Mock para a cadeia de chamadas: Subscription.findById(...).populate(...)
    Subscription.findById.mockReturnValue({
      populate: jest.fn(),
    });
  });

  it("deve não fazer nada se a assinatura não existir", async () => {
    // Agora o 'context.run' vai executar isso, e 'findById' será chamado.
    Subscription.findById().populate.mockResolvedValue(null);

    await sendReminders(contextMock);

    expect(Subscription.findById).toHaveBeenCalledWith("sub123");

    // Este teste agora irá falhar se o 'run' for chamado, o que está incorreto
    // A lógica do workflow chama 'run' para buscar a assinatura, então o expect precisa ser ajustado.
    // O correto é verificar se ele foi chamado UMA vez para buscar a assinatura.
    expect(contextMock.run).toHaveBeenCalledTimes(1);

    // As outras ações não devem acontecer
    expect(contextMock.sleepUntil).not.toHaveBeenCalled();
    expect(sendReminderEmail).not.toHaveBeenCalled();
  });

  it("deve não fazer nada se o status não for 'active'", async () => {
    Subscription.findById().populate.mockResolvedValue({
      status: "canceled",
    });

    await sendReminders(contextMock);

    expect(Subscription.findById).toHaveBeenCalledWith("sub123");

    // A mesma lógica do teste anterior se aplica aqui.
    expect(contextMock.run).toHaveBeenCalledTimes(1);

    expect(contextMock.sleepUntil).not.toHaveBeenCalled();
    expect(sendReminderEmail).not.toHaveBeenCalled();
  });

  it("deve parar o workflow se a renewalDate já passou", async () => {
    const pastDate = dayjs().subtract(1, "day").toDate();

    Subscription.findById().populate.mockResolvedValue({
      status: "active",
      renewalDate: pastDate,
      user: { email: "user@example.com" },
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await sendReminders(contextMock);

    // O 'run' ainda é chamado para buscar a assinatura
    expect(contextMock.run).toHaveBeenCalledTimes(1);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Renewal date has passed for subscription sub123")
    );

    consoleSpy.mockRestore();
  });

  // SUGESTÃO APLICADA: Teste reescrito para simular o cenário correto.
  it("deve agendar e enviar lembretes corretamente", async () => {
    // 1. A renewalDate agora é daqui a exatos 2 dias.
    const futureDate = dayjs().add(2, "day").toDate();
    const user = { email: "user@example.com" };
    const subscriptionMock = {
      _id: "sub123",
      status: "active",
      renewalDate: futureDate,
      user,
    };

    Subscription.findById().populate.mockResolvedValue(subscriptionMock);

    contextMock.sleepUntil.mockResolvedValue();

    await sendReminders(contextMock);

    // A primeira iteração do loop (7 dias) vai apenas agendar o 'sleepUntil'.
    // A terceira iteração (2 dias) vai encontrar uma data de lembrete que é hoje.
    expect(contextMock.sleepUntil).toHaveBeenCalled();

    // 2. O expect agora verifica a propriedade 'type', que é enviada pela função.
    expect(sendReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subscription: subscriptionMock,
        type: "2 days before reminder", // Verificando a propriedade 'type'
      })
    );
  });
});

// ===================================================================
//  afterAll para desconectar mongoose (mockado)
// ===================================================================
afterAll(async () => {
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
});
