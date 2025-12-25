
# Simulated input
input_lines = ["1 1"]
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

# Your code here
a,b=map(int,input().split())
print(a+b)