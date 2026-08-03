class InMemoryCache:
    """Fallback in-memory cache if Redis is not available locally."""
    def __init__(self):
        self._store = {}

    def get(self, key: str):
        return self._store.get(key)

    def set(self, key: str, value: str, ex: int = None):
        self._store[key] = value

    def delete(self, key: str):
        self._store.pop(key, None)

redis_cache = InMemoryCache()
