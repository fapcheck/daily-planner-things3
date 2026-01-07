# Contributing to Daily Planner

Thank you for your interest in contributing to Daily Planner! This document provides guidelines and instructions for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser version, Node.js version)
- Any relevant error messages

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- A clear and concise description
- Use cases for the enhancement
- Potential implementation ideas
- Examples of similar features in other applications

### Pull Requests

#### Before Submitting

1. **Fork the repository** and create your branch from `main`
2. **Read the documentation** to understand the project structure
3. **Set up your development environment** following the installation guide
4. **Make your changes** following the coding standards below

#### Making Changes

1. **Branch Naming**: Use descriptive branch names
   - `feature/your-feature-name` for new features
   - `fix/your-bug-fix` for bug fixes
   - `docs/your-doc-change` for documentation updates
   - `refactor/your-refactor` for code refactoring

2. **Commit Messages**: Follow conventional commits format
   - `feat: add task drag and drop`
   - `fix: resolve login issue on Safari`
   - `docs: update README with new features`
   - `refactor: improve task list performance`

3. **Code Style**:
   - Follow existing code style and patterns
   - Use TypeScript for all new code
   - Add JSDoc comments for complex functions
   - Keep functions small and focused

4. **Testing**:
   - Ensure your changes don't break existing functionality
   - Test on multiple browsers if applicable
   - Test on both light and dark themes
   - Test responsive design on different screen sizes

#### Submitting Your PR

1. Update your branch with the latest changes from `main`
2. Ensure all tests pass
3. Write a clear PR description including:
   - What changes you made and why
   - Any breaking changes
   - Screenshots or GIFs for UI changes
   - Related issue numbers

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript types
- Avoid `any` types
- Define interfaces for complex objects
- Use proper type guards

### React Components

- Use functional components with hooks
- Keep components focused and reusable
- Use proper TypeScript props interfaces
- Follow the atomic design principle
- Add proper error boundaries where needed

### Styling

- Use Tailwind CSS for styling
- Follow existing design system
- Ensure dark mode compatibility
- Maintain consistent spacing and sizing
- Use semantic HTML

### File Organization

- Keep related files together
- Use descriptive file names
- Follow the existing directory structure
- Keep component files focused

## 🔧 Development Workflow

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/daily-planner.git
cd daily-planner

# Install dependencies
npm install

# Create a new branch
git checkout -b feature/your-feature-name
```

### Development

```bash
# Start development server
npm run dev

# For desktop app development
npm run tauri:dev
```

### Testing

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Build the project
npm run build
```

### Committing

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name
```

## 🎨 Design Guidelines

### UI/UX Principles

- Maintain consistency with Things 3 aesthetic
- Prioritize simplicity and clarity
- Ensure good contrast and readability
- Provide smooth animations and transitions
- Support both light and dark themes

### Color Usage

- Use the Things 3 color palette defined in `tailwind.config.ts`
- Maintain sufficient color contrast (WCAG AA)
- Use colors consistently across the app

### Typography

- Use system fonts (San Francisco on Apple, Segoe UI on Windows)
- Maintain clear visual hierarchy
- Use appropriate font weights for emphasis

## 📚 Documentation

When adding new features:

1. Update the README if necessary
2. Add comments to complex code
3. Update TypeScript types
4. Include examples in code comments

## 🚀 Release Process

Releases are versioned using Semantic Versioning:

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

## 🤖 AI Features

When working with AI-related features:

- Respect privacy - no sensitive data should be sent to AI services
- Handle API failures gracefully
- Provide fallback behavior when AI is unavailable
- Cache responses when appropriate

## 🔒 Security

- Never commit sensitive data (API keys, passwords)
- Use environment variables for secrets
- Follow Supabase security best practices
- Implement proper input validation
- Use HTTPS for all API calls

## 💬 Questions or Issues?

- Check existing issues first
- Search for similar questions
- Create a new issue if needed
- Be patient - maintainers are volunteers

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

---

Thank you for contributing to Daily Planner! 🙏


