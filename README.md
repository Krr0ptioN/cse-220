# CSE-220 - Web Programming | Flavor Map

## Summary

### `CSE-220` _Web Programming Project_

This is a project developed as the final assignement of **CSE-220 Web Programming** at Acibadem University,
the backend is implemented in Django Python while the frontend is implemented in client/static only
Next.js application.

### Application Abstract

**Restaurant Review & Discovery Platform**, FlavorMap is a restaurant review and discovery platform
where users can discover restaurants, read and write reviews, rate their dining experiences, and
manage their favorite spots. Think of it as a simplified version of Yelp or Google Reviews, built
with Django and Next.js.

## Development Setup

Run setup from repository root:

```bash
./dev-setup.sh

# Windows PowerShell
./dev-setup.ps1
```

After setup, start the API with:

```bash
./nx run api:runserver

# Windows
./nx.bat run api:runserver
```

## Pre-commit

Install pre-commit once on your machine and register project hooks:

```bash
pipx install pre-commit
pre-commit install
```

Run all configured hooks manually:

```bash
pre-commit run --all-files
```
