local count = redis.call('INCR', KEYS[2])
if count == 1 then redis.call('EXPIRE', KEYS[2], 3600) end
if count > 20 then return '' end
if redis.call('HGET', KEYS[1], 'id') ~= ARGV[1] then return '' end
local attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
if attempts > 5 then redis.call('DEL', KEYS[1]); return '' end
if redis.call('HGET', KEYS[1], 'digest') ~= ARGV[2] then
  if attempts == 5 then redis.call('DEL', KEYS[1]) end
  return ''
end
local userId = redis.call('HGET', KEYS[1], 'userId') or ''
redis.call('DEL', KEYS[1])
return userId
