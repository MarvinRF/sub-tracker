```markdown
# SubDub - Subscription Tracker API

API RESTful para gerenciamento de assinaturas (subscriptions) com autenticação JWT, MongoDB/Mongoose e arquitetura Express modular.

Ideal para uso pessoal, dashboards administrativos ou integrações com sistemas de controle financeiro.

---

## 📦 Tecnologias

- Node.js
- Express
- MongoDB + Mongoose
- JWT (Autenticação)
- dotenv
- bcryptjs
- cookie-parser
- morgan (logger de requisições)
- ESLint + Prettier
- Nodemon (dev server)

---

## 📁 Estrutura de Pastas
```

sub-tracker/
│
├── config/ # Configuração de variáveis de ambiente
├── controllers/ # Lógica dos controladores (auth, etc.)
├── database/ # Conexão com MongoDB via Mongoose
├── middlewares/ # Tratamento de erros, autenticação, etc.
├── models/ # Schemas Mongoose (User, Subscription)
├── routes/ # Rotas Express REST (auth, users, subscriptions)
├── .env.\*.local # Variáveis de ambiente locais
├── app.js # Ponto de entrada da aplicação
└── README.md # Este arquivo

````

---

## 🧠 Modelagem dos Dados

### `User`

```ts
{
  name: string;
  email: string; // único e validado
  password: string; // min 6 caracteres (hash via bcrypt)
}
````

### `Subscription`

```ts
{
  name: string;
  price: number;
  currency: 'USD' | 'BRL' | 'EUR';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: 'sports' | 'news' | 'entertainment' | 'technology' | 'business' | ...;
  paymentMethod: string;
  status: 'active' | 'canceled' | 'expired';
  startDate: Date;
  renewalDate: Date;
  user: ObjectId; // ref para User
}
```

---

## 🧪 Instalação

### Pré-requisitos

- Node.js (v18+)
- MongoDB local ou Atlas
- `npm`, `pnpm` ou `yarn`

### Passos

```bash
git clone https://github.com/seu-usuario/subdub.git
cd subdub
npm install
```

Crie os arquivos `.env.development.local` e/ou `.env.production.local`:

```
DB_URI=mongodb://localhost:27017/subdub
NODE_ENV=development
JWT_SECRET=sua_chave_super_secreta
PORT=3000
```

---

## 🔧 Scripts

```bash
npm run dev     # Rodar com Nodemon em desenvolvimento
npm start       # Rodar em modo produção
```

---

## 📚 API Endpoints

### 🔐 Autenticação

Base path: `/api/v1/auth`

| Método | Rota        | Descrição                 |
| ------ | ----------- | ------------------------- |
| POST   | `/sign-up`  | Criação de usuário        |
| POST   | `/sign-in`  | Login e geração de JWT    |
| POST   | `/sign-out` | Logout (token invalidado) |

---

### 👤 Usuários

Base path: `/api/v1/users`

| Método | Rota   | Descrição                    |
| ------ | ------ | ---------------------------- |
| GET    | `/`    | Listar todos os usuários     |
| GET    | `/:id` | Obter detalhes de um usuário |
| POST   | `/`    | Criar um novo usuário        |
| PUT    | `/:id` | Atualizar dados do usuário   |
| DELETE | `/:id` | Deletar usuário              |

---

### 💳 Assinaturas

Base path: `/api/v1/subscriptions`

| Método | Rota                 | Descrição                                   |
| ------ | -------------------- | ------------------------------------------- |
| GET    | `/`                  | Listar todas as assinaturas                 |
| GET    | `/:id`               | Obter detalhes de uma assinatura            |
| POST   | `/`                  | Criar nova assinatura                       |
| PUT    | `/`                  | Atualizar assinatura                        |
| DELETE | `/`                  | Deletar assinatura                          |
| GET    | `/user/:id`          | Listar assinaturas de um usuário específico |
| PUT    | `/:id/cancel`        | Cancelar uma assinatura                     |
| GET    | `/upcoming-renewals` | Ver assinaturas com renovação próxima       |

---

## 🧠 Regras e Validações

- `renewalDate` é automaticamente calculada com base em `startDate` e `frequency` se não fornecida.
- `status` é automaticamente atualizado para `expired` se `renewalDate < Date.now()`.
- `renewalDate` deve ser maior que `startDate`.
- Apenas datas passadas são válidas como `startDate`.

---

## 🧹 ESLint + Prettier

Este projeto usa `eslint.config.js` baseado em ESModules, com:

- Regras de código consistentes (`eslint` oficial + `@eslint/js`)
- Autocorreção possível ao salvar com suporte de IDE
- Arquivo `.prettierrc` opcional para ajustes finos de formatação

---

## 🔒 Segurança

- Todas as rotas sensíveis devem ser protegidas com middleware de autenticação JWT.
- As senhas são criptografadas com `bcryptjs`.
- O token é assinado com `JWT_SECRET` do ambiente e entregue no login.

---

## 📌 Melhorias Futuras

- Integração com serviços de notificação (e.g. e-mail, WhatsApp)
- Dashboard em React.js
- Suporte a múltiplos usuários com roles
- Exportação de dados (CSV, PDF)
- Integração com métodos de pagamento reais

---

## 🧾 Licença

MIT © Marvin Rocha Sousa Ferreira

```

Se quiser que eu adicione um badge de status do build, cobertura de testes ou uma seção em inglês, posso incluir também. Deseja?
```
