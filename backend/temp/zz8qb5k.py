
# Simulated input
input_lines = ["123"]
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

# Your code here
def sum_of_digits(n: int) -> int:
    return sum(int(digit) for digit in str(abs(n)))

sum_of_digits(int(input()))