import os
from pathlib import Path

ENV_FILE_PATH = Path(__file__).resolve().parent / ".env"


def load_env_file(path: Path):
    if not path.exists():
        return

    try:
        contents = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise RuntimeError(f"Unable to read {path}: {exc}") from exc

    for line in contents:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'").strip()
        if key and key not in os.environ:
            os.environ[key] = value


def load_api_key():
    api_key = os.getenv("ALPHAVANTAGE_API_KEY")
    if api_key:
        return api_key

    load_env_file(ENV_FILE_PATH)
    api_key = os.getenv("ALPHAVANTAGE_API_KEY")
    if api_key:
        return api_key

    raise RuntimeError(
        "Missing ALPHAVANTAGE_API_KEY. Ensure backend/.env defines it."
    )
