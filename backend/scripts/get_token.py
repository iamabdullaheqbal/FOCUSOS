import sys, os, jwt, datetime
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dotenv import load_dotenv
load_dotenv()
secret = os.environ.get("APP_SECRET_KEY", "your-long-random-secret-key-here")
now = datetime.datetime.now(datetime.timezone.utc)
token = jwt.encode({
    "sub": "61e81e62-4491-4858-b5ff-56801b23220e",
    "email": "abdullaheqbalhere@gmail.com",
    "full_name": "Abdullah",
    "exp": now + datetime.timedelta(hours=24),
    "iat": now.timestamp(),
}, secret, algorithm="HS256")
print(token)
