
# Simulated input
input_lines = ["234"]
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

n = int(input().strip())   # read input as integer
s = 0
for digit in str(abs(n)):
    s += int(digit)
print(s)