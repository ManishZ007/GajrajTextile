-- All keys share a Redis cluster hash tag. Limits survive consumption/resend.
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
if tonumber(redis.call('GET', KEYS[3]) or '0') >= 5 then return -1 end
if tonumber(redis.call('GET', KEYS[4]) or '0') >= 300 then return -1 end
local phoneCount = redis.call('INCR', KEYS[3])
if phoneCount == 1 then redis.call('EXPIRE', KEYS[3], 3600) end
local clientCount = redis.call('INCR', KEYS[4])
if clientCount == 1 then redis.call('EXPIRE', KEYS[4], 3600) end
redis.call('SET', KEYS[2], '1', 'EX', 60)
redis.call('DEL', KEYS[1])
redis.call('HSET', KEYS[1], 'id', ARGV[1], 'digest', ARGV[2], 'userId', ARGV[3], 'attempts', '0')
redis.call('EXPIRE', KEYS[1], 300)
return 1
