# Setup do Projeto - Next.js 15

Este documento registra o passo a passo da criação e configuração inicial do projeto, rodando no **GitHub Codespaces**.

## 1. Tecnologias e Versões

- **Next.js:** Versão 15.3.2
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS

A estrutura inicial e as instalações seguiram as documentações oficiais:

- [Next.js Installation](https://nextjs.org/docs/app/getting-started/installation)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 2. Extensões do VS Code (Codespaces)

Para melhorar a produtividade, garantir a qualidade e manter o padrão de código, as seguintes extensões foram instaladas no ambiente. Abaixo detalhamos o propósito de cada uma:

- **Tailwind CSS IntelliSense:**
  Esta extensão é essencial para o fluxo de trabalho com Tailwind. Ela fornece recursos avançados como _autocompletar_ (sugere as classes utilitárias enquanto você digita), _linting_ (destaca possíveis erros ou conflitos de classes) e _hover preview_ (permite ver exatamente qual CSS tradicional está sendo aplicado por trás de uma classe ao passar o mouse sobre ela). Isso acelera o desenvolvimento e reduz a necessidade de consultar a documentação constantemente.

- **ESLint:**
  Uma ferramenta de análise estática de código. O ESLint examina o seu código JavaScript/TypeScript em busca de problemas estruturais, bugs em potencial ou violações de boas práticas. Ele ajuda a manter a consistência do código, detectando erros de sintaxe ou de lógica antes mesmo da aplicação ser executada, garantindo um código mais seguro e robusto.

- **Prettier - Code formatter:**
  Um formatador de código "opinativo". O papel do Prettier é pegar todo o código escrito e reformatá-lo automaticamente seguindo um conjunto de regras rígidas de estilização (como espaçamento, quebra de linha, uso de aspas simples ou duplas, etc.). Isso elimina inconsistências visuais no código e garante que todos os arquivos do projeto tenham uma aparência unificada e limpa, independentemente de quem o escreveu.

- **Simple React Snippets:**
  Extensão que disponibiliza atalhos (snippets) rápidos para criar estruturas de código muito comuns no ecossistema React. Por exemplo, com poucos toques no teclado você pode gerar a estrutura completa de um novo componente, importar hooks ou criar funções. Isso acelera significativamente a codificação, eliminando a digitação de códigos repetitivos (boilerplate).

---

## 3. Configuração do Prettier com Tailwind CSS

Para garantir que as classes do Tailwind sejam ordenadas automaticamente ao salvar os arquivos, configuramos o Prettier com o seu respectivo plugin.

**Passo 3.1:** Instalação das dependências via terminal

```bash
npm install -D prettier prettier-plugin-tailwindcss prettier@3.9.5
```

**Passo 3.2:** Configuração do arquivo
Na raiz do projeto, foi criado o arquivo `.prettierrc.json` com a seguinte configuração:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## 4. Configuração do ESLint com Simple Import Sort

Para manter as importações dos arquivos organizadas de forma padronizada e automática, adicionamos o plugin `simple-import-sort`.

**Passo 4.1:** Instalação do plugin via terminal

```bash
npm i eslint-plugin-simple-import-sort -D
```

**Passo 4.2:** Atualização das regras do ESLint
No arquivo `eslint.config.mjs` (na raiz do projeto), a configuração foi ajustada para incluir o plugin e suas regras. O arquivo ficou com a seguinte estrutura:

```javascript
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
];

export default eslintConfig;
```

_(Nota: Lembre-se de garantir que o plugin seja importado corretamente no topo do arquivo para que a configuração funcione)._
