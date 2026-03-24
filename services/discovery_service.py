from pathlib import Path


def discover_backend_references() -> list[dict[str, str]]:
    project_root = Path(__file__).resolve().parent.parent

    references: list[dict[str, str]] = []

    main_file = project_root / "main.py"
    if main_file.exists():
        references.append(
            {
                "id": "backend-main",
                "label": "FastAPI Entry",
                "path": "main.py",
            }
        )

    for router_path in sorted((project_root / "routers").glob("*.py")):
        if router_path.name == "__init__.py":
            continue
        references.append(
            {
                "id": f"router-{router_path.stem}",
                "label": "Router Module",
                "path": f"routers/{router_path.name}",
            }
        )

    for service_path in sorted((project_root / "services").glob("*.py")):
        if service_path.name == "__init__.py":
            continue
        references.append(
            {
                "id": f"service-{service_path.stem}",
                "label": "Service Module",
                "path": f"services/{service_path.name}",
            }
        )

    if not references:
        references = [
            {
                "id": "fallback-main",
                "label": "FastAPI Entry",
                "path": "main.py",
            },
            {
                "id": "fallback-routers",
                "label": "API Routers",
                "path": "routers/",
            },
            {
                "id": "fallback-services",
                "label": "Business Logic",
                "path": "services/",
            },
        ]

    return references
