
# Contributing

We welcome contributions from the community! Please read this guide before submitting a pull request.

---

## How to Contribute

### **1️⃣ Bug Fixes & Enhancements**
- Check for existing issues before opening a new one.
- Submit a PR from a **feature branch** (not `main`).
- Ensure your code follows existing **TypeScript best practices**.

### **2️⃣ Adding a New Feature**
- Open an **issue first** to discuss your approach.
- If approved, create a **new feature branch** (`feature/your-feature`).
- Implement tests if applicable.
- Submit a **pull request**.

### **3️⃣ Creating a Custom Renderer**
- Contextr supports **pluggable renderers**.
- Implement the **Renderer** interface:

```ts
export interface Renderer<T = unknown> {
  render(context: FileContext): T;
}
```

If your renderer is useful for others, submit it as a PR!

💡 Development Setup

1.	Clone the repo:

```bash
git clone https://github.com/7SigmaLLC/file-context-builder.git
```

```
cd file-context-builder
```

2.	Install dependencies:

```bash
yarn install
```


3.	Run the example:

```
yarn example
```

This will generate a context snapshot of your code files to ./.context.out (git ignored), which can be fed into an LLM for analysis, refactoring, or intelligent suggestions.


⚖️ Code of Conduct

By contributing, you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).

Thanks for your help in making File Context Builder better! 🚀

---

[Back to README.md](./README.md)


