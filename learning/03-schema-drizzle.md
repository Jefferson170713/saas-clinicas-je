# Separando e Entendendo as Tabelas do Schema no Drizzle ORM

Este documento explica como migrar de um arquivo de schema único (`schema.ts`) para uma estrutura de múltiplos arquivos, além de detalhar o que cada parte do código e cada tipo de coluna faz no banco de dados.

---

## 1. Entendendo os Tipos de Colunas e Modificadores

Antes de vermos os arquivos, é importante entender as funções que importamos do `drizzle-orm/pg-core` para criar nossas colunas:

**Tipos de Dados (Colunas):**
- `uuid`: Cria um Identificador Único Universal (ex: `123e4567-e89b-12d3-a456-426614174000`). É mais seguro e escalável do que usar IDs numéricos sequenciais.
- `text`: Armazena cadeias de texto (strings) de tamanho variável, como nomes, emails ou URLs.
- `integer`: Armazena números inteiros. Repare que salvamos preços em centavos (`appointmentPriceInCents`) para evitar erros de arredondamento com números decimais.
- `time`: Armazena apenas o horário (horas, minutos e segundos), sem a data.
- `timestamp`: Armazena a data e a hora exatas de um acontecimento.
- `pgEnum`: Cria uma lista restrita de valores aceitos (ex: `["male", "female"]`). O banco não aceitará nenhum valor fora dessa lista.

**Modificadores (Regras das Colunas):**
- `.primaryKey()`: Define a coluna como a chave principal da tabela (o identificador único daquele registro).
- `.defaultRandom()`: Gera um UUID aleatório automaticamente quando um novo registro é criado, sem precisarmos enviar do código.
- `.notNull()`: Torna a coluna obrigatória. O banco não aceitará salvar o registro se este campo estiver vazio.
- `.defaultNow()`: Preenche automaticamente a coluna com a data e hora do momento da criação.
- `.$onUpdate(() => new Date())`: Sempre que o registro for alterado, o Drizzle atualizará essa coluna com a data e hora atuais.
- `.references()`: Cria uma Chave Estrangeira (Foreign Key), ligando uma tabela a outra.
- `{ onDelete: "cascade" }`: Se o registro "pai" for deletado (ex: uma clínica), todos os registros "filhos" ligados a ele (ex: os médicos daquela clínica) também serão deletados automaticamente.

---

## 2. Atualizando o Drizzle Config

No arquivo `drizzle.config.ts`, mudamos a propriedade `schema` para apontar para a nossa nova pasta, avisando o Drizzle que ele deve ler todos os arquivos lá dentro.

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema", // Apontando para a pasta inteira
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 3. Nova Estrutura de Pastas

A estrutura passa a ser modular, onde cada entidade do nosso sistema tem seu próprio arquivo:

📦 src
 └ 📂 db
    └ 📂 schema
       ├ 📜 users.ts           (Usuários do sistema)
       ├ 📜 clinics.ts         (Clínicas cadastradas)
       ├ 📜 usersToClinics.ts  (Tabela pivô: liga usuários às clínicas)
       ├ 📜 doctors.ts         (Médicos das clínicas)
       ├ 📜 patients.ts        (Pacientes)
       ├ 📜 appointments.ts    (Agendamentos/Consultas)
       ├ 📜 relations.ts       (Configuração das relações virtuais)
       └ 📜 index.ts           (Exporta tudo para o resto do app)

---

## 4. Arquivos das Tabelas

Abaixo estão os arquivos separados. Quando uma tabela precisa referenciar outra através de uma chave estrangeira, importamos a tabela referenciada diretamente do seu arquivo.

**Arquivo:** `src/db/schema/users.ts`
*(Tabela simples que guarda os usuários do sistema)*
```typescript
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
});
```

**Arquivo:** `src/db/schema/clinics.ts`
*(Tabela de clínicas, guardando o nome e as datas de auditoria de criação/atualização)*
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

**Arquivo:** `src/db/schema/usersToClinics.ts`
*(Tabela "Pivô" para relação de Muitos-para-Muitos. Um usuário pode pertencer a várias clínicas e uma clínica pode ter vários usuários)*
```typescript
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { clinicsTable } from "./clinics";

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

**Arquivo:** `src/db/schema/doctors.ts`
*(Tabela de médicos. Pertence a uma clínica e guarda regras de negócio como horários, dias da semana, especialidade e preço da consulta)*
```typescript
import { integer, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { clinicsTable } from "./clinics";

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  specialty: text("specialty").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

**Arquivo:** `src/db/schema/patients.ts`
*(Tabela de pacientes. Introduzimos aqui o `pgEnum` para restringir o sexo apenas às opções permitidas)*
```typescript
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clinicsTable } from "./clinics";

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sex: patientSexEnum("sex").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

**Arquivo:** `src/db/schema/appointments.ts`
*(Tabela de consultas. Ela une três outras tabelas: acontece em uma Clínica, envolve um Paciente e é realizada por um Médico)*
```typescript
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { clinicsTable } from "./clinics";
import { patientsTable } from "./patients";
import { doctorsTable } from "./doctors";

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

---

## 5. O Arquivo de Relações (`relations.ts`)

O Drizzle possui uma funcionalidade poderosa de Queries Relacionais. Para que isso funcione, precisamos mapear como as tabelas interagem entre si em nível de código (relações de `one` para um, e `many` para muitos). 

**Arquivo:** `src/db/schema/relations.ts`
```typescript
import { defineRelations } from "drizzle-orm";
import { usersTable } from "./users";
import { clinicsTable } from "./clinics";
import { usersToClinicsTable } from "./usersToClinics";
import { doctorsTable } from "./doctors";
import { patientsTable } from "./patients";
import { appointmentsTable } from "./appointments";

export const relations = defineRelations(
  {
    usersTable,
    clinicsTable,
    usersToClinicsTable,
    doctorsTable,
    patientsTable,
    appointmentsTable,
  },
  (helpers) => ({
    // Um usuário tem ligações com várias clínicas
    usersTable: {
      usersToClinics: helpers.many.usersToClinicsTable(),
    },
    // A tabela pivô conecta exatamente UM usuário a UMA clínica por linha
    usersToClinicsTable: {
      user: helpers.one.usersTable({
        from: [helpers.usersToClinicsTable.userId],
        to: [helpers.usersTable.id],
      }),
      clinic: helpers.one.clinicsTable({
        from: [helpers.usersToClinicsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
    },
    // Uma clínica possui MUITOS médicos, pacientes, consultas e usuários
    clinicsTable: {
      doctors: helpers.many.doctorsTable(),
      patients: helpers.many.patientsTable(),
      appointments: helpers.many.appointmentsTable(),
      usersToClinics: helpers.many.usersToClinicsTable(),
    },
    // Um médico pertence a UMA clínica e tem MUITAS consultas
    doctorsTable: {
      clinic: helpers.one.clinicsTable({
        from: [helpers.doctorsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
      appointments: helpers.many.appointmentsTable(),
    },
    // Um paciente pertence a UMA clínica e tem MUITAS consultas
    patientsTable: {
      clinic: helpers.one.clinicsTable({
        from: [helpers.patientsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
      appointments: helpers.many.appointmentsTable(),
    },
    // Uma consulta pertence a UMA clínica, UM paciente e UM médico
    appointmentsTable: {
      clinic: helpers.one.clinicsTable({
        from: [helpers.appointmentsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
      patient: helpers.one.patientsTable({
        from: [helpers.appointmentsTable.patientId],
        to: [helpers.patientsTable.id],
      }),
      doctor: helpers.one.doctorsTable({
        from: [helpers.appointmentsTable.doctorId],
        to: [helpers.doctorsTable.id],
      }),
    },
  })
);
```

---

## 6. O Arquivo Index (`index.ts`)

Este arquivo unifica as exportações. Em vez de importarmos cada tabela separadamente nos outros arquivos do projeto, podemos importar tudo diretamente da pasta `schema`.

**Arquivo:** `src/db/schema/index.ts`
```typescript
export * from "./users";
export * from "./clinics";
export * from "./usersToClinics";
export * from "./doctors";
export * from "./patients";
export * from "./appointments";
export * from "./relations";
```