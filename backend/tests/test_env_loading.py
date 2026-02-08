import os
import unittest

from backend.config import ENV_FILE_PATH, load_api_key


class TestEnvLoading(unittest.TestCase):
    def setUp(self):
        self.previous = os.environ.pop("ALPHAVANTAGE_API_KEY", None)
        self.env_file_contents = None
        if ENV_FILE_PATH.exists():
            self.env_file_contents = ENV_FILE_PATH.read_text(encoding="utf-8")

    def tearDown(self):
        if self.previous is not None:
            os.environ["ALPHAVANTAGE_API_KEY"] = self.previous
        else:
            os.environ.pop("ALPHAVANTAGE_API_KEY", None)

        if self.env_file_contents is None:
            if ENV_FILE_PATH.exists():
                ENV_FILE_PATH.unlink()
        else:
            ENV_FILE_PATH.write_text(self.env_file_contents, encoding="utf-8")

    def test_loads_api_key_from_env_file(self):
        ENV_FILE_PATH.write_text(
            "ALPHAVANTAGE_API_KEY=test-key-from-env-file\n", encoding="utf-8"
        )

        api_key = load_api_key()

        self.assertEqual(api_key, "test-key-from-env-file")


if __name__ == "__main__":
    unittest.main()
