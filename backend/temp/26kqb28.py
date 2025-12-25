
# Simulated input
input_lines = ["Java and Python"]
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

# Your code here
# Input
sentence = input()
# Logic
words = sentence.split()
longest = ""
for word in words:
    if len(word) > len(longest):
        longest = word
# Output
print(longest)  # Python
