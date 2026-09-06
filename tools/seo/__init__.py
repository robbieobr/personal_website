"""Generates the SEO artefacts for a built frontend from the deployment's own files.

The canonical domain comes from the Caddyfile and the person comes from the
production seed. Both are gitignored host state, so when either is absent or
still holds its template placeholders the generator writes nothing.
"""

from .generate import generate

__all__ = ["generate"]
