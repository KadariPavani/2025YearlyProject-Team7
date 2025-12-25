
# Simulated input
input_lines = ["[1, 2, 3, 4, 5] 9"]
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

# Medium: Subarray Sum Equals Target

# Input (example: [1, 2, 3, 4, 5] 9)
raw = input().strip()

# Find the array part and the target part
arr_str = raw[:raw.rfind("]")+1]   # everything till the last ']'
target_str = raw[raw.rfind("]")+1:].strip()  # everything after ']'

# Convert to usable formats
arr = list(map(int, arr_str.strip("[]").replace(" ", "").split(",")))
target = int(target_str)

# Logic
prefix_sum = {}
curr_sum = 0
result = -1

for i in range(len(arr)):
    curr_sum += arr[i]
    if curr_sum == target:
        result = [0, i]
        break
    if (curr_sum - target) in prefix_sum:
        result = [prefix_sum[curr_sum - target] + 1, i]
        break
    prefix_sum[curr_sum] = i

# Output
print(result)
