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
Para melhorar a produtividade e manter o padrão de código, as seguintes extensões foram instaladas no ambiente:
- Tailwind CSS IntelliSense
- ESLint
- Prettier - Code formatter
- Simple React Snippets

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

*(Nota: Lembre-se de garantir que o plugin seja importado corretamente no topo do arquivo para que a configuração funcione).*