
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

# Your code here
# Input
arr,target=list(map(int,input().split())) ,int(input()) 

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
print(result)  # [0, 3]
