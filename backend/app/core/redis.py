class MockRedis:
    def __init__(self):
        self.cache = {}
    async def get(self, key):
        return self.cache.get(key)
    async def setex(self, key, time, value):
        self.cache[key] = value

redis_client = MockRedis()

async def get_redis():
    return redis_client
