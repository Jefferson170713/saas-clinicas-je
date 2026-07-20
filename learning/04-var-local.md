# 03 - Configuração do Ambiente Local com Docker e Integração

Este documento detalha a infraestrutura local do projeto. Migramos de um banco de dados em nuvem para um ambiente de desenvolvimento local utilizando **Docker Compose**. O objetivo aqui é entender profundamente como as peças se conectam e por que essa arquitetura foi escolhida.

---

## 1. Subindo o Banco de Dados com Docker Compose

O problema clássico do desenvolvimento de software é a síndrome do "na minha máquina funciona". O Docker resolve isso criando ambientes isolados (contêineres) que rodam exatamente da mesma forma em qualquer sistema operacional. 

Para orquestrar isso, usamos o arquivo `compose.yaml` dentro da pasta `infra/`.

**Arquivo:** `infra/compose.yaml`
```yaml
services:
  db:
    image: postgres:16-alpine
    env_file:
      - ../.env.development
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Entendendo a fundo cada linha:
- **`services: db:`** Define um serviço chamado "db". Em uma arquitetura maior, poderíamos ter outros serviços aqui, como um Redis para cache.
- **`image: postgres:16-alpine`**: Aqui definimos a tecnologia e a versão exata (16). O sufixo `-alpine` significa que esta imagem usa o Alpine Linux, uma distribuição extremamente minimalista (geralmente em torno de 5MB). Isso reduz drasticamente o tempo de download da imagem, consome menos memória RAM do seu PC e diminui a superfície de ataque para vulnerabilidades.
- **`env_file:`**: O Docker precisa saber qual será o usuário, senha e nome do banco de dados para criar na primeira execução. Em vez de escrever essas senhas abertamente neste arquivo (o que é uma falha de segurança terrível, caso o arquivo vá para o GitHub), pedimos ao Docker para ler essas informações diretamente do nosso `.env.development`.
- **`ports: "5432:5432"`**: Contêineres rodam em uma rede isolada. O formato é `Porta_da_sua_maquina : Porta_do_conteiner`. Estamos abrindo um "túnel" para que a sua máquina real consiga conversar com o PostgreSQL que está isolado lá dentro, usando a porta padrão do Postgres (5432).
- **`volumes: pgdata:/var/lib/postgresql/data`**: **Esta é a parte mais crítica.** Contêineres são efêmeros, ou seja, se o contêiner for desligado ou destruído, tudo dentro dele é apagado. O PostgreSQL salva os dados físicos das tabelas na pasta `/var/lib/postgresql/data` (dentro do contêiner). Com essa linha de código, nós criamos um volume persistente (chamado `pgdata`) gerenciado pelo Docker no seu HD real. Mesmo que você apague o contêiner do banco de dados, seus registros, pacientes e agendamentos continuarão salvos no seu computador.

---

## 2. Configurando o Ambiente de Desenvolvimento

O Next.js tem um sistema nativo e inteligente para lidar com variáveis de ambiente. Ele reconhece automaticamente arquivos como `.env`, `.env.local` e `.env.development`.

**Arquivo:** `.env.development`
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=local_user
POSTGRES_DB=local_db
POSTGRES_PASSWORD=local_password
NODE_ENV=development
DATABASE_URL=postgres://local_user:local_password@localhost:5432/local_db
```

### Por que separamos as variáveis?
Se você observar, temos a string completa `DATABASE_URL` e as variáveis "soltas" (Host, Port, User, etc). 
1. **O Docker** não entende a string completa para inicializar o banco. Ele exige variáveis separadas (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) para saber como configurar a instância do PostgreSQL no momento em que o contêiner nasce.
2. **O Drizzle ORM e a sua aplicação Node/Next.js** preferem a `DATABASE_URL`, pois ela já contém o protocolo, credenciais e o caminho em uma única string padrão da web, facilitando a conexão com bibliotecas como o `pg`.

---

## 3. Automação Inteligente de Scripts no package.json

Para não termos que decorar comandos complexos do Docker e do Next, criamos atalhos (scripts) automatizados.

**Trecho do `package.json`:**
```json
  "scripts": {
    "dev": "npm run services:up && next dev",
    "services:up": "docker compose -f infra/compose.yaml up -d",
    "services:stop": "docker compose -f infra/compose.yaml stop",
    "services:down": "docker compose -f infra/compose.yaml down",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:check": "prettier --check .",
    "lint:fix": "prettier --write ."
  }
```

### O motivo dessas escolhas:
- **O super comando `dev`**: O `&&` diz ao terminal "Rode o primeiro comando e, SE ele der certo, rode o segundo". Ou seja, quando você roda `npm run dev`, ele **garante** que o banco de dados seja ligado antes de subir o servidor web do Next.js. Isso previne o erro clássico do servidor tentar conectar no banco de dados e falhar porque você esqueceu de rodar o Docker.
- **`up -d`**: A flag `-d` significa *detached* (desanexado). O Docker sobe o banco de dados em segundo plano e devolve o controle do terminal para você. Sem essa flag, seu terminal ficaria travado mostrando os logs infinitos do banco de dados.
- **`stop` vs `down`**: 
  - `stop`: Apenas "pausa" o contêiner. É como colocar o PC para dormir.
  - `down`: Destrói o contêiner e a rede virtual que o Docker criou para ele. (Fique tranquilo, graças ao `volume` que configuramos antes, seus dados no banco não serão destruídos, apenas o contêiner virtual).

---

## 4. O Comportamento do Drizzle e as Variáveis de Ambiente

O Drizzle Kit é uma ferramenta de linha de comando (CLI) que roda de forma totalmente separada da sua aplicação Next.js. 

Enquanto o Next.js lê arquivos `.env.development` automaticamente ao iniciar, o Drizzle **não faz isso**. Ele é um processo puro de Node.js isolado. É por isso que precisamos do pacote `dotenv` explícito no arquivo de configuração dele.

**Arquivo:** `drizzle.config.ts`
```typescript
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Força o ambiente Node a ler as variáveis do nosso arquivo de desenvolvimento
config({ path: ".env.development" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```
*(Sem a linha do `config`, o `process.env.DATABASE_URL` seria lido como "undefined" quando tentássemos rodar comandos no terminal, causando falhas de conexão).*

---

## 5. Dissecando os Comandos de Execução

Aqui explicamos o que acontece por baixo dos panos a cada comando que rodamos no terminal:

```bash
# 1. npx tsx src/index.ts
```
**O que é o TSX?** O Node.js não entende TypeScript de forma nativa. Normalmente, precisaríamos compilar tudo para JavaScript (`.js`) para depois executar. O pacote `tsx` (TypeScript Execute) faz essa compilação em tempo real na memória. Isso é fantástico para rodarmos arquivos isolados (como scripts para inserir dados falsos no banco, as famosas "seeds") de forma rápida.

```bash
# 2. npx drizzle-kit push
```
**Por que usar "push"?** Em bancos de dados tradicionais, nós geramos arquivos de migração (`.sql`) com o histórico de tudo o que foi alterado. O comando `push` é uma ferramenta ágil do Drizzle para prototipagem local: ele lê seu código TypeScript, compara com as tabelas que estão ativas no PostgreSQL agora, e aplica as diferenças diretamente, sem gerar arquivos intermediários de histórico. É a forma mais rápida de moldar o banco enquanto desenvolvemos.

```bash
# 3. docker compose -f infra/compose.yaml ps
```
**O que ele faz?** O `ps` (process status) pede ao Docker Compose para listar o status de todos os contêineres mapeados no nosso arquivo `compose.yaml`. Serve para verificarmos se a coluna "State" está como "Up" (Rodando) ou "Exited" (Parou com erro).

```bash
# 4. docker compose -f infra/compose.yaml exec db psql -U local_user -d local_db -c "\dt"
```
**A anatomia completa deste comando:**
- `exec db`: Instrui o Docker a abrir uma porta para executarmos um comando dentro do contêiner chamado "db".
- `psql`: Chamamos a ferramenta interativa de linha de comando oficial do PostgreSQL.
- `-U local_user -d local_db`: Entramos informando o Usuário (`-U`) e o Banco de Dados (`-d`).
- `-c "\dt"`: O parâmetro `-c` significa "Command". Estamos dizendo: "Entre no banco, rode o comando `\dt` (que lista todas as tabelas, do inglês *display tables*), me devolva o resultado impresso na tela e saia imediatamente do banco de dados". Sem o `-c`, nós ficaríamos presos dentro do terminal interno do PostgreSQL.