"""Shared constants that are safe to import from any app without risking
circular dependencies (this module imports nothing from Django models)."""

LANGUAGE_CHOICES = [
    ("uk", "Українська"),
    ("en", "English"),
    ("pl", "Polski"),
    ("de", "Deutsch"),
    ("fr", "Français"),
    ("es", "Español"),
    ("it", "Italiano"),
    ("ru", "Русский"),
]

LANGUAGE_CODES = {code for code, _ in LANGUAGE_CHOICES}

DEFAULT_LANGUAGE = "uk"
