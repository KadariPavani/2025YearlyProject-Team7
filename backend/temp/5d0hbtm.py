
# Simulated input
input_lines = ["ac"]
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

# Your code here
print(input())