"""Спільні константи, які безпечно імпортувати з будь-якого застосунку без ризику
циклічних залежностей (цей модуль нічого не імпортує з Django-моделей)."""

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
