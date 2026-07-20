# 02 - Drizzle ORM e Configuração do Banco de Dados

Este documento documenta o uso do Drizzle ORM, a configuração do nosso banco de dados relacional (PostgreSQL) usando a plataforma Neon, e a estruturação inicial dos arquivos de conexão e schema.

## 1. O que é o Drizzle ORM?

O **Drizzle ORM** é um mapeador objeto-relacional (ORM) moderno e leve, construído para TypeScript e JavaScript. Ele é focado em ser _type-safe_ (seguro em relação aos tipos) e não impõe abstrações pesadas, permitindo escrever consultas muito próximas ao SQL puro. Vamos utilizá-lo em conjunto com o **PostgreSQL**, um banco de dados relacional robusto e amplamente utilizado no mercado.

---

## 2. Configuração do Banco de Dados no Neon

O [Neon](https://neon.tech/) é um banco de dados PostgreSQL _serverless_ na nuvem.

**Passos realizados:**

1. Acessamos o painel do Neon e criamos uma nova conexão/projeto de banco de dados.
2. Copiamos a _Connection String_ fornecida pela plataforma.
3. Na raiz do projeto, criamos um arquivo chamado `.env`.
4. Dentro do `.env`, criamos a variável `DATABASE_URL` e colamos a string de conexão:

```env
DATABASE_URL="sua_connection_string_aqui"
```

---

## 3. Instalação das Dependências

Com o banco de dados provisionado, instalamos o Drizzle ORM, o driver do PostgreSQL (`pg`), o `dotenv` para ler as variáveis de ambiente, e as ferramentas de desenvolvimento do Drizzle Kit.

No terminal, executamos:

```bash
npm i drizzle-orm@rc pg dotenv
npm i -D drizzle-kit@rc tsx @types/pg
```

---

## 4. Configuração do Cliente de Banco de Dados

Para centralizar a conexão com o banco, criamos uma pasta `db` dentro do diretório `src` e adicionamos o arquivo de inicialização.

**Arquivo:** `src/db/index.ts`

```typescript
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(process.env.DATABASE_URL!);

export default db;
```

---

## 5. Configuração do Drizzle Kit

O Drizzle Kit é a ferramenta de CLI responsável por gerar e gerenciar as migrações do banco de dados baseadas no nosso código. Precisamos de um arquivo de configuração na raiz do projeto para que ele saiba onde estão nossos schemas e como se conectar ao banco.

**Arquivo:** `drizzle.config.ts` (na raiz do projeto)

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 6. Criação do Arquivo de Schema

Por fim, preparamos o arquivo onde modelaremos as tabelas do nosso banco de dados relacional. O arquivo é criado dentro da pasta `db` configurada anteriormente.

**Arquivo:** `src/db/schema.ts`

Neste arquivo, iremos declarar todas as tabelas, colunas e relacionamentos utilizando as funções do Drizzle (ex: `pgTable`, `varchar`, `integer`, etc.), garantindo o _type-safety_ ponta a ponta na nossa aplicação.
