from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')

if os.path.exists(dotenv_path):
  load_dotenv(dotenv_path)

def get_env_variable(name):
  try:
    return os.environ.get(name)
  except KeyError:
    message = "Expected environment variable '{}' not set.".format(name)
    raise Exception(message)