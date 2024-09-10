from collections import OrderedDict
import unittest
import io  # Add this import for StringIO
from unittest.mock import patch  # Add this import for patch

def merge_the_tools(string, k):
    for i in range(0, len(string), k):
        substring = string[i:i+k]
        unique_chars = OrderedDict.fromkeys(substring)
        print("".join(unique_chars))

class TestMergeTheTools(unittest.TestCase):

    def test_example_case(self):
        string = "AABCAAADA"
        k = 3
        expected_output = ["AB", "CA", "AD"]
        with patch('sys.stdout', new_callable=io.StringIO) as mock_stdout:
            merge_the_tools(string, k)
            output = mock_stdout.getvalue().strip().splitlines()
        self.assertEqual(output, expected_output)

    def test_empty_string(self):
        string = ""
        k = 3
        expected_output = []
        with patch('sys.stdout', new_callable=io.StringIO) as mock_stdout:
            merge_the_tools(string, k)
            output = mock_stdout.getvalue().strip().splitlines()
        self.assertEqual(output, expected_output)

    def test_single_character(self):
        string = "AAAA"
        k = 1
        expected_output = ["A", "A", "A", "A"]
        with patch('sys.stdout', new_callable=io.StringIO) as mock_stdout:
            merge_the_tools(string, k)
            output = mock_stdout.getvalue().strip().splitlines()
        self.assertEqual(output, expected_output)

if __name__ == '__main__':
    unittest.main()